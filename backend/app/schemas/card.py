from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

from backend.app.schemas.board import BoardListInDBBase
from backend.app.schemas.user import UserInDBBase


class CardBase(BaseModel):
    title: str
    description: Optional[str] = None
    position: int


class CardCreate(CardBase):
    list_id: int
    assignee_id: Optional[int] = None


class CardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    position: Optional[int] = None
    list_id: Optional[int] = None
    card_color: Optional[str] = None
    assignee_id: Optional[int] = None


class CardInDBBase(CardBase):
    id: int
    list_id: int
    card_id: int
    created_at: datetime
    updated_at: datetime
    card_color: Optional[str] = None
    assignee_id: Optional[int] = None

    class Config:
        from_attributes = True


class CardWithAssignee(CardInDBBase):
    assignee: Optional[UserInDBBase] = None


class MoveCard(BaseModel):
    new_position: int
    target_list_id: int
