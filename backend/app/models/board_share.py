from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import Base


class BoardShare(Base):
    """
    Модель для хранения информации о пользователях, которым предоставлен доступ к доске
    """

    __tablename__ = "board_share"

    id = Column(Integer, primary_key=True, index=True)
    board_id = Column(Integer, ForeignKey("board.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("user.id", ondelete="CASCADE"), nullable=False)
    access_type = Column(String, default="read")  # read, write, admin

    # Отношения
    board = relationship("Board", back_populates="shared_with")
    user = relationship("User", back_populates="shared_boards")

    # Ограничение уникальности
    __table_args__ = (UniqueConstraint("board_id", "user_id", name="uix_board_user"),)
