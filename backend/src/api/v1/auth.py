from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordRequestForm

from src.core.deps import get_repository_factory
from src.repositories import RepositoryFactory
from src.services import UserService
from src.core.config import settings
from src.core.deps import get_current_active_user, get_user_from_refresh_token
from src.core.security import create_access_token, create_refresh_token, delete_auth_cookies, set_auth_cookies
from src.models.user import User
from src.schemas.token import Token
from src.schemas.user import UserCreate, UserInDBBase, UserProfileUpdate

router = APIRouter()


@router.post("/register", response_model=UserInDBBase)
async def register(
    *,
    user_in: UserCreate,
    factory: RepositoryFactory = Depends(get_repository_factory),
) -> Any:
    """
    Register a new user.
    """
    service = UserService(factory.create_user_repository())
    user = await service.get_user_by_email(user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="A user with this email already exists.",
        )
    user = await service.get_user_by_username(username=user_in.username)
    if user:
        raise HTTPException(status_code=400, detail="A user with this username already exists.")
    user = await service.create_user(user_in)
    return user


@router.post("/login", response_model=Token)
async def login(
    response: Response,
    form_data: OAuth2PasswordRequestForm = Depends(),
    factory: RepositoryFactory = Depends(get_repository_factory),
) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    Sets HTTP-only cookies for access and refresh tokens.
    """
    service = UserService(factory.create_user_repository())
    user = await service.authenticate(username=form_data.username, password=form_data.password)

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    access_token = create_access_token(user.id, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(user.id, expires_delta=refresh_token_expires)

    set_auth_cookies(response, access_token, refresh_token)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=Token)
async def refresh_token(
    response: Response,
    current_user: User = Depends(get_user_from_refresh_token),
) -> Any:
    """
    Refresh access token using refresh token cookie.
    """
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    access_token = create_access_token(current_user.id, expires_delta=access_token_expires)
    refresh_token = create_refresh_token(current_user.id, expires_delta=refresh_token_expires)

    set_auth_cookies(response, access_token, refresh_token)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/logout")
async def logout(response: Response) -> Any:
    """
    Logout user by deleting auth cookies.
    """
    delete_auth_cookies(response)
    return {"detail": "Successfully logged out"}


@router.get("/me", response_model=UserInDBBase)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get current user information.
    """
    return current_user


@router.put("/update-profile", response_model=UserInDBBase)
async def update_profile(
    *,
    profile_update: UserProfileUpdate,
    factory: RepositoryFactory = Depends(get_repository_factory),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Update current user profile.
    """
    try:
        service = UserService(factory.create_user_repository())
        updated_user = await service.update_user_profile(
            current_user=current_user, profile_update=profile_update
        )
        return updated_user
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}",
        )
