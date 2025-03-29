from sqlalchemy import Boolean, Column, String
from sqlalchemy.orm import relationship
from .base import Base


class User(Base):
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    # Доски, к которым пользователю предоставлен доступ
    shared_boards = relationship("BoardShare", back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan") 