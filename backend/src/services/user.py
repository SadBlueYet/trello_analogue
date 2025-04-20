from fastapi import HTTPException, status

from src.core.security import verify_password
from src.core.security import get_password_hash
from src.schemas.user import UserCreate, UserProfileUpdate
from src.repositories import BaseRepository
from src.models import User


class UserService:
    def __init__(self, repository: BaseRepository):
         self.repository = repository

    async def get_user_by_id(self, user_id: int) -> User | None:
        return await self.repository.get_one(id=user_id)

    async def get_user_by_email(self, email: str) -> User | None:
        return await self.repository.get_one(email=email)

    async def get_user_by_username(self, username: str) -> User | None:
        return await self.repository.get_one(username=username)

    async def create_user(self, user: UserCreate) -> User:
        user_in = user.model_dump()
        del user_in["password"]
        user_in["hashed_password"] = get_password_hash(user.password)
        return await self.repository.create(user_in)

    async def authenticate(self, username: str, password: str) -> User | None:
        user = await self.get_user_by_username(username)
        if user and verify_password(password, user.hashed_password):
            if not user.is_active:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
            return user
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

    async def update_user_profile(self, current_user: User, profile_update: UserProfileUpdate) -> User:
        if profile_update.email and profile_update.email != current_user.email:
            existing_user = await self.get_user_by_email(profile_update.email)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            current_user.email = profile_update.email

        if profile_update.username and profile_update.username != current_user.username:
            existing_user = await self.get_user_by_username(profile_update.username)
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
            current_user.username = profile_update.username

        if profile_update.full_name is not None:
            current_user.full_name = profile_update.full_name

        if profile_update.new_password:
            if not profile_update.current_password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Current password is required to set a new password"
                )
            if not verify_password(profile_update.current_password, current_user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Incorrect current password"
                )
            current_user.hashed_password = get_password_hash(profile_update.new_password)

        return await self.repository.update_user_profile(current_user)

    async def search_users(self, query: str, limit: int, current_user_id: int):
        return await self.repository.search_users(query, limit, current_user_id)
