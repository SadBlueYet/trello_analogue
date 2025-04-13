from src.schemas.comment import CommentUpdate
from src.repositories import SqlAlchemyRepository
from src.models import Comment
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select


class CommentRepository(SqlAlchemyRepository):
    model: Comment

    def __init__(self, session: AsyncSession):
        super().__init__(Comment, session)


    async def get_card_comments(self, card_id: int) -> list[Comment]:
        query = select(Comment).where(Comment.card_id == card_id).order_by(Comment.created_at)
        result = await self.session.execute(query)
        return result.scalars().all()


    async def update_comment(self, comment: Comment, comment_in: CommentUpdate) -> Comment:
        update_data = comment_in.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(comment, field, value)

        await self.session.commit()
        await self.session.refresh(comment)
        return comment


    async def delete_comment(self, comment: Comment) -> None:
        await self.session.delete(comment)
        await self.session.commit()
            