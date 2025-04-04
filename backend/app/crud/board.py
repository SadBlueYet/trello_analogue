from typing import Optional, Sequence
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.board import Board
from app.schemas.board import BoardCreate, BoardUpdate


async def get_boards(db: AsyncSession, user_id: int) -> Sequence[Board]:
    result = await db.execute(
        select(Board)
        .where(Board.owner_id == user_id)
        .options(selectinload(Board.lists))
    )
    return result.scalars().all()


async def get_board(db: AsyncSession, board_id: int) -> Optional[Board]:
    result = await db.execute(
        select(Board)
        .where(Board.id == board_id)
        .options(selectinload(Board.lists))
    )
    return result.scalars().first()


async def create_board(
    db: AsyncSession, board_in: BoardCreate, user_id: int
) -> Board:
    db_board = Board(
        title=board_in.title,
        description=board_in.description,
        owner_id=user_id,
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


async def delete_board(db: AsyncSession, board_id: int) -> None:
    db_board = await get_board(db, board_id)
    if db_board:
        await db.delete(db_board)
        await db.commit() 