from typing import Optional
from fastapi import Depends, HTTPException, status, Cookie, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.schemas.token import TokenPayload, TokenType
from app.models.board import Board
from app.crud.board_share import get_board_share

# Keep OAuth2PasswordBearer for compatibility
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")


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
    db: AsyncSession = Depends(get_db),
    token: str = Depends(get_token_from_cookie_or_header)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            raise credentials_exception
        
        if token_data.type != TokenType.ACCESS:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.get(User, token_data.sub)
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
    db: AsyncSession = Depends(get_db),
    refresh_token: str = Depends(get_refresh_token)
) -> User:
    """Validate refresh token and return user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid refresh token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            raise credentials_exception
        
        # Verify it's a refresh token not an access token
        if token_data.type != TokenType.REFRESH:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = await db.get(User, token_data.sub)
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
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user 

async def check_board_access(board: Board, current_user: User, db: AsyncSession = Depends(get_db), access_type: list[str] = ["write", "admin"]):
    if board.owner_id != current_user.id:
        board_share = await get_board_share(db, board.id, current_user.id)
        if not board_share or board_share.access_type not in access_type:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        