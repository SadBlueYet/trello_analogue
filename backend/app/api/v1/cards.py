from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core import deps
from backend.app.crud import card as crud_card
from backend.app.crud import list as crud_list
from backend.app.crud import board as crud_board
from backend.app.crud import board_share as crud_board_share
from backend.app.crud import comment as crud_comment
from backend.app.crud import user as crud_user
from backend.app.models.user import User
from backend.app.schemas.card import CardInDBBase, CardCreate, CardUpdate, MoveCard, CardWithAssignee
from backend.app.schemas.comment import CommentCreate, CommentUpdate, CommentWithUser

router = APIRouter()


@router.get("/", response_model=List[CardWithAssignee])
async def get_cards(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_id: int = Query(..., description="ID of the list"),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all cards in a list.
    """
    list_obj = await crud_list.get_list(db, list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")
    
    board = await crud_board.get_board(db, list_obj.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Проверяем доступ: либо владелец, либо имеет доступ к доске
    if board.owner_id != current_user.id:
        # Проверяем наличие доступа к доске через BoardShare
        board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
        if not board_share:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        
        # Если доступ "read", то можно только читать, для операций записи нужен доступ "write" или "admin"
        if board_share.access_type not in ["write", "admin"]:
            # Здесь только проверка на чтение, так что read доступа достаточно
            pass
    
    cards = await crud_card.get_list_cards(db, list_id)
    
    # Manually convert each card to include proper assignee data
    result = []
    for card in cards:
        card_dict = card.__dict__
        # Remove the internal SQLAlchemy key
        card_dict = {k: v for k, v in card_dict.items() if not k.startswith('_')}
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
    
    # Check permissions
    if board.owner_id != current_user.id:
        # Check board share permissions
        board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
        if not board_share or board_share.access_type not in ["write", "admin"]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    card = await crud_card.create_card(db, card_in)
    
    # Explicitly load the assignee to avoid lazy loading issues
    if card.assignee_id:
        # Get the assignee information
        assignee = await crud_user.get_user(db, card.assignee_id)
        
        # Prepare the response manually to avoid lazy loading
        return {
            **card.__dict__,
            "assignee": assignee
        }
    
    # Return the card without assignee
    return {
        **card.__dict__,
        "assignee": None
    }


@router.get("/{card_id}", response_model=CardWithAssignee)
async def get_card(
    *,
    db: AsyncSession = Depends(deps.get_db),
    card_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a specific card by id.
    """
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="CardInDBBase not found")
    
    list_obj = await crud_list.get_list(db, card.list_id)
    board = await crud_board.get_board(db, list_obj.board_id)
    
    # Проверяем доступ: либо владелец, либо имеет доступ к доске
    if board.owner_id != current_user.id:
        # Проверяем наличие доступа к доске через BoardShare
        board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
        if not board_share:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get comments
    comments = await crud_comment.get_card_comments(db, card_id)
    
    # Format comments with user data
    formatted_comments = []
    for comment in comments:
        comment_dict = comment.__dict__
        comment_dict = {k: v for k, v in comment_dict.items() if not k.startswith('_')}
        
        # Get user data
        user = await crud_user.get_user(db, comment.user_id)
        user_dict = {k: v for k, v in user.__dict__.items() if not k.startswith('_')}
        
        # Add user to comment
        comment_dict["user"] = user_dict
        formatted_comments.append(comment_dict)
    
    # Explicitly load the assignee to avoid lazy loading issues
    if card.assignee_id:
        # Get the assignee information
        assignee = await crud_user.get_user(db, card.assignee_id)
        
        # Prepare the response manually to avoid lazy loading
        return {
            **card.__dict__,
            "assignee": assignee,
            "comments": formatted_comments
        }
    
    # Return the card without assignee
    return {
        **card.__dict__,
        "assignee": None,
        "comments": formatted_comments
    }


@router.put("/{card_id}", response_model=CardWithAssignee)
async def update_card(
    *,
    db: AsyncSession = Depends(deps.get_db),
    card_id: int,
    card_in: CardUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a card.
    """
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="CardInDBBase not found")
    
    list_obj = await crud_list.get_list(db, card.list_id)
    board = await crud_board.get_board(db, list_obj.board_id)
    
    # Проверяем доступ: либо владелец, либо имеет права на запись
    if board.owner_id != current_user.id:
        # Проверяем наличие доступа к доске через BoardShare
        board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
        if not board_share or board_share.access_type not in ["write", "admin"]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Update the card
    card = await crud_card.update_card(db, card, card_in)
    
    # Explicitly load the assignee to avoid lazy loading issues
    if card.assignee_id:
        # Get the assignee information
        assignee = await crud_user.get_user(db, card.assignee_id)
        
        # Prepare the response manually to avoid lazy loading
        return {
            **card.__dict__,
            "assignee": assignee
        }
    
    # Return the card without assignee
    return {
        **card.__dict__,
        "assignee": None
    }


@router.delete("/{card_id}")
async def delete_card(
    *,
    db: AsyncSession = Depends(deps.get_db),
    card_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a card.
    """
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="CardInDBBase not found")
    
    list_obj = await crud_list.get_list(db, card.list_id)
    board = await crud_board.get_board(db, list_obj.board_id)
    
    # Проверяем доступ: либо владелец, либо имеет права на запись
    if board.owner_id != current_user.id:
        # Проверяем наличие доступа к доске через BoardShare
        board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
        if not board_share or board_share.access_type not in ["write", "admin"]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
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
    """
    Move a card to a different list or position.
    """
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="CardInDBBase not found")
    
    # Проверяем исходный список и доску
    source_list = await crud_list.get_list(db, card.list_id)
    source_board = await crud_board.get_board(db, source_list.board_id)
    
    # Проверяем целевой список
    target_list = await crud_list.get_list(db, move_data.target_list_id)
    if not target_list:
        raise HTTPException(status_code=404, detail="Target list not found")
    
    # Проверяем, что целевой список принадлежит той же доске
    if source_list.board_id != target_list.board_id:
        raise HTTPException(
            status_code=400, 
            detail="Cannot move card between different boards"
        )
    
    # Проверяем доступ: либо владелец, либо имеет права на запись
    if source_board.owner_id != current_user.id:
        # Проверяем наличие доступа к доске через BoardShare
        board_share = await crud_board_share.get_board_share(db, source_board.id, current_user.id)
        if not board_share or board_share.access_type not in ["write", "admin"]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Перемещаем карточку
    card = await crud_card.move_card(
        db, 
        card_id=card_id,
        target_list_id=move_data.target_list_id,
        new_position=move_data.new_position
    )
    
    # Explicitly load the assignee to avoid lazy loading issues
    if card and card.assignee_id:
        # Get the assignee information
        assignee = await crud_user.get_user(db, card.assignee_id)
        
        # Prepare the response manually to avoid lazy loading
        return {
            **card.__dict__,
            "assignee": assignee
        }
    
    # Return the card without assignee
    return {
        **card.__dict__,
        "assignee": None
    } if card else None 


@router.get("/{card_id}/comments", response_model=List[CommentWithUser])
async def get_card_comments(
    *,
    db: AsyncSession = Depends(deps.get_db),
    card_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all comments for a specific card.
    """
    # Check if card exists
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
    
    # Check permissions
    if board.owner_id != current_user.id:
        # Check board share permissions
        board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
        if not board_share:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Get comments
    comments = await crud_comment.get_card_comments(db, card_id)
    
    # Format response with user data
    result = []
    for comment in comments:
        comment_dict = comment.__dict__
        comment_dict = {k: v for k, v in comment_dict.items() if not k.startswith('_')}
        
        # Get user data
        user = await crud_user.get_user(db, comment.user_id)
        user_dict = {k: v for k, v in user.__dict__.items() if not k.startswith('_')}
        
        # Add user to comment
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
    """
    Create a new comment.
    """
    # Check if card exists
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
    
    # Check permissions
    if board.owner_id != current_user.id:
        # Check board share permissions
        board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
        if not board_share or board_share.access_type not in ["write", "admin"]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Create comment
    comment = await crud_comment.create_comment(db, comment_in, current_user.id)
    
    # Format response with user data
    comment_dict = comment.__dict__
    comment_dict = {k: v for k, v in comment_dict.items() if not k.startswith('_')}
    
    # Get user data
    user = await crud_user.get_user(db, comment.user_id)
    user_dict = {k: v for k, v in user.__dict__.items() if not k.startswith('_')}
    
    # Add user to comment
    comment_dict["user"] = user_dict
    
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
    """
    Update a comment.
    """
    # Check if card exists
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Check if comment exists
    comment = await crud_comment.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if comment belongs to card
    if comment.card_id != card.id:
        raise HTTPException(status_code=400, detail="Comment does not belong to this card")
    
    # Check if user is the owner of the comment
    if comment.user_id != current_user.id:
        # Check if user is board owner or admin
        list_obj = await crud_list.get_list(db, card.list_id)
        board = await crud_board.get_board(db, list_obj.board_id)
        
        if board.owner_id != current_user.id:
            # Check board share permissions
            board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
            if not board_share or board_share.access_type != "admin":
                raise HTTPException(status_code=403, detail="You can only update your own comments")
    
    # Update comment
    comment = await crud_comment.update_comment(db, comment, comment_in)
    
    # Format response with user data
    comment_dict = comment.__dict__
    comment_dict = {k: v for k, v in comment_dict.items() if not k.startswith('_')}
    
    # Get user data
    user = await crud_user.get_user(db, comment.user_id)
    user_dict = {k: v for k, v in user.__dict__.items() if not k.startswith('_')}
    
    # Add user to comment
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
    """
    Delete a comment.
    """
    # Check if card exists
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Check if comment exists
    comment = await crud_comment.get_comment(db, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if comment belongs to card
    if comment.card_id != card.id:
        raise HTTPException(status_code=400, detail="Comment does not belong to this card")
    
    # Check if user is the owner of the comment
    if comment.user_id != current_user.id:
        # Check if user is board owner or admin
        list_obj = await crud_list.get_list(db, card.list_id)
        board = await crud_board.get_board(db, list_obj.board_id)
        
        if board.owner_id != current_user.id:
            # Check board share permissions
            board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
            if not board_share or board_share.access_type != "admin":
                raise HTTPException(status_code=403, detail="You can only delete your own comments")
    
    # Delete comment
    await crud_comment.delete_comment(db, comment)
    
    return {"success": True} 