from abc import ABC
from sqlalchemy.ext.asyncio import AsyncSession

from .board import BoardRepository
from .user import UserRepository
from .board_share import BoardShareReository
from .list import ListRepository
from .card import CardRepository
from .comment import CommentRepository

class BaseRepositoryFactory(ABC):
    def __init__(self, session: AsyncSession):
        self.session = session


class SQLAlchemyRepositoryFactory(BaseRepositoryFactory):
    def create_user_repository(self):
        return UserRepository(self.session)

    def create_board_repository(self):
        return BoardRepository(self.session)

    def create_board_share_repository(self):
        return BoardShareReository(self.session)

    def create_list_repository(self):
        return ListRepository(self.session)
    
    def create_card_repository(self):
        return CardRepository(self.session)

    def create_comment_repository(self):
        return CommentRepository(self.session)