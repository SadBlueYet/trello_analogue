from typing import Optional, List, ForwardRef
from datetime import datetime
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
    card_color: Optional[str] = None


class CardInDBBase(CardBase):
    id: int
    list_id: int
    card_id: int
    created_at: datetime
    updated_at: datetime
    card_color: Optional[str] = None

    class Config:
        from_attributes = True


class Card(CardInDBBase):
    pass

class MoveCard(BaseModel):
    new_position: int
    target_list_id: int


# Отложенный импорт, чтобы избежать циклических зависимостей
from app.schemas.board import BoardListInDBBase


class ListWithCards(BoardListInDBBase):
    cards: List[Card] = [] 