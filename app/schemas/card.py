from typing import Optional
from pydantic import BaseModel


class CardBase(BaseModel):
    title: str
    description: Optional[str] = None
    position: int


class CardCreate(CardBase):
    list_id: int


class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    position: Optional[int] = None
    list_id: Optional[int] = None


class CardInDBBase(CardBase):
    id: int
    list_id: int

    class Config:
        from_attributes = True


class Card(CardInDBBase):
    pass

class MoveCard(BaseModel):
    new_position: int
    target_list_id: int

# Update List schema to include cards
from app.schemas.board import BoardListInDBBase

class ListWithCards(BoardListInDBBase):
    cards: list[Card] = [] 