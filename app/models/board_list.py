from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class BoardList(Base):
    __tablename__ = "list"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    position = Column(Integer, nullable=False)
    board_id = Column(Integer, ForeignKey("board.id"), nullable=False)
    list_color = Column(String, nullable=True)  # Цвет списка в формате CSS-градиента
    
    board = relationship("Board", back_populates="lists")
    cards = relationship("Card", back_populates="list", cascade="all, delete-orphan") 