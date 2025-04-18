from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from .base import Base


class Board(Base):
    title = Column(String, nullable=False)
    description = Column(String)
    background_color = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("user.id"), nullable=False)

    owner = relationship("User", backref="boards")
    lists = relationship("BoardList", back_populates="board", cascade="all, delete-orphan")
    shared_with = relationship("BoardShare", back_populates="board", cascade="all, delete-orphan")
