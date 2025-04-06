from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .base import Base


class Card(Base):
    card_id = Column(Integer, nullable=False, unique=False, autoincrement=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    position = Column(Integer, nullable=False)
    list_id = Column(Integer, ForeignKey("list.id"), nullable=False)
    card_color = Column(String, nullable=True)  # Цвет карточки в формате CSS-градиента
    assignee_id = Column(Integer, ForeignKey("user.id"), nullable=True)  # ID пользователя, ответственного за карточку

    list = relationship("BoardList", back_populates="cards")
    assignee = relationship("User", backref="assigned_cards")
    comments = relationship("Comment", back_populates="card", cascade="all, delete-orphan")
