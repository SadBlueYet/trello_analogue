from typing import Optional, List
from pydantic import BaseModel
from app.schemas.card import Card

class BoardListBase(BaseModel):
    title: str
    position: int
    board_id: int

class BoardListCreate(BoardListBase):
    pass

class BoardListUpdate(BaseModel):
    title: Optional[str] = None
    position: Optional[int] = None
    board_id: Optional[int] = None
    list_color: Optional[str] = None
class BoardListInDBBase(BoardListBase):
    id: int

    class Config:
        from_attributes = True

class ResponseBoardList(BoardListInDBBase):
    position: int
    board_id: int
    title: str
    list_color: Optional[str] = None
class NewBoardListPosition(BaseModel):
    new_position: int
