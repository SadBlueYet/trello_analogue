from sqlalchemy.ext.asyncio import AsyncSession

from .user import UserRepository

class RepositoryFactory:
    def __init__(self, session: AsyncSession):
        self.session = session

    def create_user_repository(self):
        return UserRepository(self.session)
