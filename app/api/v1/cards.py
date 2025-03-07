from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import deps
from app.crud import card as crud_card
from app.crud import list as crud_list
from app.crud import board as crud_board
from app.models.user import User
from app.schemas.card import Card, CardCreate, CardUpdate

router = APIRouter()


@router.get("/lists/{list_id}/cards", response_model=List[Card])
async def get_list_cards(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all cards in a list.
    """
    list_obj = await crud_list.get_list(db, list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")
    board = await crud_board.get_board(db, list_obj.board_id)
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return await crud_card.get_list_cards(db, list_id)


@router.post("/lists/{list_id}/cards", response_model=Card)
async def create_card(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_id: int,
    card_in: CardCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new card in a list.
    """
    list_obj = await crud_list.get_list(db, list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")
    board = await crud_board.get_board(db, list_obj.board_id)
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Ensure the card is created in the correct list
    card_data = card_in.model_dump()
    card_data["list_id"] = list_id
    card = await crud_card.create_card(db, CardCreate(**card_data))
    return card


@router.get("/lists/{list_id}/cards/{card_id}", response_model=Card)
async def get_card(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_id: int,
    card_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a specific card by id.
    """
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    if card.list_id != list_id:
        raise HTTPException(status_code=404, detail="Card not found in this list")
    list_obj = await crud_list.get_list(db, list_id)
    board = await crud_board.get_board(db, list_obj.board_id)
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return card


@router.put("/lists/{list_id}/cards/{card_id}", response_model=Card)
async def update_card(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_id: int,
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
    if card.list_id != list_id:
        raise HTTPException(status_code=404, detail="Card not found in this list")
    list_obj = await crud_list.get_list(db, list_id)
    board = await crud_board.get_board(db, list_obj.board_id)
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    card = await crud_card.update_card(db, card, card_in)
    return card


@router.delete("/lists/{list_id}/cards/{card_id}")
async def delete_card(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_id: int,
    card_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a card.
    """
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    if card.list_id != list_id:
        raise HTTPException(status_code=404, detail="Card not found in this list")
    list_obj = await crud_list.get_list(db, list_id)
    board = await crud_board.get_board(db, list_obj.board_id)
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    await crud_card.delete_card(db, card_id)
    return {"message": "Card deleted successfully"}


@router.post("/lists/{list_id}/cards/{card_id}/move")
async def move_card(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_id: int,
    card_id: int,
    target_list_id: int,
    new_position: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Move a card to a different position or list.
    """
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    if card.list_id != list_id:
        raise HTTPException(status_code=404, detail="Card not found in this list")
    
    # Check permissions for source list
    source_list = await crud_list.get_list(db, list_id)
    source_board = await crud_board.get_board(db, source_list.board_id)
    if source_board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check permissions for target list
    target_list = await crud_list.get_list(db, target_list_id)
    if not target_list:
        raise HTTPException(status_code=404, detail="Target list not found")
    target_board = await crud_board.get_board(db, target_list.board_id)
    if target_board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    card = await crud_card.move_card(db, card_id, target_list_id, new_position)
    return card 