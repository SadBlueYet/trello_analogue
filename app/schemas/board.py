from typing import Optional, List
from pydantic import BaseModel


class BoardBase(BaseModel):
    title: str
    description: Optional[str] = None


class BoardCreate(BoardBase):
    pass


class BoardUpdate(BoardBase):
    pass


class BoardInDBBase(BoardBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True


class Board(BoardInDBBase):
    pass


class BoardListBase(BaseModel):
    title: str
    position: int


class BoardListCreate(BoardListBase):
    board_id: int


class BoardListUpdate(BoardListBase):
    pass


class BoardListInDBBase(BoardListBase):
    id: int
    board_id: int

    class Config:
        from_attributes = True


class BoardList(BoardListInDBBase):
    pass


# Add Board with lists
class BoardWithLists(BoardInDBBase):
    lists: List[BoardList] = [] 