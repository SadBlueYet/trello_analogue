from tests.api.v1.utils import register_and_login


class TestBoard:
    async def test_create_board(self, test_client):
        access_token, _ = await register_and_login(
            test_client, "board_test@test.com", "password123", "board_test"
        )
        
        test_client.cookies.set("access_token", access_token)
        response = await test_client.post(
            "/api/v1/boards/",
            json={
                "title": "Test Board"
            },
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Test Board"
