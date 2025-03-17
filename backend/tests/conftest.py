import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from typing import AsyncGenerator, Generator
import uuid
import asyncio
import sqlite3

from app.main import app
from app.models import Base
from app.core.deps import get_db
from app.crud import user as crud_user
from app.schemas.user import UserCreate

# Use an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Dictionary to store sequence values
sequences = {}

async def create_sequence(conn, sequence_name):
    """Create a sequence if it doesn't exist"""
    if sequence_name not in sequences:
        sequences[sequence_name] = 0
    return True

async def nextval(conn, sequence_name):
    """Get next value from sequence"""
    if sequence_name not in sequences:
        sequences[sequence_name] = 0
    sequences[sequence_name] += 1
    return sequences[sequence_name]

# Register the functions with SQLite
@pytest.fixture(scope="session", autouse=True)
def setup_sqlite():
    def _create_sequence(sequence_name):
        if sequence_name not in sequences:
            sequences[sequence_name] = 0
        return True

    def _nextval(sequence_name):
        if sequence_name not in sequences:
            sequences[sequence_name] = 0
        sequences[sequence_name] += 1
        return sequences[sequence_name]

    # Register the functions with SQLite
    sqlite3.enable_callback_tracebacks(True)
    sqlite3.create_function("create_sequence", 1, _create_sequence)
    sqlite3.create_function("nextval", 1, _nextval)

engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for each test case."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="function")
async def db() -> AsyncGenerator[AsyncSession, None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with TestingSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def client() -> Generator:
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="function")
async def test_user(db: AsyncSession) -> dict:
    unique_id = str(uuid.uuid4())[:8]
    user_in = UserCreate(
        email=f"test_{unique_id}@example.com",
        username=f"testuser_{unique_id}",
        password="testpass123",
        full_name="Test User"
    )
    user = await crud_user.create_user(db, user_in)
    await db.commit()
    await db.refresh(user)
    
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "password": "testpass123",  # Store password for login tests
        "full_name": user.full_name
    }

@pytest.fixture(scope="function")
async def test_user_token(client: TestClient, test_user: dict) -> str:
    login_data = {
        "username": test_user["username"],
        "password": test_user["password"]
    }
    response = client.post("/api/v1/auth/login", data=login_data)
    tokens = response.json()
    return tokens["access_token"]

@pytest.fixture(scope="function")
def authorized_client(client: TestClient, test_user_token: str) -> TestClient:
    client.headers = {
        **client.headers,
        "Authorization": f"Bearer {test_user_token}"
    }
    return client

@pytest.fixture(scope="function")
async def test_board(authorized_client: TestClient) -> dict:
    data = {
        "title": "Test Board",
        "description": "Test Board Description"
    }
    response = authorized_client.post("/api/v1/boards/", json=data)
    return response.json()

@pytest.fixture(scope="function")
async def test_list(authorized_client: TestClient, test_board: dict) -> dict:
    data = {
        "title": "Test List",
        "board_id": test_board["id"],
        "position": 1
    }
    response = authorized_client.post("/api/v1/lists/", json=data)
    assert response.status_code == 200, f"Failed to create test list: {response.json()}"
    result = response.json()
    # Ensure the response has all required fields
    assert "id" in result, "List response missing id field"
    assert "title" in result, "List response missing title field"
    assert "board_id" in result, "List response missing board_id field"
    assert "position" in result, "List response missing position field"
    return result

@pytest.fixture(scope="function")
async def test_card(authorized_client: TestClient, test_list: dict) -> dict:
    data = {
        "title": "Test Card",
        "description": "Test Card Description",
        "list_id": test_list["id"],
        "position": 1,
        "card_color": "#ff0000"
    }
    response = authorized_client.post("/api/v1/cards/", json=data)
    assert response.status_code == 200, f"Failed to create test card: {response.json()}"
    result = response.json()
    # Ensure the response has all required fields
    assert "id" in result, "Card response missing id field"
    assert "title" in result, "Card response missing title field"
    assert "description" in result, "Card response missing description field"
    assert "list_id" in result, "Card response missing list_id field"
    assert "position" in result, "Card response missing position field"
    assert "card_color" in result, "Card response missing card_color field"
    return result

@pytest.fixture(autouse=True)
async def setup_db(db: AsyncSession) -> None:
    """Automatically set up the database before each test."""
    pass  # The db fixture will handle everything we need 