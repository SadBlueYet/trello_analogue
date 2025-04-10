from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core import deps
from src.core.deps import check_board_access
from src.crud import board as crud_board
from src.crud import board_share as crud_board_share
from src.crud import card as crud_card
from src.crud import comment as crud_comment
from src.crud import list as crud_list
from src.crud import user as crud_user
from src.models.user import User
from src.schemas.card import CardCreate, CardUpdate, CardWithAssignee, MoveCard
from src.schemas.comment import CommentCreate, CommentUpdate, CommentWithUser
from src.tasks import send_comment_notification, send_email

router = APIRouter()


# Helper function to generate board prefix from title
def generate_board_prefix(board_title: str) -> str:
    """
    Generate board prefix from board title by taking first letter of each word.
    Example: "Awesome Board" -> "AB"
    """
    if not board_title:
        return "TA"

    words = board_title.split()
    if not words:
        return "TA"

    return "".join([word[0].upper() for word in words if word])


@router.get("/", response_model=List[CardWithAssignee])
async def get_cards(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_id: int = Query(..., description="ID of the list"),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    list_obj = await crud_list.get_list(db, list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")

    board = await crud_board.get_board(db, list_obj.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await check_board_access(board, current_user, db, ["read", "write", "admin"])

    cards = await crud_card.get_list_cards(db, list_id)

    # Generate board prefix for formatted IDs
    board_prefix = generate_board_prefix(board.title)

    result = []
    for card in cards:
        card_dict = card.__dict__
        card_dict = {k: v for k, v in card_dict.items() if not k.startswith("_")}

        card_dict["formatted_id"] = f"{board_prefix}-{card.card_id}"

        result.append(card_dict)

    return result


@router.post("/", response_model=CardWithAssignee)
async def create_card(
    *,
    db: AsyncSession = Depends(deps.get_db),
    card_in: CardCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new card.
    """
    # Check if list exists
    list_obj = await crud_list.get_list(db, card_in.list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")

    board = await crud_board.get_board(db, list_obj.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await check_board_access(board, current_user, db, ["write", "admin"])

    card = await crud_card.create_card(db, card_in)
    assignee = None
    if card.assignee_id:
        assignee = await crud_user.get_user(db, card.assignee_id)

    board_prefix = generate_board_prefix(board.title)
    formatted_id = f"{board_prefix}-{card.card_id}"

    return {**card.__dict__, "assignee": assignee, "formatted_id": formatted_id}


@router.get("/{card_id}", response_model=CardWithAssignee)
async def get_card(
    *,
    db: AsyncSession = Depends(deps.get_db),
    card_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="CardInDBBase not found")

    list_obj = await crud_list.get_list(db, card.list_id)
    board = await crud_board.get_board(db, list_obj.board_id)

    await check_board_access(board, current_user, db, ["read", "write", "admin"])

    comments = await crud_comment.get_card_comments(db, card_id)

    formatted_comments = []
    for comment in comments:
        comment_dict = comment.__dict__
        comment_dict = {k: v for k, v in comment_dict.items() if not k.startswith("_")}

        user = await crud_user.get_user(db, comment.user_id)
        user_dict = {k: v for k, v in user.__dict__.items() if not k.startswith("_")}

        comment_dict["user"] = user_dict
        formatted_comments.append(comment_dict)

    assignee = None
    if card.assignee_id:
        assignee = await crud_user.get_user(db, card.assignee_id)

    board_prefix = generate_board_prefix(board.title)
    formatted_id = f"{board_prefix}-{card.card_id}"

    return {
        **card.__dict__,
        "assignee": assignee,
        "comments": formatted_comments,
        "formatted_id": formatted_id,
    }


@router.put("/{card_id}", response_model=CardWithAssignee)
async def update_card(
    *,
    db: AsyncSession = Depends(deps.get_db),
    card_id: int,
    card_in: CardUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="CardInDBBase not found")

    list_obj = await crud_list.get_list(db, card.list_id)
    board = await crud_board.get_board(db, list_obj.board_id)

    await check_board_access(board, current_user, db, ["write", "admin"])

    card = await crud_card.update_card(db, card, card_in)

    # Generate formatted ID for response
    board_prefix = generate_board_prefix(board.title)
    formatted_id = f"{board_prefix}-{card.card_id}"

    assignee = None
    if card.assignee_id:
        assignee = await crud_user.get_user(db, card.assignee_id)

        if card.assignee_id != current_user.id:
            send_email.delay(
                assignee.email,
                assignee.username,
                card.title,
                formatted_id,  # Use the formatted ID here
                current_user.username,
                board.id,
            )

    return {**card.__dict__, "assignee": assignee, "formatted_id": formatted_id}


@router.delete("/{card_id}")
async def delete_card(
    *,
    db: AsyncSession = Depends(deps.get_db),
    card_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="CardInDBBase not found")

    list_obj = await crud_list.get_list(db, card.list_id)
    board = await crud_board.get_board(db, list_obj.board_id)

    await check_board_access(board, current_user, db, ["write", "admin"])

    await crud_card.delete_card(db, card_id)
    return {"message": "CardInDBBase deleted successfully"}


@router.post("/{card_id}/move", response_model=CardWithAssignee)
async def move_card(
    *,
    db: AsyncSession = Depends(deps.get_db),
    card_id: int,
    move_data: MoveCard,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="CardInDBBase not found")

    # Проверяем исходный список и доску
    source_list = await crud_list.get_list(db, card.list_id)
    source_board = await crud_board.get_board(db, source_list.board_id)

    target_list = await crud_list.get_list(db, move_data.target_list_id)
    if not target_list:
        raise HTTPException(status_code=404, detail="Target list not found")

    # Проверяем, что целевой список принадлежит той же доске
    if source_list.board_id != target_list.board_id:
        raise HTTPException(status_code=400, detail="Cannot move card between different boards")

    await check_board_access(source_board, current_user, db, ["write", "admin"])

    board_prefix = generate_board_prefix(source_board.title)
    formatted_id = f"{board_prefix}-{card.card_id}"

    if card.assignee_id:
        assignee = await crud_user.get_user(db, card.assignee_id)

        if card.list_id != move_data.target_list_id and card.assignee_id != current_user.id:
            send_email.delay(
                assignee.email,
                assignee.username,
                card.title,
                formatted_id,
                current_user.username,
                source_board.id,
            )

    card = await crud_card.move_card(
        db,
        card_id=card_id,
        target_list_id=move_data.target_list_id,
        new_position=move_data.new_position,
    )

    assignee = None
    if card and card.assignee_id:
        assignee = await crud_user.get_user(db, card.assignee_id)

    if card:
        return {**card.__dict__, "assignee": assignee, "formatted_id": formatted_id}
    return None


@router.get("/{card_id}/comments", response_model=List[CommentWithUser])
async def get_card_comments(
    *,
    db: AsyncSession = Depends(deps.get_db),
    card_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    list_obj = await crud_list.get_list(db, card.list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")

    board = await crud_board.get_board(db, list_obj.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await check_board_access(board, current_user, db, ["read", "write", "admin"])

    comments = await crud_comment.get_card_comments(db, card_id)

    result = []
    for comment in comments:
        comment_dict = comment.__dict__
        comment_dict = {k: v for k, v in comment_dict.items() if not k.startswith("_")}

        user = await crud_user.get_user(db, comment.user_id)
        user_dict = {k: v for k, v in user.__dict__.items() if not k.startswith("_")}

        comment_dict["user"] = user_dict
        result.append(comment_dict)

    return result


@router.post("/{card_id}/comments", response_model=CommentWithUser)
async def create_comment(
    *,
    db: AsyncSession = Depends(deps.get_db),
    card_id: int,
    comment_in: CommentCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    # Check if list exists
    list_obj = await crud_list.get_list(db, card.list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")

    # Check if board exists
    board = await crud_board.get_board(db, list_obj.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await check_board_access(board, current_user, db, ["write", "admin"])

    comment = await crud_comment.create_comment(db, comment_in, current_user.id)

    comment_dict = comment.__dict__
    comment_dict = {k: v for k, v in comment_dict.items() if not k.startswith("_")}

    user = await crud_user.get_user(db, comment.user_id)
    user_dict = {k: v for k, v in user.__dict__.items() if not k.startswith("_")}

    comment_dict["user"] = user_dict

    # Если у карточки есть ответственный, отправляем ему уведомление о новом комментарии
    if (
        card.assignee_id and card.assignee_id != current_user.id
    ):  # Don't notify if the assignee is the one who commented
        assignee = await crud_user.get_user(db, card.assignee_id)
        if assignee:
            # Generate formatted task ID
            board_prefix = generate_board_prefix(board.title)
            formatted_id = f"{board_prefix}-{card.card_id}"

            # Отправляем email-уведомление с информацией о новом комментарии
            send_comment_notification.delay(
                assignee.email,
                assignee.username,
                card.title,
                formatted_id,
                current_user.username,
                board.id,
                comment_in.text,  # Pass the comment text
            )

    return comment_dict


@router.put("/{card_id}/comments/{comment_id}", response_model=CommentWithUser)
async def update_comment(
    *,
    db: AsyncSession = Depends(deps.get_db),
    card_id: int,
    comment_id: int,
    comment_in: CommentUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    comment = await crud_comment.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.card_id != card.id:
        raise HTTPException(status_code=400, detail="Comment does not belong to this card")

    if comment.user_id != current_user.id:
        list_obj = await crud_list.get_list(db, card.list_id)
        board = await crud_board.get_board(db, list_obj.board_id)

        await check_board_access(board, current_user, db, ["write", "admin"])

    comment = await crud_comment.update_comment(db, comment, comment_in)

    comment_dict = {k: v for k, v in comment.__dict__.items() if not k.startswith("_")}

    user = await crud_user.get_user(db, comment.user_id)
    user_dict = {k: v for k, v in user.__dict__.items() if not k.startswith("_")}

    comment_dict["user"] = user_dict

    return comment_dict


@router.delete("/{card_id}/comments/{comment_id}")
async def delete_comment(
    *,
    db: AsyncSession = Depends(deps.get_db),
    card_id: int,
    comment_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    comment = await crud_comment.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.card_id != card.id:
        raise HTTPException(status_code=400, detail="Comment does not belong to this card")

    if comment.user_id != current_user.id:
        list_obj = await crud_list.get_list(db, card.list_id)
        board = await crud_board.get_board(db, list_obj.board_id)

        await check_board_access(board, current_user, db, ["write", "admin"])

    await crud_comment.delete_comment(db, comment)

    return {"success": True}
