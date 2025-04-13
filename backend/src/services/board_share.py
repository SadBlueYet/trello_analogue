from typing import Sequence

from src.models import BoardShare
from schemas.board import BoardShareCreate, BoardShareUpdate
from src.repositories import BaseRepository


class BoardShareService:
    def __init__(self, repository: BaseRepository):
        self.repository = repository

    async def get_board_shares(self, board_id: int) -> Sequence[BoardShare]:
        """Получить список всех пользователей с доступом к доске"""
        return await self.repository.get_all(board_id=board_id)

    async def get_board_share(self, board_id: int, user_id: int) -> BoardShare | None:
        """Получить запись о доступе конкретного пользователя к доске"""
        return await self.repository.get_one(board_id=board_id, user_id=user_id)

    async def get_shared_boards_for_user(self, user_id: int) -> Sequence[BoardShare]:
        """Получить список всех досок, к которым у пользователя есть доступ"""
        return await self.repository.get_all(user_id=user_id)

    async def create_board_share(self, board_share: BoardShareCreate) -> BoardShare:
        """Предоставить пользователю доступ к доске"""
        board_share = board_share.model_dump()
        return await self.repository.create(board_share)

    async def update_board_share(self, db_board_share: BoardShare, board_share_update: BoardShareUpdate) -> BoardShare:
        """Обновить тип доступа пользователя к доске"""
        update_data = board_share_update.model_dump(exclude_unset=True)
        return await self.repository.update(db_board_share, update_data)

    async def delete_board_share(self, db_board_share: BoardShare) -> None:
        """Удалить доступ пользователя к доске"""
        await self.repository.delete(db_board_share)

    async def get_board_shares_with_user_info(self, board_id: int) -> Sequence[BoardShare]:
        """Получить список всех пользователей с доступом к доске, включая информацию о пользователях"""
        return await self.repository.get_board_shares_with_user_info(board_id)