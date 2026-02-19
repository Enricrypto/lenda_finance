def test_create_asset(client):
    user_res = client.post("/users", json={"name": "Alice", "email": "alice2@example.com"}).json()
    user_id = user_res["id"]
    response = client.post("/assets", json={"user_id": user_id, "type": "property", "value": 5000})
    data = response.json()
    assert response.status_code == 200
    assert "id" in data
    assert data["value"] == 5000

def test_create_asset_invalid_user(client):
    response = client.post("/assets", json={"user_id": "nonexistent", "type": "property", "value": 5000})
    assert response.status_code == 404

def test_list_assets(client):
    response = client.get("/assets")
    data = response.json()
    assert response.status_code == 200
    assert isinstance(data, list)
