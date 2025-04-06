from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import deps
from app.crud import board as crud_board
from app.crud import board_share as crud_board_share
from app.crud import list as crud_list
from app.models.user import User
from app.schemas.list import BoardListBase, BoardListUpdate, NewBoardListPosition, ResponseBoardList

router = APIRouter()


@router.get("/", response_model=List[BoardListBase])
async def get_lists(
    *,
    db: AsyncSession = Depends(deps.get_db),
    board_id: int = Query(..., description="ID of the board"),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all lists for a board.
    """
    board = await crud_board.get_board(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, db, ["read", "write", "admin"])

    return await crud_list.get_board_lists(db, board_id)


@router.post("/", response_model=ResponseBoardList)
async def create_list(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_in: BoardListBase,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new list.
    """
    board = await crud_board.get_board(db, list_in.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, db, ["write", "admin"])

    list_obj = await crud_list.create_list(db, list_in)
    return list_obj


@router.get("/{list_id}", response_model=BoardListBase)
async def get_list(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a specific list by id.
    """
    list_obj = await crud_list.get_list(db, list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")

    board = await crud_board.get_board(db, list_obj.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, db, ["read", "write", "admin"])

    return list_obj


@router.put("/{list_id}", response_model=ResponseBoardList)
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
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, db, ["write", "admin"])

    list_obj = await crud_list.update_list(db, list_obj, list_in)
    return list_obj


@router.delete("/{list_id}")
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
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, db, ["admin"])

    await crud_list.delete_list(db, list_id)
    return {"message": "List deleted successfully"}


@router.post("/{list_id}/reorder", response_model=ResponseBoardList)
async def reorder_list(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_id: int,
    position_in: NewBoardListPosition,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Reorder a list.
    """
    list_obj = await crud_list.get_list(db, list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")

    board = await crud_board.get_board(db, list_obj.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, db, ["write", "admin"])

    list_obj = await crud_list.reorder_list(db, list_id, position_in.new_position)
    return list_obj
