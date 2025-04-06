from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.comment import CommentWithUser
from app.schemas.user import UserInDBBase


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
    formatted_id: Optional[str] = None

    class Config:
        from_attributes = True


class CardWithAssignee(CardInDBBase):
    assignee: Optional[UserInDBBase] = None
    comments: Optional[List[CommentWithUser]] = None


class MoveCard(BaseModel):
    new_position: int
    target_list_id: int
