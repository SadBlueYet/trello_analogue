from typing import Optional, List, ForwardRef
from pydantic import BaseModel


class BoardBase(BaseModel):
    title: str
    description: Optional[str] = None
    background_color: Optional[str] = None


class BoardCreate(BoardBase):
    pass


class BoardUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    background_color: Optional[str] = None


class BoardListBase(BaseModel):
    title: str
    position: int
    list_color: Optional[str] = None


class BoardListCreate(BoardListBase):
    board_id: int


class BoardListUpdate(BaseModel):
    title: Optional[str] = None
    position: Optional[int] = None
    list_color: Optional[str] = None


class BoardListInDBBase(BoardListBase):
    id: int
    board_id: int

    class Config:
        from_attributes = True


class BoardList(BoardListInDBBase):
    pass


class BoardInDBBase(BoardBase):
    id: int
    owner_id: int

    class Config:
        from_attributes = True


# Используем ForwardRef для решения проблемы циклических импортов


class Board(BoardInDBBase):
    # lists: List[BoardList] = []
    pass


class BoardInDB(BoardInDBBase):
    pass


# Разрешаем ForwardRef после определения всех классов
Board.model_rebuild()


# Add Board with lists
class BoardWithLists(BoardInDBBase):
    lists: List[BoardList] = [] 