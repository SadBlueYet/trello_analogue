from src.schemas.comment import CommentCreate, CommentUpdate
from src.models import Comment
from src.repositories import BaseRepository


class CommentService:
    def __init__(self, repository: BaseRepository):
        self.repository = repository

    async def get_comment(self, comment_id: int) -> Comment | None:
        return await self.repository.get_one(id=comment_id)
    
    async def get_card_comments(self, card_id: int) -> list[Comment]:
        return await self.repository.get_all(card_id=card_id)
    
    async def create_comment(self, comment_in: CommentCreate, user_id: int) -> Comment:
        comment = comment_in.model_dump()
        comment["user_id"] = user_id
        return await self.repository.create(comment)
    
    async def update_comment(self, comment: Comment, comment_in: CommentUpdate) -> Comment:
        return await self.repository.update(comment, comment_in)
    
    async def delete_comment(self, comment: Comment) -> None:
        return await self.repository.delete(comment)
