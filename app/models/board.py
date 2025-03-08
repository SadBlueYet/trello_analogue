from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class Board(Base):
    title = Column(String, nullable=False)
    description = Column(String)
    background_color = Column(String, nullable=True)
    owner_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    
    owner = relationship("User", backref="boards")
    lists = relationship("BoardList", back_populates="board", cascade="all, delete-orphan")


class BoardList(Base):
    __tablename__ = "list"
    
    title = Column(String, nullable=False)
    position = Column(Integer, nullable=False)
    board_id = Column(Integer, ForeignKey("board.id"), nullable=False)
    
    board = relationship("Board", back_populates="lists")
    cards = relationship("Card", back_populates="list", cascade="all, delete-orphan") 