from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import Base


class Card(Base):
    card_id = Column(Integer, nullable=False, unique=False, autoincrement=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    position = Column(Integer, nullable=False)
    list_id = Column(Integer, ForeignKey("list.id"), nullable=False)
    card_color = Column(String, nullable=True)  # Цвет карточки в формате CSS-градиента
    
    list = relationship("BoardList", back_populates="cards") 