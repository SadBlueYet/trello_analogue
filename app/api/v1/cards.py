from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import deps
from app.crud import card as crud_card
from app.crud import list as crud_list
from app.crud import board as crud_board
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
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
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
    list_obj = await crud_list.get_list(db, card_in.list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")
    board = await crud_board.get_board(db, list_obj.board_id)
    if board.owner_id != current_user.id:
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
    if board.owner_id != current_user.id:
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
    if board.owner_id != current_user.id:
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
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    await crud_card.delete_card(db, card_id)
    return {"message": "Card deleted successfully"}


@router.post("/{card_id}/move")
async def move_card(
    *,
    db: AsyncSession = Depends(deps.get_db),
    card_id: int,
    new_card: MoveCard,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Move a card to a different position or list.
    """
    card = await crud_card.get_card(db, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")
    
    # Check permissions for source list
    source_list = await crud_list.get_list(db, card.list_id)
    source_board = await crud_board.get_board(db, source_list.board_id)
    if source_board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Check permissions for target list
    target_list = await crud_list.get_list(db, new_card.target_list_id)
    if not target_list:
        raise HTTPException(status_code=404, detail="Target list not found")
    target_board = await crud_board.get_board(db, target_list.board_id)
    if target_board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    card = await crud_card.move_card(db, card_id, new_card.target_list_id, new_card.new_position)
    return CardCreate(
        title=card.title,
        description=card.description,
        position=card.position,
        list_id=card.list_id,
    ) 