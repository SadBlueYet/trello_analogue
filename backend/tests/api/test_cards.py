import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

pytestmark = pytest.mark.asyncio

def test_create_card(authorized_client: TestClient, test_list: dict):
    data = {
        "title": "New Card",
        "description": "New Card Description",
        "list_id": test_list["id"],
        "position": 1,
        "card_color": "#00ff00"
    }
    response = authorized_client.post("/api/v1/cards/", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["title"] == data["title"]
    assert result["description"] == data["description"]
    assert result["list_id"] == test_list["id"]
    assert result["position"] == data["position"]
    assert result["card_color"] == data["card_color"]

def test_create_card_unauthorized(client: TestClient, test_list: dict):
    data = {
        "title": "New Card",
        "description": "New Card Description",
        "list_id": test_list["id"],
        "position": 1,
        "card_color": "#00ff00"
    }
    # Remove any existing authorization headers
    client.headers.pop("Authorization", None)
    response = client.post("/api/v1/cards/", json=data)
    assert response.status_code == 401

def test_create_card_nonexistent_list(authorized_client: TestClient):
    data = {
        "title": "New Card",
        "description": "New Card Description",
        "list_id": 99999,
        "position": 1
    }
    response = authorized_client.post("/api/v1/cards/", json=data)
    assert response.status_code == 404

def test_get_list_cards(authorized_client: TestClient, test_list: dict, test_card: dict):
    response = authorized_client.get(f"/api/v1/cards/?list_id={test_list['id']}")
    assert response.status_code == 200
    result = response.json()
    assert isinstance(result, list)
    assert len(result) > 0
    # Check that the test card is in the results
    found = False
    for card in result:
        if card["id"] == test_card["id"]:
            found = True
            assert card["title"] == test_card["title"]
            assert card["description"] == test_card["description"]
            assert card["list_id"] == test_card["list_id"]
            assert card["position"] == test_card["position"]
            assert card["card_color"] == test_card["card_color"]
            break
    assert found, "Test card not found in results"

def test_get_card(authorized_client: TestClient, test_card: dict):
    response = authorized_client.get(f"/api/v1/cards/{test_card['id']}")
    assert response.status_code == 200
    result = response.json()
    assert result["id"] == test_card["id"]
    assert result["title"] == test_card["title"]
    assert result["description"] == test_card["description"]
    assert result["list_id"] == test_card["list_id"]
    assert result["position"] == test_card["position"]
    assert result["card_color"] == test_card["card_color"]

def test_get_nonexistent_card(authorized_client: TestClient):
    response = authorized_client.get("/api/v1/cards/99999")
    assert response.status_code == 404

def test_update_card(authorized_client: TestClient, test_card: dict):
    data = {
        "title": "Updated Card",
        "description": "Updated Card Description",
        "card_color": "#0000ff"
    }
    response = authorized_client.put(f"/api/v1/cards/{test_card['id']}", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["title"] == data["title"]
    assert result["description"] == data["description"]
    assert result["card_color"] == data["card_color"]

def test_update_nonexistent_card(authorized_client: TestClient):
    data = {
        "title": "Updated Card",
        "description": "Updated Card Description"
    }
    response = authorized_client.put("/api/v1/cards/99999", json=data)
    assert response.status_code == 404

def test_move_card(authorized_client: TestClient, test_card: dict, test_list: dict):
    data = {
        "target_list_id": test_list["id"],
        "new_position": 1
    }
    response = authorized_client.post(f"/api/v1/cards/{test_card['id']}/move", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["list_id"] == test_list["id"]
    assert result["position"] == data["new_position"]

def test_move_card_nonexistent_card(authorized_client: TestClient, test_list: dict):
    data = {
        "target_list_id": test_list["id"],
        "new_position": 0
    }
    response = authorized_client.post("/api/v1/cards/99999/move", json=data)
    assert response.status_code == 404

def test_move_card_nonexistent_list(authorized_client: TestClient, test_card: dict):
    data = {
        "target_list_id": 99999,
        "new_position": 0
    }
    response = authorized_client.post(f"/api/v1/cards/{test_card['id']}/move", json=data)
    assert response.status_code == 404

def test_delete_card(authorized_client: TestClient, test_card: dict):
    response = authorized_client.delete(f"/api/v1/cards/{test_card['id']}")
    assert response.status_code == 200
    
    # Verify card is deleted
    response = authorized_client.get(f"/api/v1/cards/{test_card['id']}")
    assert response.status_code == 404

def test_delete_nonexistent_card(authorized_client: TestClient):
    response = authorized_client.delete("/api/v1/cards/99999")
    assert response.status_code == 404 