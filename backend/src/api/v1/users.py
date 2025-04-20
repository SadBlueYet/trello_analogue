from typing import Any, List

from fastapi import APIRouter, Depends, Query

from src.core import deps
from src.models.user import User
from src.schemas.user import UserInDBBase
from src.services import ServiceFactory

router = APIRouter()


@router.get("/search", response_model=List[UserInDBBase])
async def search_users(
    *,
    current_user: User = Depends(deps.get_current_active_user),
    factoty: ServiceFactory = Depends(deps.get_sqlalchemy_service_factory),
    query: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(10, description="Number of results to return"),
) -> Any:
    """
    Search for users by username or email.
    """
    service = factoty.create_user_service()
    return await service.search_users(query, limit, current_user.id)
