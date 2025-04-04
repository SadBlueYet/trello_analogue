from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentUpdate


async def create_comment(db: AsyncSession, comment_in: CommentCreate, user_id: int) -> Comment:
    """Create a new comment."""
    comment = Comment(
        text=comment_in.text,
        card_id=comment_in.card_id,
        user_id=user_id
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


async def get_comment(db: AsyncSession, comment_id: int) -> Optional[Comment]:
    """Get a single comment by ID."""
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    return result.scalars().first()


async def get_card_comments(db: AsyncSession, card_id: int) -> List[Comment]:
    """Get all comments for a specific card."""
    result = await db.execute(
        select(Comment)
        .where(Comment.card_id == card_id)
        .order_by(Comment.created_at)
    )
    return result.scalars().all()


async def update_comment(
    db: AsyncSession, comment: Comment, comment_in: CommentUpdate
) -> Comment:
    """Update a comment."""
    update_data = comment_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(comment, field, value)
    
    await db.commit()
    await db.refresh(comment)
    return comment


async def delete_comment(db: AsyncSession, comment: Comment) -> None:
    """Delete a comment."""
    await db.delete(comment)
    await db.commit() 