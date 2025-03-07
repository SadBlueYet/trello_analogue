from typing import Optional
from pydantic import BaseModel


class CardBase(BaseModel):
    title: str
    description: Optional[str] = None
    position: int


class CardCreate(CardBase):
    list_id: int


class CardUpdate(CardBase):
    pass


class CardInDBBase(CardBase):
    id: int
    list_id: int

    class Config:
        from_attributes = True


class Card(CardInDBBase):
    pass


# Update List schema to include cards
from app.schemas.board import BoardListInDBBase

class ListWithCards(BoardListInDBBase):
    cards: list[Card] = [] 