from typing import Optional

from pydantic import BaseModel


class BoardListBase(BaseModel):
    title: str
    position: int
    board_id: int


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
    list_color: Optional[str] = None


class NewBoardListPosition(BaseModel):
    new_position: int
