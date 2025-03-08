from sqlalchemy import Column, String, Integer, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.models.base import Base


class Card(Base):
    title = Column(String, nullable=False)
    description = Column(Text)
    position = Column(Integer, nullable=False)
    list_id = Column(Integer, ForeignKey("list.id"), nullable=False)
    task_number = Column(String, nullable=True)  # Формат TA-XXX, уникальный в пределах доски
    
    list = relationship("BoardList", back_populates="cards") 