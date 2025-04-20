from typing import Any

from sqlalchemy import or_, select
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
    
    async def search_users(self, query: str, limit: int, current_user_id: int):
        search_query = f"%{query}%"
        stmt = (
            select(User)
            .filter(
                or_(
                    User.username.ilike(search_query),
                    User.email.ilike(search_query),
                    User.full_name.ilike(search_query) if User.full_name else False,
                )
            )
            .limit(limit)
        )

        result = await self.session.execute(stmt)

        users = result.scalars().all()
        users = [user for user in users if user.id != current_user_id]

        return users
