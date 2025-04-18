from typing import List, Optional

from dotenv import load_dotenv
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    load_dotenv(override=True)
    PROJECT_NAME: str = "Task Flow"
    API_V1_STR: str = "/api/v1"

    # JWT
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Cookie settings
    COOKIE_DOMAIN: Optional[str] = None
    COOKIE_SECURE: bool = False
    COOKIE_SAMESITE: str = "lax"
    COOKIE_HTTP_ONLY: bool = True

    # CORS
    CORS_ORIGINS: List[str] = []

    # Database
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: str

    REDIS_DSN: str
    REDIS_PASSWORD: str

    SMTP_LOGIN: str
    SMTP_PASSWORD: str
    SMTP_HOST: str
    SMTP_PORT: int

    FRONTEND_URL: str

    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings()
