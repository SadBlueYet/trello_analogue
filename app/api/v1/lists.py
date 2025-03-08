from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core import deps
from app.crud import list as crud_list
from app.crud import board as crud_board
from app.models.user import User
from app.schemas.list import NewBoardListPosition, ResponseBoardList, BoardListCreate, BoardListUpdate

router = APIRouter()

@router.get("/", response_model=List[BoardListCreate])
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
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return await crud_list.get_board_lists(db, board_id)

@router.post("/", response_model=ResponseBoardList)
async def create_list(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_in: BoardListCreate,
    current_user: User = Depends(deps.get_current_active_user),
) -> Any:
    """
    Create a new list.
    """
    board = await crud_board.get_board(db, list_in.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    list_obj = await crud_list.create_list(db, list_in)
    return ResponseBoardList(
        id=list_obj.id,
        title=list_obj.title,
        position=list_obj.position,
        board_id=list_obj.board_id,
    )

@router.get("/{list_id}", response_model=BoardListCreate)
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
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return list_obj

@router.put("/{list_id}", response_model=BoardListCreate)
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
    if board.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    await crud_list.delete_list(db, list_id)
    return {"message": "List deleted successfully"}

@router.post("/{list_id}/reorder")
async def reorder_list(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_id: int,
    new_position: NewBoardListPosition,
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
    list_obj = await crud_list.reorder_list(db, list_id, new_position.new_position)
    return list_obj 