from src.repositories import BaseRepository
from src.models import Card
from src.schemas.card import CardCreate, CardUpdate

class CardService:
    def __init__(self, repository: BaseRepository):
        self.repository = repository

    async def get_card(self, card_id: int) -> Card | None:
        return await self.repository.get_one(id=card_id)
    
    async def get_list_cards(self, list_id: int) -> list[Card]:
        return await self.repository.get_list_cards(list_id)
    
    async def create_card(self, card: CardCreate) -> Card:
        return await self.repository.create_card(card)
    
    async def update_card(self, card: Card, card_in: CardUpdate) -> Card:
        return await self.repository.update_card(card, card_in)

    async def delete_card(self, card_id: int) -> None:
        return await self.repository.delete_card(card_id)
    
    async def move_card(self, card_id: int, target_list_id: int, new_position: int) -> Card:
        return await self.repository.move_card(card_id, target_list_id, new_position)
