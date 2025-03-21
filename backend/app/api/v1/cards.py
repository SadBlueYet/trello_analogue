from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import deps
from app.crud import card as crud_card
from app.crud import list as crud_list
from app.crud import board as crud_board
from app.crud import board_share as crud_board_share
from app.models.user import User
from app.schemas.card import Card, CardCreate, CardUpdate, MoveCard

router = APIRouter()


@router.get("/", response_model=List[Card])
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
    
    return await crud_card.get_list_cards(db, list_id)


@router.post("/", response_model=Card)
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
    return card


@router.get("/{card_id}", response_model=Card)
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
        raise HTTPException(status_code=404, detail="Card not found")
    
    list_obj = await crud_list.get_list(db, card.list_id)
    board = await crud_board.get_board(db, list_obj.board_id)
    
    # Проверяем доступ: либо владелец, либо имеет доступ к доске
    if board.owner_id != current_user.id:
        # Проверяем наличие доступа к доске через BoardShare
        board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
        if not board_share:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    return card


@router.put("/{card_id}", response_model=Card)
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
        raise HTTPException(status_code=404, detail="Card not found")
    
    list_obj = await crud_list.get_list(db, card.list_id)
    board = await crud_board.get_board(db, list_obj.board_id)
    
    # Проверяем доступ: либо владелец, либо имеет права на запись
    if board.owner_id != current_user.id:
        # Проверяем наличие доступа к доске через BoardShare
        board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
        if not board_share or board_share.access_type not in ["write", "admin"]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    card = await crud_card.update_card(db, card, card_in)
    return card


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
        raise HTTPException(status_code=404, detail="Card not found")
    
    list_obj = await crud_list.get_list(db, card.list_id)
    board = await crud_board.get_board(db, list_obj.board_id)
    
    # Проверяем доступ: либо владелец, либо имеет права на запись
    if board.owner_id != current_user.id:
        # Проверяем наличие доступа к доске через BoardShare
        board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
        if not board_share or board_share.access_type not in ["write", "admin"]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    await crud_card.delete_card(db, card_id)
    return {"message": "Card deleted successfully"}


@router.post("/{card_id}/move", response_model=Card)
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
        raise HTTPException(status_code=404, detail="Card not found")
    
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
    
    return card 