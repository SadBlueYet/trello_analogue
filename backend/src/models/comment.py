from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .base import Base


class Comment(Base):
    text = Column(Text, nullable=False)
    card_id = Column(Integer, ForeignKey("card.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)

    card = relationship("Card", back_populates="comments")
    user = relationship("User", back_populates="comments")
