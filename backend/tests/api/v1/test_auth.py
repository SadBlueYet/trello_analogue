import pytest
from fastapi.testclient import TestClient
from tests.api.v1.utils import register_and_login

class TestAuth:
    async def test_register(self, test_client):
        response = await test_client.post("/api/v1/auth/register", json={
            "email": "test@test.com",
            "password": "test",
            "username": "test",
        })
        assert response.status_code == 200
        assert response.json()["email"] == "test@test.com"

    async def test_login(self, test_client):
        access_token, refresh_token = await register_and_login(
            test_client, "login_test@test.com", "password123", "login_test"
        )

        assert access_token
        assert refresh_token

    async def test_refresh_token(self, test_client):
        _, refresh_token = await register_and_login(
            test_client, "refresh_test@test.com", "password123", "refresh_test"
        )
        
        test_client.cookies.set("refresh_token", refresh_token)
        response = await test_client.post(
            "/api/v1/auth/refresh",
        )
        assert response.status_code == 200
        assert "access_token" in response.json()
        assert "refresh_token" in response.json()
    
    async def test_me(self, test_client):
        access_token, _ = await register_and_login(
            test_client, "me_test@test.com", "password123", "me_test"
        )
        
        test_client.cookies.set("access_token", access_token)
        response = await test_client.get(
            "/api/v1/auth/me",
        )
        assert response.status_code == 200
        assert response.json()["email"] == "me_test@test.com"
        assert response.json()["username"] == "me_test"
    
    async def test_logout(self, test_client):
        access_token, _ = await register_and_login(
            test_client, "logout_test@test.com", "password123", "logout_test"
        )
        
        test_client.cookies.set("access_token", access_token)
        response = await test_client.post("/api/v1/auth/logout")
        
        assert response.status_code == 200
        assert "successfully logged out" in response.json()["detail"].lower()
        
        cookie_headers = [header_value for name, header_value in response.headers.items() 
                         if name.lower() == "set-cookie"]

        all_cookies = "".join(cookie_headers)
        assert "access_token=" in all_cookies
        assert "refresh_token=" in all_cookies