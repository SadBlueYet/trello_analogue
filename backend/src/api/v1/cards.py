import pprint
from typing import Any, List, Tuple, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core import deps
from src.core.deps import check_board_access
from src.models.user import User
from src.schemas.card import CardCreate, CardUpdate, CardWithAssignee, MoveCard
from src.schemas.comment import CommentCreate, CommentUpdate, CommentWithUser
from src.tasks import send_comment_notification, send_email
from src.services.factory import ServiceFactory

router = APIRouter()


def generate_board_prefix(board_title: str) -> str:
    """
    Generate board prefix from board title by taking first letter of each word.
    Example: "Awesome Board" -> "AB"
    """
    if not board_title or not (words := board_title.split()):
        return "TA"
    return "".join(word[0].upper() for word in words)


async def get_card_context(
    card_id: int,
    factory: ServiceFactory,
    user: User,
    required_access: List[str]
) -> tuple[Any, Any, Any, str]:
    """Get card context including card, list, board and formatted card ID."""
    card_service = factory.create_card_service()
    list_service = factory.create_list_service()
    board_service = factory.create_board_service()
    board_share_service = factory.create_board_share_service()
    if not (card := await card_service.get_card(card_id)):
        raise HTTPException(status_code=404, detail="Card not found")

    if not (list_obj := await list_service.get_list(card.list_id)):
        raise HTTPException(status_code=404, detail="List not found")

    if not (board := await board_service.get_board(list_obj.board_id)):
        raise HTTPException(status_code=404, detail="Board not found")

    await check_board_access(board, user, required_access, board_share_service)
    
    formatted_id = f"{generate_board_prefix(board.title)}-{card.card_id}"
    return card, list_obj, board, formatted_id


async def notify_assignee(
    card: Any,
    formatted_id: str,
    current_user: User,
    board_id: int,
    factory: ServiceFactory,
    comment_text: Optional[str] = None
) -> None:
    """Notify card assignee about changes or comments."""
    if not card.assignee_id or card.assignee_id == current_user.id:
        return

    user_service = factory.create_user_service()
    if not (assignee := await user_service.get_user_by_id(card.assignee_id)):
        return

    notification_data = {
        "email": assignee.email,
        "username": assignee.username,
        "card_title": card.title,
        "formatted_id": formatted_id,
        "current_username": current_user.username,
        "board_id": board_id,
    }

    if comment_text:
        send_comment_notification.delay(**notification_data, comment_text=comment_text)
    else:
        send_email.delay(**notification_data)


async def get_card_with_assignee(
    card: Any,
    formatted_id: str,
    factory: ServiceFactory
) -> CardWithAssignee:
    """Convert card to CardWithAssignee format with assignee information."""
    user_service = factory.create_user_service()
    assignee = None
    if card.assignee_id:
        assignee = await user_service.get_user_by_id(card.assignee_id)
    return CardWithAssignee(**card.__dict__, assignee=assignee, formatted_id=formatted_id)


@router.get("/", response_model=List[CardWithAssignee])
async def get_cards(
    list_id: int = Query(..., description="ID of the list"),
    current_user: User = Depends(deps.get_current_active_user),
    factory: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),
) -> list[CardWithAssignee]:
    """Get all cards in a list."""
    list_service = factory.create_list_service()
    board_service = factory.create_board_service()
    card_service = factory.create_card_service()
    board_share_service = factory.create_board_share_service()
    if not (list_obj := await list_service.get_list(list_id)):
        raise HTTPException(status_code=404, detail="List not found")

    if not (board := await board_service.get_board(list_obj.board_id)):
        raise HTTPException(status_code=404, detail="Board not found")

    await check_board_access(board, current_user, ["read", "write", "admin"], board_share_service)

    cards = await card_service.get_list_cards(list_id)
    board_prefix = generate_board_prefix(board.title)

    result = []
    for card in cards:
        result.append(CardWithAssignee(**card.__dict__, formatted_id=f"{board_prefix}-{card.card_id}"))
    return result


@router.post("/", response_model=CardWithAssignee)
async def create_card(
    card_in: CardCreate,
    current_user: User = Depends(deps.get_current_active_user),
    factory: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),
) -> CardWithAssignee:
    """Create a new card."""
    list_service = factory.create_list_service()
    board_service = factory.create_board_service()
    card_service = factory.create_card_service()
    board_share_service = factory.create_board_share_service()
    
    if not (list_obj := await list_service.get_list(card_in.list_id)):
        raise HTTPException(status_code=404, detail="List not found")

    if not (board := await board_service.get_board(list_obj.board_id)):
        raise HTTPException(status_code=404, detail="Board not found")

    await check_board_access(board, current_user, ["write", "admin"], board_share_service)

    card = await card_service.create_card(card_in)
    formatted_id = f"{generate_board_prefix(board.title)}-{card.card_id}"
    
    return await get_card_with_assignee(card, formatted_id, factory)


@router.put("/{card_id}", response_model=CardWithAssignee)
async def update_card(
    card_id: int,
    card_in: CardUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    factory: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),
) -> CardWithAssignee:
    """Update an existing card."""
    card_service = factory.create_card_service()
    card, _, board, formatted_id = await get_card_context(
        card_id, factory, current_user, ["write", "admin"]
    )

    card = await card_service.update_card(card, card_in)
    await notify_assignee(card, formatted_id, current_user, board.id, factory)
    
    return await get_card_with_assignee(card, formatted_id, factory)


@router.delete("/{card_id}")
async def delete_card(
    card_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    factory: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),
) -> dict:
    """Delete a card."""
    card_service = factory.create_card_service()
    await get_card_context(card_id, factory, current_user, ["write", "admin"])
    await card_service.delete_card(card_id)
    return {"message": "Card deleted successfully"}


@router.post("/{card_id}/move", response_model=CardWithAssignee)
async def move_card(
    card_id: int,
    move_data: MoveCard,
    current_user: User = Depends(deps.get_current_active_user),
    factory: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),
) -> CardWithAssignee:
    """Move a card to a different list."""
    card_service = factory.create_card_service()
    list_service = factory.create_list_service()
    
    card, source_list, board, formatted_id = await get_card_context(
        card_id, factory, current_user, ["write", "admin"]
    )

    if not (target_list := await list_service.get_list(move_data.target_list_id)):
        raise HTTPException(status_code=404, detail="Target list not found")

    if source_list.board_id != target_list.board_id:
        raise HTTPException(status_code=400, detail="Cannot move card between different boards")

    if card.list_id != move_data.target_list_id:
        await notify_assignee(card, formatted_id, current_user, board.id, factory)

    card = await card_service.move_card(
        card_id=card_id,
        target_list_id=move_data.target_list_id,
        new_position=move_data.new_position,
    )
    
    return await get_card_with_assignee(card, formatted_id, factory)


@router.get("/{card_id}/comments", response_model=List[CommentWithUser])
async def get_card_comments(
    card_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    factory: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),
) -> List[CommentWithUser]:
    """Get all comments for a card."""
    user_service = factory.create_user_service()
    comment_service = factory.create_comment_service()
    
    await get_card_context(card_id, factory, current_user, ["read", "write", "admin"])
    comments = await comment_service.get_card_comments(card_id)

    for comment in comments:
        comment.user = await user_service.get_user_by_id(comment.user_id)

    return comments


@router.post("/{card_id}/comments", response_model=CommentWithUser)
async def create_comment(
    card_id: int,
    comment_in: CommentCreate,
    current_user: User = Depends(deps.get_current_active_user),
    factory: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),
) -> CommentWithUser:
    """Create a new comment for a card."""
    user_service = factory.create_user_service()
    comment_service = factory.create_comment_service()

    card, _, board, formatted_id = await get_card_context(
        card_id, factory, current_user, ["write", "admin"]
    )

    comment = await comment_service.create_comment(comment_in, current_user.id)
    comment.user = await user_service.get_user_by_id(comment.user_id)
    
    await notify_assignee(card, formatted_id, current_user, board.id, factory, comment_in.text)
    return comment


@router.put("/{card_id}/comments/{comment_id}", response_model=CommentWithUser)
async def update_comment(
    card_id: int,
    comment_id: int,
    comment_in: CommentUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    factory: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),
) -> CommentWithUser:
    user_service = factory.create_user_service()
    comment_service = factory.create_comment_service()
    board_share_service = factory.create_board_share_service()
    card, _, board, _ = await get_card_context(card_id, factory, current_user, ["read"])

    if not (comment := await comment_service.get_comment(comment_id)):
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.card_id != card.id:
        raise HTTPException(status_code=400, detail="Comment does not belong to this card")

    if comment.user_id != current_user.id:
        await check_board_access(board, current_user, ["write", "admin"], board_share_service)

    comment = await comment_service.update_comment(comment, comment_in)
    comment.user = await user_service.get_user_by_id(comment.user_id)
    return comment


@router.delete("/{card_id}/comments/{comment_id}")
async def delete_comment(
    card_id: int,
    comment_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    factory: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),
) -> dict:
    """Delete a comment."""
    comment_service = factory.create_comment_service()
    board_share_service = factory.create_board_share_service()
    
    card, _, board, _ = await get_card_context(card_id, factory, current_user, ["read"])

    if not (comment := await comment_service.get_comment(comment_id)):
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.card_id != card.id:
        raise HTTPException(status_code=400, detail="Comment does not belong to this card")

    if comment.user_id != current_user.id:
        await check_board_access(board, current_user, ["write", "admin"], board_share_service)

    await comment_service.delete_comment(comment)
    return {"success": True}
