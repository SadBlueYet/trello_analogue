import uuid
import asyncio
import pytest
from typing import AsyncGenerator
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
from src.main import app
from src.db.session import get_db
from src.models import Base

SQLITE_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/trello_clone_test"

engine = create_async_engine(
    SQLITE_DATABASE_URL,
    poolclass=NullPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine, class_=AsyncSession)


@pytest.fixture(autouse=True, scope='session')
async def prepare_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


client = TestClient(app)


@pytest.fixture(scope='session')
async def test_client() -> AsyncGenerator[AsyncClient, None]:
    async def override_get_db():
        try:
            async with TestingSessionLocal() as session:
                yield session
        finally:
            await session.close()

    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url='http://test'
    ) as ac:
        yield ac