from typing import Optional

from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from services import UserService
from src.repositories import RepositoryFactory
from src.core.config import settings
from src.crud.board_share import get_board_share
from src.db.session import get_db
from src.models.board import Board
from src.models.user import User
from src.schemas.token import TokenPayload, TokenType


# Keep OAuth2PasswordBearer for compatibility
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


async def get_repository_factory(
    db: AsyncSession = Depends(get_db),
) -> RepositoryFactory:
    return RepositoryFactory(db)


async def get_token_from_cookie_or_header(
    request: Request,
    access_token: Optional[str] = Cookie(None),
) -> str:
    """Get token from cookie or header."""
    if access_token:
        return access_token

    # Fallback to Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]

    # No token found
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )


async def get_current_user(
    factory: RepositoryFactory = Depends(get_repository_factory),
    token: str = Depends(get_token_from_cookie_or_header),
) -> User:
    service = UserService(factory.create_user_repository())
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)
        if token_data.sub is None or token_data.type != TokenType.ACCESS:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await service.get_user_by_id(token_data.sub)
    if not user:
        raise credentials_exception
    return user


async def get_refresh_token(
    refresh_token: Optional[str] = Cookie(None),
) -> str:
    """Get refresh token from cookie."""
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return refresh_token


async def get_user_from_refresh_token(
    factory: RepositoryFactory = Depends(get_repository_factory), refresh_token: str = Depends(get_refresh_token)
) -> User:
    service = UserService(factory.create_user_repository())
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)
        if token_data.sub is None or token_data.type != TokenType.REFRESH:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = await service.get_user_by_id(token_data.sub)
    if not user:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(status_code=400, detail="The user doesn't have enough privileges")
    return current_user


async def check_board_access(
    board: Board,
    current_user: User,
    db: AsyncSession = Depends(get_db),
    access_type: list[str] = ["write", "admin"],
):
    if board.owner_id != current_user.id:
        board_share = await get_board_share(db, board.id, current_user.id)
        if not board_share or board_share.access_type not in access_type:
            raise HTTPException(status_code=403, detail="Not enough permissions")
