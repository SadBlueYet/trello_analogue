from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import deps
from app.crud import board as crud_board
from app.models.user import User
from app.schemas.board import Board, BoardCreate, BoardUpdate, BoardWithLists

router = APIRouter()


@router.get("/", response_model=List[BoardWithLists])
async def get_boards(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all boards for the current user.
    """
    boards = await crud_board.get_boards(db, current_user.id)
    return boards


@router.post("/", response_model=Board)
async def create_board(
    *,
    db: AsyncSession = Depends(deps.get_db),
    board_in: BoardCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new board.
    """
    board = await crud_board.create_board(db, board_in, current_user.id)
    return board


@router.get("/{board_id}", response_model=BoardWithLists)
async def get_board(
    *,
    db: AsyncSession = Depends(deps.get_db),
    board_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get a specific board by id.
    """
    board = await crud_board.get_board(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return board


@router.put("/{board_id}", response_model=Board)
async def update_board(
    *,
    db: AsyncSession = Depends(deps.get_db),
    board_id: int,
    board_in: BoardUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a board.
    """
    board = await crud_board.get_board(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    board = await crud_board.update_board(db, board, board_in)
    return board


@router.delete("/{board_id}")
async def delete_board(
    *,
    db: AsyncSession = Depends(deps.get_db),
    board_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Delete a board.
    """
    board = await crud_board.get_board(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    await crud_board.delete_board(db, board_id)
    return {"message": "Board deleted successfully"} 