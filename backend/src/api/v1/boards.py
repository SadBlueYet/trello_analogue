from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.core import deps
from src.crud import board as crud_board
from src.crud import board_share as crud_board_share
from src.crud import list as crud_list
from src.crud import user as crud_user
from src.models.user import User
from src.schemas.board import (
    BoardCreate,
    BoardInDBBase,
    BoardShareCreate,
    BoardShareInfo,
    BoardShareUpdate,
    BoardUpdate,
    BoardWithLists,
)

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
    owned_boards = await crud_board.get_boards(db, current_user.id)
    shared_boards_access = await crud_board_share.get_shared_boards_for_user(db, current_user.id)

    shared_boards = []
    for share in shared_boards_access:
        board = await crud_board.get_board(db, share.board_id)
        if board:
            shared_boards.append(board)

    all_boards = owned_boards + shared_boards
    return all_boards


@router.post("/", response_model=BoardInDBBase)
async def create_board(
    *,
    db: AsyncSession = Depends(deps.get_db),
    board_in: BoardCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new board.
    """
    return await crud_board.create_board(db, board_in, current_user.id)


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
    # Load board with all related data

    board = await crud_board.get_board(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, db, ["read", "write", "admin"])

    # Load lists with cards and assignees
    lists = await crud_list.get_board_lists(db, board_id, include_cards=True)

    # Assign the loaded lists to the board
    board.lists = lists

    return board


@router.put("/{board_id}", response_model=BoardInDBBase)
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

    await deps.check_board_access(board, current_user, db, ["write", "admin"])

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

    await deps.check_board_access(board, current_user, db, ["admin"])

    await crud_board.delete_board(db, board_id)
    return {"message": "Board deleted successfully"}


@router.get("/{board_id}/share", response_model=List[BoardShareInfo])
async def get_board_shares(
    *,
    db: AsyncSession = Depends(deps.get_db),
    board_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Get all users who have access to the board.
    """
    board = await crud_board.get_board(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, db, ["read", "write", "admin"])

    board_shares = await crud_board_share.get_board_shares_with_user_info(db, board_id)

    owner_user = await crud_user.get_user(db, board.owner_id)

    result = []

    if owner_user:
        result.append({"id": -1, "access_type": "owner", "user": owner_user})

    for share in board_shares:
        if share.user.id == board.owner_id:
            continue

        result.append({"id": share.id, "access_type": share.access_type, "user": share.user})

    return result


@router.post("/{board_id}/share", response_model=BoardShareInfo)
async def create_board_share(
    *,
    db: AsyncSession = Depends(deps.get_db),
    board_id: int,
    board_share_in: BoardShareCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Share a board with another user.
    """
    board = await crud_board.get_board(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, db, ["admin"])

    user = await crud_user.get_user(db, board_share_in.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You are the owner of this board")

    existing_share = await crud_board_share.get_board_share(db, board_id, user.id)
    if existing_share:
        raise HTTPException(status_code=400, detail="User already has access to this board")

    board_share = await crud_board_share.create_board_share(db, board_share_in)

    # Формируем ответ
    return {"id": board_share.id, "access_type": board_share.access_type, "user": user}


@router.put("/{board_id}/share/{user_id}", response_model=BoardShareInfo)
async def update_board_share(
    *,
    db: AsyncSession = Depends(deps.get_db),
    board_id: int,
    user_id: int,
    board_share_in: BoardShareUpdate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Update a board share (change access type).
    """
    board = await crud_board.get_board(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, db, ["admin"])

    board_share = await crud_board_share.get_board_share(db, board_id, user_id)
    if not board_share:
        raise HTTPException(status_code=404, detail="Share not found")

    user = await crud_user.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    updated_share = await crud_board_share.update_board_share(db, board_share, board_share_in)

    return {
        "id": updated_share.id,
        "access_type": updated_share.access_type,
        "user": user,
    }


@router.delete("/{board_id}/share/{user_id}")
async def delete_board_share(
    *,
    db: AsyncSession = Depends(deps.get_db),
    board_id: int,
    user_id: int,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Remove a user's access to a board.
    """
    board = await crud_board.get_board(db, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, db, ["admin"])

    board_share = await crud_board_share.get_board_share(db, board_id, user_id)
    if not board_share:
        raise HTTPException(status_code=404, detail="Share not found")

    await crud_board_share.delete_board_share(db, board_share)

    return {"message": "Share removed successfully"}
