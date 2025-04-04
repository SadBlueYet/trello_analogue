from typing import Optional, List, ForwardRef
from pydantic import BaseModel
from datetime import datetime
from app.schemas.user import UserInDBBase

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
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

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


class BoardWithLists(BoardInDBBase):
    lists: List[BoardListInDBBase] = []


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


class BoardShareInfo(BaseModel):
    id: int
    access_type: str
    user: UserInDBBase
    
    class Config:
        from_attributes = True
