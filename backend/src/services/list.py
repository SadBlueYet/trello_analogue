from collections.abc import Sequence

from src.repositories import BaseRepository
from src.models.board_list import BoardList
from src.models.card import Card
from src.schemas.board import BoardListCreate, BoardListUpdate
from src.schemas.list import ResponseBoardList


class ListService:
    def __init__(self, repository: BaseRepository):
        self.repository = repository

    async def get_list(self, list_id: int, include_cards: bool = False) -> BoardList | None:
        return await self.repository.get_list(list_id, include_cards)

    async def get_board_lists(self, board_id: int, include_cards: bool = False) -> Sequence[BoardList]:
        return await self.repository.get_board_lists(board_id, include_cards)

    async def create_list(self, list_in: BoardListCreate) -> BoardList:
        return await self.repository.create_list(list_in)

    async def update_list(self, db_list: BoardList, list_in: BoardListUpdate) -> BoardList:
        update_data = list_in.model_dump(exclude_unset=True)

        if "position" in update_data and update_data["position"] != db_list.position:
            await self.reorder_list(db_list.id, update_data["position"])

        return await self.repository.update_list(db_list, update_data)

    async def delete_list(self, list_id: int) -> bool:
        return self.repository.delete_list(list_id)

    async def reorder_list(self, list_id: int, new_position: int) -> ResponseBoardList | None:
        return await self.repository.reorder_list(list_id, new_position)
