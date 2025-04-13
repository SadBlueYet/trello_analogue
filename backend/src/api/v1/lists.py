from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.core import deps
from src.models.user import User
from src.schemas.list import BoardListBase, BoardListUpdate, NewBoardListPosition, ResponseBoardList
from src.services import ServiceFactory


router = APIRouter()


@router.get("/", response_model=List[BoardListBase])
async def get_lists(
    *,
    board_id: int = Query(..., description="ID of the board"),
    current_user: User = Depends(deps.get_current_active_user),
    service_factory: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),

) -> Any:
    """
    Get all lists for a board.
    """
    board_service = service_factory.create_board_service()
    list_service = service_factory.create_list_service()
    board_share_service = service_factory.create_board_share_service()
    
    board = await board_service.get_board(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, ["read", "write", "admin"], board_share_service)

    return await list_service.get_board_lists(board_id)


@router.post("/", response_model=ResponseBoardList)
async def create_list(
    *,
    db: AsyncSession = Depends(deps.get_db),
    list_in: BoardListBase,
    current_user: User = Depends(deps.get_current_active_user),
    service_factory: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),
) -> Any:
    """
    Create a new list.
    """
    board_service = service_factory.create_board_service()
    list_service = service_factory.create_list_service()
    board_share_service = service_factory.create_board_share_service()
    
    board = await board_service.get_board(list_in.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, ["write", "admin"], board_share_service)

    list_obj = await list_service.create_list(list_in)
    return list_obj


@router.get("/{list_id}", response_model=BoardListBase)
async def get_list(
    *,
    list_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    service_factory: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),
) -> Any:
    """
    Get a specific list by id.
    """
    list_service = service_factory.create_list_service()
    board_service = service_factory.create_board_service()
    board_share_service = service_factory.create_board_share_service()
    list_obj = await list_service.get_list(list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")

    board = await board_service.get_board(list_obj.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, ["read", "write", "admin"], board_share_service)

    return list_obj


@router.put("/{list_id}", response_model=ResponseBoardList)
async def update_list(
    *,
    list_id: int,
    list_in: BoardListUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    service_factory: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),
) -> Any:
    list_service = service_factory.create_list_service()
    board_service = service_factory.create_board_service()
    board_share_service = service_factory.create_board_share_service()
    list_obj = await list_service.get_list(list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")

    board = await board_service.get_board(list_obj.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, ["write", "admin"], board_share_service)

    list_obj = await list_service.update_list(list_obj, list_in)
    return list_obj


@router.delete("/{list_id}")
async def delete_list(
    *,
    list_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    service_factory: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),
) -> Any:
    list_service = service_factory.create_list_service()
    board_service = service_factory.create_board_service()
    board_share_service = service_factory.create_board_share_service()
    
    list_obj = await list_service.get_list(list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")

    board = await board_service.get_board(list_obj.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    board = await board_service.get_board(list_obj.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, ["admin"], board_share_service)

    await list_service.delete_list(list_obj)
    return {"message": "List deleted successfully"}


@router.post("/{list_id}/reorder", response_model=ResponseBoardList)
async def reorder_list(
    *,
    list_id: int,
    position_in: NewBoardListPosition,
    current_user: User = Depends(deps.get_current_active_user),
    service_factory: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),
) -> Any:
    list_service = service_factory.create_list_service()
    board_service = service_factory.create_board_service()
    board_share_service = service_factory.create_board_share_service()
    list_obj = await list_service.get_list(list_id)
    if not list_obj:
        raise HTTPException(status_code=404, detail="List not found")

    board = await board_service.get_board(list_obj.board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, ["write", "admin"], board_share_service)

    list_obj = await list_service.reorder_list(list_id, position_in.new_position)
    return list_obj
