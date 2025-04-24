async def register_and_login(test_client, email, password, username):
    await test_client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "username": username
    })
    login_response = await test_client.post(
        "/api/v1/auth/login",
        data={
            "username": username,
            "password": password
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    print(login_response.status_code)
    assert login_response.status_code == 200
    
    access_token = login_response.json()["access_token"]
    refresh_token = login_response.json()["refresh_token"]
    
    return access_token, refresh_token
