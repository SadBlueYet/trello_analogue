from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import deps
from app.crud import list as crud_list
from app.crud import board as crud_board
from app.models.user import User
from app.schemas.board import BoardList, BoardListCreate, BoardListUpdate
from app.schemas.card import ListWithCards

router = APIRouter()


@router.get("/{board_id}/lists", response_model=List[BoardList])
async def get_board_lists(
    *,
    db: AsyncSession = Depends(deps.get_db),
    board_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all lists for a specific board.
    """
    # Check if board exists and user has access
    board = await crud_board.get_board(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    lists = await crud_list.get_board_lists(db, board_id, include_cards=True)
    return lists


@router.post("/{board_id}/lists", response_model=BoardList)
async def create_board_list(
    *,
    db: AsyncSession = Depends(deps.get_db),
    board_id: int,
    list_in: BoardListCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new list in a specific board.
    """
    # Check if board exists and user has access
    board = await crud_board.get_board(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    # Ensure board_id in path matches board_id in request body
    if list_in.board_id != board_id:
        raise HTTPException(
            status_code=400,
            detail="Board ID in path does not match board ID in request body"
        )
    
    list_obj = await crud_list.create_list(db, list_in)
    return list_obj


@router.get("/lists/{list_id}", response_model=ListWithCards)
async def get_list(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a specific list by id.
    """
    list_obj = await crud_list.get_list(db, list_id, include_cards=True)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")
    board = await crud_board.get_board(db, list_obj.board_id)
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return list_obj


@router.put("/lists/{list_id}", response_model=BoardList)
async def update_list(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_id: int,
    list_in: BoardListUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a list.
    """
    list_obj = await crud_list.get_list(db, list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")
    board = await crud_board.get_board(db, list_obj.board_id)
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    list_obj = await crud_list.update_list(db, list_obj, list_in)
    return list_obj


@router.delete("/lists/{list_id}")
async def delete_list(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a list.
    """
    list_obj = await crud_list.get_list(db, list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")
    board = await crud_board.get_board(db, list_obj.board_id)
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    await crud_list.delete_list(db, list_id)
    return {"message": "List deleted successfully"}


@router.post("/lists/{list_id}/reorder")
async def reorder_list(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_id: int,
    new_position: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Reorder a list.
    """
    list_obj = await crud_list.get_list(db, list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")
    board = await crud_board.get_board(db, list_obj.board_id)
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    list_obj = await crud_list.reorder_list(db, list_id, new_position)
    return list_obj 