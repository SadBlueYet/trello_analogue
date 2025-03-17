import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

def test_register_user(client: TestClient):
    data = {
        "email": "newuser@example.com",
        "username": "newuser",
        "password": "newpass123",
        "full_name": "New User"
    }
    response = client.post("/api/v1/auth/register", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["email"] == data["email"]
    assert result["username"] == data["username"]
    assert "password" not in result

def test_register_existing_email(client: TestClient, test_user: dict):
    data = {
        "email": test_user["email"],
        "username": "different",
        "password": "newpass123",
        "full_name": "Different User"
    }
    response = client.post("/api/v1/auth/register", json=data)
    assert response.status_code == 400
    assert "email already exists" in response.json()["detail"].lower()

def test_register_existing_username(client: TestClient, test_user: dict):
    data = {
        "email": "different@example.com",
        "username": test_user["username"],
        "password": "newpass123",
        "full_name": "Different User"
    }
    response = client.post("/api/v1/auth/register", json=data)
    assert response.status_code == 400
    assert "username already exists" in response.json()["detail"].lower()

def test_login_success(client: TestClient, test_user: dict):
    data = {
        "username": test_user["username"],
        "password": test_user["password"]
    }
    response = client.post("/api/v1/auth/login", data=data)
    assert response.status_code == 200
    result = response.json()
    assert "access_token" in result
    assert "refresh_token" in result
    assert result["token_type"] == "bearer"

def test_login_wrong_password(client: TestClient, test_user: dict):
    data = {
        "username": test_user["username"],
        "password": "wrongpass"
    }
    response = client.post("/api/v1/auth/login", data=data)
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()

def test_login_nonexistent_user(client: TestClient):
    data = {
        "username": "nonexistent",
        "password": "testpass123"
    }
    response = client.post("/api/v1/auth/login", data=data)
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()

def test_get_current_user(authorized_client: TestClient, test_user: dict):
    response = authorized_client.get("/api/v1/auth/me")
    assert response.status_code == 200
    result = response.json()
    assert result["email"] == test_user["email"]
    assert result["username"] == test_user["username"]

def test_get_current_user_unauthorized(client: TestClient):
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "detail" in response.json()

def test_update_profile(authorized_client: TestClient, test_user: dict):
    data = {
        "full_name": "Updated Name",
        "email": "updated@example.com"
    }
    response = authorized_client.put("/api/v1/auth/update-profile", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["full_name"] == data["full_name"]
    assert result["email"] == data["email"]

def test_logout(authorized_client: TestClient):
    response = authorized_client.post("/api/v1/auth/logout")
    assert response.status_code == 200 