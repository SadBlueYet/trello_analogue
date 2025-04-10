from typing import Any, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core import deps
from src.models.user import User
from src.schemas.user import UserInDBBase

router = APIRouter()


@router.get("/search", response_model=List[UserInDBBase])
async def search_users(
    *,
    db: AsyncSession = Depends(deps.get_db),
    current_user: User = Depends(deps.get_current_active_user),
    query: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, description="Number of results to return"),
) -> Any:
    """
    Search for users by username or email.
    """
    # Строим запрос для поиска пользователей
    search_query = f"%{query}%"
    stmt = (
        select(User)
        .filter(
            or_(
                User.username.ilike(search_query),
                User.email.ilike(search_query),
                User.full_name.ilike(search_query) if User.full_name else False,
            )
        )
        .limit(limit)
    )

    result = await db.execute(stmt)

    users = result.scalars().all()
    users = [user for user in users if user.id != current_user.id]

    return users
