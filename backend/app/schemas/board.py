from typing import Optional, List, ForwardRef
from pydantic import BaseModel
from datetime import datetime

class BoardBase(BaseModel):
    title: str
    description: Optional[str] = None
    background_color: Optional[str] = None


class BoardCreate(BoardBase):
    pass

class GetBoards(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    background_color: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    owner_id: Optional[int] = None
    id: Optional[int] = None

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
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BoardList(BoardListInDBBase):
    pass


class BoardInDBBase(BoardBase):
    id: int
    owner_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }


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


# Добавим в конец файла новые схемы для представления информации о шаринге

from app.schemas.user import User

class BoardShareBase(BaseModel):
    board_id: int
    user_id: int
    access_type: str = "read"
    
    class Config:
        from_attributes = True

class BoardShareCreate(BoardShareBase):
    pass

class BoardShareUpdate(BaseModel):
    access_type: str

class BoardShare(BoardShareBase):
    id: int
    
    class Config:
        from_attributes = True

class BoardShareInfo(BaseModel):
    id: int
    access_type: str
    user: User
    
    class Config:
        from_attributes = True

# Добавим схему для расширенной информации о доске, включая шаринг
class BoardWithSharing(BoardInDB):
    shared_with: List[BoardShareInfo] = []
    
    class Config:
        from_attributes = True 