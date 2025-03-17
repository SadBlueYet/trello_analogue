import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

pytestmark = pytest.mark.asyncio

def test_create_list(authorized_client: TestClient, test_board: dict):
    data = {
        "title": "New List",
        "board_id": test_board["id"],
        "position": 1
    }
    response = authorized_client.post("/api/v1/lists/", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["title"] == data["title"]
    assert result["board_id"] == test_board["id"]
    assert result["position"] == data["position"]

def test_create_list_unauthorized(client: TestClient, test_board: dict):
    data = {
        "title": "New List",
        "board_id": test_board["id"],
        "position": 1
    }
    # Remove any existing authorization headers
    client.headers.pop("Authorization", None)
    response = client.post("/api/v1/lists/", json=data)
    assert response.status_code == 401

def test_create_list_nonexistent_board(authorized_client: TestClient):
    data = {
        "title": "New List",
        "board_id": 99999,
        "position": 1
    }
    response = authorized_client.post("/api/v1/lists/", json=data)
    assert response.status_code == 404

def test_get_board_lists(authorized_client: TestClient, test_board: dict, test_list: dict):
    response = authorized_client.get(f"/api/v1/lists/?board_id={test_board['id']}")
    assert response.status_code == 200
    result = response.json()
    assert isinstance(result, list)
    assert len(result) > 0
    # Check that the test list is in the results
    found = False
    for lst in result:
        if lst["id"] == test_list["id"]:
            found = True
            assert lst["title"] == test_list["title"]
            assert lst["board_id"] == test_list["board_id"]
            assert lst["position"] == test_list["position"]
            break
    assert found, "Test list not found in results"

def test_get_list(authorized_client: TestClient, test_list: dict):
    response = authorized_client.get(f"/api/v1/lists/{test_list['id']}")
    assert response.status_code == 200
    result = response.json()
    assert result["id"] == test_list["id"]
    assert result["title"] == test_list["title"]
    assert result["board_id"] == test_list["board_id"]
    assert result["position"] == test_list["position"]

def test_get_nonexistent_list(authorized_client: TestClient):
    response = authorized_client.get("/api/v1/lists/99999")
    assert response.status_code == 404

def test_update_list(authorized_client: TestClient, test_list: dict):
    data = {
        "title": "Updated List"
    }
    response = authorized_client.put(f"/api/v1/lists/{test_list['id']}", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["title"] == data["title"]

def test_update_nonexistent_list(authorized_client: TestClient):
    data = {
        "title": "Updated List"
    }
    response = authorized_client.put("/api/v1/lists/99999", json=data)
    assert response.status_code == 404

def test_reorder_list(authorized_client: TestClient, test_list: dict):
    data = {
        "new_position": 1
    }
    response = authorized_client.post(f"/api/v1/lists/{test_list['id']}/reorder", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["position"] == data["new_position"]

def test_reorder_nonexistent_list(authorized_client: TestClient):
    data = {
        "new_position": 1
    }
    response = authorized_client.post("/api/v1/lists/99999/reorder", json=data)
    assert response.status_code == 404

def test_delete_list(authorized_client: TestClient, test_list: dict):
    response = authorized_client.delete(f"/api/v1/lists/{test_list['id']}")
    assert response.status_code == 200
    
    # Verify list is deleted
    response = authorized_client.get(f"/api/v1/lists/{test_list['id']}")
    assert response.status_code == 404

def test_delete_nonexistent_list(authorized_client: TestClient):
    response = authorized_client.delete("/api/v1/lists/99999")
    assert response.status_code == 404 