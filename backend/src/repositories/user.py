from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from src.models import User
from .base import SqlAlchemyRepository


class UserRepository(SqlAlchemyRepository):
    model: User

    def __init__(self, session: AsyncSession):
        super().__init__(User, session)

    async def update_user_profile(self, current_user: User) -> User:
        await self.session.commit()
        await self.session.refresh(current_user)
        return current_user
