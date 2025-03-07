from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.board import Board
from app.schemas.board import BoardCreate, BoardUpdate


async def get_board(
    db: AsyncSession, board_id: int, include_lists: bool = False
) -> Optional[Board]:
    query = select(Board)
    if include_lists:
        query = query.options(selectinload(Board.lists))
    query = query.where(Board.id == board_id)
    result = await db.execute(query)
    return result.scalar_one_or_none()


async def get_user_boards(
    db: AsyncSession, user_id: int, include_lists: bool = False
) -> List[Board]:
    query = select(Board).where(Board.owner_id == user_id)
    if include_lists:
        query = query.options(selectinload(Board.lists))
    result = await db.execute(query)
    return result.scalars().all()


async def create_board(
    db: AsyncSession, board_in: BoardCreate, user_id: int
) -> Board:
    db_board = Board(
        **board_in.model_dump(),
        owner_id=user_id
    )
    db.add(db_board)
    await db.commit()
    await db.refresh(db_board)
    return db_board


async def update_board(
    db: AsyncSession,
    db_board: Board,
    board_in: BoardUpdate
) -> Board:
    update_data = board_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_board, field, value)
    await db.commit()
    await db.refresh(db_board)
    return db_board


async def delete_board(db: AsyncSession, board_id: int) -> bool:
    board = await get_board(db, board_id)
    if not board:
        return False
    await db.delete(board)
    await db.commit()
    return True 