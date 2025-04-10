from typing import Optional

from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    is_active: Optional[bool] = True
    full_name: Optional[str] = None


class UserCreate(UserBase):
    email: EmailStr
    username: str
    password: str


class UserUpdate(UserBase):
    password: Optional[str] = None


class UserProfileUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None


class UserInDBBase(UserBase):
    id: int

    class Config:
        from_attributes = True
