from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from src.schemas.user import UserInDBBase


class CommentBase(BaseModel):
    text: str


class CommentCreate(CommentBase):
    card_id: int


class CommentUpdate(BaseModel):
    text: Optional[str] = None


class CommentInDBBase(CommentBase):
    id: int
    card_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CommentWithUser(CommentInDBBase):
    user: Optional[UserInDBBase] = None
