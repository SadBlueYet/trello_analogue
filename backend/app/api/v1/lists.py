from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core import deps
from backend.app.crud import list as crud_list
from backend.app.crud import board as crud_board
from backend.app.crud import board_share as crud_board_share
from backend.app.models.user import User
from backend.app.schemas.list import NewBoardListPosition, ResponseBoardList, BoardListCreate, BoardListUpdate

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
    
    # Проверяем доступ: либо владелец, либо имеет доступ к доске
    if board.owner_id != current_user.id:
        # Проверяем наличие доступа к доске через BoardShare
        board_share = await crud_board_share.get_board_share(db, board_id, current_user.id)
        if not board_share:
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
    # Check if board exists
    board = await crud_board.get_board(db, list_in.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Check permissions
    if board.owner_id != current_user.id:
        # Check board share permissions
        board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
        if not board_share or board_share.access_type not in ["write", "admin"]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    list_obj = await crud_list.create_list(db, list_in)
    return list_obj

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
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Проверяем доступ: либо владелец, либо имеет доступ к доске
    if board.owner_id != current_user.id:
        # Проверяем наличие доступа к доске через BoardShare
        board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
        if not board_share:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
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
    
    # Проверяем доступ: либо владелец, либо имеет права на запись
    if board.owner_id != current_user.id:
        # Проверяем наличие доступа к доске через BoardShare
        board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
        if not board_share or board_share.access_type not in ["write", "admin"]:
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
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    
    # Проверяем доступ: либо владелец, либо имеет права на запись
    if board.owner_id != current_user.id:
        # Проверяем наличие доступа к доске через BoardShare
        board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
        if not board_share or board_share.access_type not in ["write", "admin"]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
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
    
    # Проверяем доступ: либо владелец, либо имеет права на запись
    if board.owner_id != current_user.id:
        # Проверяем наличие доступа к доске через BoardShare
        board_share = await crud_board_share.get_board_share(db, board.id, current_user.id)
        if not board_share or board_share.access_type not in ["write", "admin"]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
    
    list_obj = await crud_list.reorder_list(db, list_id, position_in.new_position)
    return list_obj 