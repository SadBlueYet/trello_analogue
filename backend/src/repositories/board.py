from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from src.models import Board
from .base import SqlAlchemyRepository


class BoardRepository(SqlAlchemyRepository):
    model: Board

    def __init__(self, session: AsyncSession):
        super().__init__(Board, session)

    async def get_boards_with_lists(self, user_id: int) -> Sequence[Board]:
        try:
            query = select(Board).where(Board.owner_id == user_id).options(selectinload(Board.lists))
            return (await self.session.execute(query)).scalars().all()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid filter: {e}")

    async def get_board_with_lists(self, board_id: int) -> Board | None:
        try:
            query = select(Board).where(Board.id == board_id).options(selectinload(Board.lists))
            return (await self.session.execute(query)).scalar_one_or_none()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid filter: {e}")

    async def update_board(self, board: Board, update_data: dict) -> Board:
        try:
            for field, value in update_data.items():
                setattr(board, field, value)
            await self.session.commit()
            await self.session.refresh(board)
            return board
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid data: {e}")

    async def delete_board(self, board_id: int) -> None:
        try:
            db_board = await self.get_board_with_lists(board_id)
            if db_board:
                await self.session.delete(db_board)
                await self.session.commit()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error when deleting board: {e}")
