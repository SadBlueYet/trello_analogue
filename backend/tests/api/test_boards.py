import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

pytestmark = pytest.mark.asyncio

@pytest.fixture(scope="function")
async def test_board(authorized_client: TestClient) -> dict:
    data = {
        "title": "Test Board",
        "description": "Test Board Description"
    }
    response = authorized_client.post("/api/v1/boards/", json=data)
    return response.json()

def test_create_board(authorized_client: TestClient):
    data = {
        "title": "New Board",
        "description": "New Board Description"
    }
    response = authorized_client.post("/api/v1/boards/", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["title"] == data["title"]
    assert result["description"] == data["description"]

def test_create_board_unauthorized(client: TestClient):
    data = {
        "title": "New Board",
        "description": "New Board Description"
    }
    response = client.post("/api/v1/boards/", json=data)
    assert response.status_code == 401

def test_get_boards(authorized_client: TestClient, test_board: dict):
    response = authorized_client.get("/api/v1/boards/")
    assert response.status_code == 200
    result = response.json()
    assert isinstance(result, list)
    assert len(result) > 0
    assert any(board["id"] == test_board["id"] for board in result)

def test_get_board(authorized_client: TestClient, test_board: dict):
    response = authorized_client.get(f"/api/v1/boards/{test_board['id']}")
    assert response.status_code == 200
    result = response.json()
    assert result["id"] == test_board["id"]
    assert result["title"] == test_board["title"]

def test_get_nonexistent_board(authorized_client: TestClient):
    response = authorized_client.get("/api/v1/boards/99999")
    assert response.status_code == 404

def test_update_board(authorized_client: TestClient, test_board: dict):
    data = {
        "title": "Updated Board",
        "description": "Updated Board Description"
    }
    response = authorized_client.put(f"/api/v1/boards/{test_board['id']}", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["title"] == data["title"]
    assert result["description"] == data["description"]

def test_update_nonexistent_board(authorized_client: TestClient):
    data = {
        "title": "Updated Board",
        "description": "Updated Board Description"
    }
    response = authorized_client.put("/api/v1/boards/99999", json=data)
    assert response.status_code == 404

def test_delete_board(authorized_client: TestClient, test_board: dict):
    response = authorized_client.delete(f"/api/v1/boards/{test_board['id']}")
    assert response.status_code == 200
    
    # Verify board is deleted
    response = authorized_client.get(f"/api/v1/boards/{test_board['id']}")
    assert response.status_code == 404

def test_delete_nonexistent_board(authorized_client: TestClient):
    response = authorized_client.delete("/api/v1/boards/99999")
    assert response.status_code == 404

# Board sharing tests
@pytest.fixture(scope="function")
async def shared_user(client: TestClient) -> dict:
    data = {
        "email": "shared@example.com",
        "username": "shareduser",
        "password": "sharedpass123",
        "full_name": "Shared User"
    }
    response = client.post("/api/v1/auth/register", json=data)
    return response.json()

def test_share_board(authorized_client: TestClient, test_board: dict, shared_user: dict):
    data = {
        "user_id": shared_user["id"],
        "board_id": test_board["id"],
        "access_type": "read"
    }
    response = authorized_client.post(f"/api/v1/boards/{test_board['id']}/share", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["id"] > 0
    assert result["access_type"] == data["access_type"]
    assert result["user"]["id"] == shared_user["id"]

def test_get_board_shares(authorized_client: TestClient, test_board: dict, shared_user: dict):
    # First share the board
    data = {
        "user_id": shared_user["id"],
        "board_id": test_board["id"],
        "access_type": "read"
    }
    authorized_client.post(f"/api/v1/boards/{test_board['id']}/share", json=data)
    
    response = authorized_client.get(f"/api/v1/boards/{test_board['id']}/share")
    assert response.status_code == 200
    result = response.json()
    assert isinstance(result, list)
    assert len(result) > 0
    assert result[0]["user"]["id"] == shared_user["id"]

def test_update_board_share(authorized_client: TestClient, test_board: dict, shared_user: dict):
    # First share the board
    data = {
        "user_id": shared_user["id"],
        "board_id": test_board["id"],
        "access_type": "read"
    }
    authorized_client.post(f"/api/v1/boards/{test_board['id']}/share", json=data)
    
    update_data = {
        "access_type": "write"
    }
    response = authorized_client.put(
        f"/api/v1/boards/{test_board['id']}/share/{shared_user['id']}", 
        json=update_data
    )
    assert response.status_code == 200
    result = response.json()
    assert result["access_type"] == update_data["access_type"]

def test_delete_board_share(authorized_client: TestClient, test_board: dict, shared_user: dict):
    # First share the board
    data = {
        "user_id": shared_user["id"],
        "board_id": test_board["id"],
        "access_type": "read"
    }
    authorized_client.post(f"/api/v1/boards/{test_board['id']}/share", json=data)
    
    response = authorized_client.delete(
        f"/api/v1/boards/{test_board['id']}/share/{shared_user['id']}"
    )
    assert response.status_code == 200
    
    # Verify share is deleted
    response = authorized_client.get(f"/api/v1/boards/{test_board['id']}/share")
    shares = response.json()
    assert not any(share["user"]["id"] == shared_user["id"] for share in shares) 