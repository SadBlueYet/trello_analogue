from typing import Sequence

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload
from fastapi import HTTPException

from src.models import BoardShare
from .base import SqlAlchemyRepository


class BoardShareReository(SqlAlchemyRepository):
    model: BoardShare

    def __init__(self, session: AsyncSession):
        super().__init__(BoardShare, session)

    async def delete(self, db_board_share: BoardShare) -> None:
        """Удалить доступ пользователя к доске"""
        try:
            await self.session.delete(db_board_share)
            await self.session.commit()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error when deleting board share: {e}")

    async def get_board_shares_with_user_info(self, board_id: int) -> Sequence[BoardShare]:
        """Получить список всех пользователей с доступом к доске, включая информацию о пользователях"""
        try:
            query = select(BoardShare).options(joinedload(BoardShare.user)).filter(BoardShare.board_id == board_id)

            result = await self.session.execute(query)
            return result.unique().scalars().all()
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid filter: {e}")

