from fastapi import APIRouter
from app.api.v1 import auth, boards, lists, cards, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(boards.router, prefix="/boards", tags=["boards"])
api_router.include_router(lists.router, prefix="/lists", tags=["lists"])
api_router.include_router(cards.router, prefix="/cards", tags=["cards"])
