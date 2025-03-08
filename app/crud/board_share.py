from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from app.models.board_share import BoardShare
from app.models.user import User
from app.schemas.board import BoardShareCreate, BoardShareUpdate


async def get_board_shares(db: AsyncSession, board_id: int) -> List[BoardShare]:
    """Получить список всех пользователей с доступом к доске"""
    query = select(BoardShare).filter(BoardShare.board_id == board_id)
    result = await db.execute(query)
    return result.scalars().all()


async def get_board_share(db: AsyncSession, board_id: int, user_id: int) -> Optional[BoardShare]:
    """Получить запись о доступе конкретного пользователя к доске"""
    query = select(BoardShare).filter(
        BoardShare.board_id == board_id,
        BoardShare.user_id == user_id
    )
    result = await db.execute(query)
    return result.scalars().first()


async def get_shared_boards_for_user(db: AsyncSession, user_id: int) -> List[BoardShare]:
    """Получить список всех досок, к которым у пользователя есть доступ"""
    query = select(BoardShare).filter(BoardShare.user_id == user_id)
    result = await db.execute(query)
    return result.scalars().all()


async def create_board_share(
    db: AsyncSession, board_share: BoardShareCreate
) -> BoardShare:
    """Предоставить пользователю доступ к доске"""
    db_board_share = BoardShare(
        board_id=board_share.board_id,
        user_id=board_share.user_id,
        access_type=board_share.access_type
    )
    db.add(db_board_share)
    await db.commit()
    await db.refresh(db_board_share)
    return db_board_share


async def update_board_share(
    db: AsyncSession, db_board_share: BoardShare, board_share_update: BoardShareUpdate
) -> BoardShare:
    """Обновить тип доступа пользователя к доске"""
    update_data = board_share_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_board_share, key, value)
    
    await db.commit()
    await db.refresh(db_board_share)
    return db_board_share


async def delete_board_share(db: AsyncSession, db_board_share: BoardShare) -> None:
    """Удалить доступ пользователя к доске"""
    await db.delete(db_board_share)
    await db.commit()


async def get_board_shares_with_user_info(db: AsyncSession, board_id: int) -> List[BoardShare]:
    """Получить список всех пользователей с доступом к доске, включая информацию о пользователях"""
    query = select(BoardShare).options(
        joinedload(BoardShare.user)
    ).filter(BoardShare.board_id == board_id)
    
    result = await db.execute(query)
    return result.unique().scalars().all() 