from typing import Any, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from services import UserService, BoardService, BoardShareService, ServiceFactory
from src.core.deps import get_sqlalchemy_service_factory
from src.core import deps
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
    current_user: User = Depends(deps.get_current_active_user),
    service_factory: ServiceFactory = Depends(get_sqlalchemy_service_factory),
) -> Any:
    """
    Get all boards for the current user.
    """
    board_service = service_factory.create_board_service()
    board_share_service = service_factory.create_board_share_service()

    owned_boards = await board_service.get_boards(current_user.id)
    shared_boards_access = await board_share_service.get_shared_boards_for_user(current_user.id)

    shared_boards = []
    for share in shared_boards_access:
        board = await board_service.get_board(share.board_id)
        if board:
            shared_boards.append(board)

    all_boards = owned_boards + shared_boards
    return all_boards


@router.post("/", response_model=BoardInDBBase)
async def create_board(
    *,
    board_in: BoardCreate,
    current_user: User = Depends(deps.get_current_active_user),
    service_factory: ServiceFactory = Depends(get_sqlalchemy_service_factory),
) -> Any:
    """
    Create a new board.
    """
    service = service_factory.create_board_service()
    return await service.create_board(board_in, current_user.id)


@router.get("/{board_id}", response_model=BoardWithLists)
async def get_board(
    *,
    board_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    service_factory: ServiceFactory = Depends(get_sqlalchemy_service_factory),
) -> Any:
    """
    Get a specific board by id.
    """
    board_service = service_factory.create_board_service()
    list_service = service_factory.create_list_service()
    board_share_service = service_factory.create_board_share_service()
    
    board = await board_service.get_board(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, ["read", "write", "admin"], board_share_service)
    board.lists = await list_service.get_board_lists(board_id, include_cards=True)
    return board


@router.put("/{board_id}", response_model=BoardInDBBase)
async def update_board(
    *,
    board_id: int,
    board_in: BoardUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    service_factory: ServiceFactory = Depends(get_sqlalchemy_service_factory),
) -> Any:
    """
    Update a board.
    """
    service = service_factory.create_board_service()
    board_share_service = service_factory.create_board_share_service()
    
    board = await service.get_board(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, ["write", "admin"], board_share_service)

    return await service.update_board(board, board_in)


@router.delete("/{board_id}")
async def delete_board(
    *,
    board_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    service_factory: ServiceFactory = Depends(get_sqlalchemy_service_factory),
) -> Any:
    """
    Delete a board.
    """
    service = service_factory.create_board_service()
    board_share_service = service_factory.create_board_share_service()
    
    board = await service.get_board(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    await deps.check_board_access(board, current_user, ["admin"], board_share_service)

    await service.delete_board(board_id)
    return {"message": "Board deleted successfully"}


@router.get("/{board_id}/share", response_model=List[BoardShareInfo])
async def get_board_shares(
    *,
    board_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    service_factory: ServiceFactory = Depends(get_sqlalchemy_service_factory),
) -> Any:
    """
    Get all users who have access to the board.
    """
    user_service = service_factory.create_user_service()
    board_service = service_factory.create_board_service()
    board_share_service = service_factory.create_board_share_service()

    board = await board_service.get_board(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, ["read", "write", "admin"], board_share_service)

    board_shares = await board_share_service.get_board_shares_with_user_info(board_id)

    owner_user = await user_service.get_user_by_id(board.owner_id)

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
    board_id: int,
    board_share_in: BoardShareCreate,
    current_user: User = Depends(deps.get_current_active_user),
    service_factory: ServiceFactory = Depends(get_sqlalchemy_service_factory),
) -> Any:
    """
    Share a board with another user.
    """
    user_service = service_factory.create_user_service()
    board_service = service_factory.create_board_service()
    board_share_service = service_factory.create_board_share_service()

    if not (board := await board_service.get_board(board_id)):
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, ["admin"], board_share_service)

    if not (user := await user_service.get_user_by_id(board_share_in.user_id)):
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You are the owner of this board")

    if await board_share_service.get_board_share(board_id, user.id):
        raise HTTPException(status_code=400, detail="User already has access to this board")

    board_share = await board_share_service.create_board_share(board_share_in)

    return {"id": board_share.id, "access_type": board_share.access_type, "user": user}


@router.put("/{board_id}/share/{user_id}", response_model=BoardShareInfo)
async def update_board_share(
    *,
    board_id: int,
    user_id: int,
    board_share_in: BoardShareUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    service_factory: ServiceFactory = Depends(get_sqlalchemy_service_factory),
) -> Any:
    """
    Update a board share (change access type).
    """
    user_service = service_factory.create_user_service()
    board_service = service_factory.create_board_service()
    board_share_service = service_factory.create_board_share_service()

    if not (board := await board_service.get_board(board_id)):
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, ["admin"], board_share_service)

    board_share = await board_share_service.get_board_share(board_id, user_id)
    if not board_share:
        raise HTTPException(status_code=404, detail="Share not found")

    if not (user := await user_service.get_user_by_id(user_id)):
        raise HTTPException(status_code=404, detail="User not found")

    updated_share = await board_share_service.update_board_share(board_share, board_share_in)

    return {"id": updated_share.id, "access_type": updated_share.access_type, "user": user}


@router.delete("/{board_id}/share/{user_id}")
async def delete_board_share(
    *,
    board_id: int,
    user_id: int,
    current_user: User = Depends(deps.get_current_active_user),
    service_factory: ServiceFactory = Depends(get_sqlalchemy_service_factory),
) -> Any:
    """
    Remove a user's access to a board.
    """
    board_service = service_factory.create_board_service()
    board_share_service = service_factory.create_board_share_service()

    board = await board_service.get_board(board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    await deps.check_board_access(board, current_user, ["admin"], board_share_service)

    board_share = await board_share_service.get_board_share(board_id, user_id)
    if not board_share:
        raise HTTPException(status_code=404, detail="Share not found")

    await board_share_service.delete_board_share(board_share)

    return {"message": "Share removed successfully"}
