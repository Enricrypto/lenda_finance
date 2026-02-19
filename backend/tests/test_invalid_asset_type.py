def test_invalid_asset_type(client):
    # Create a user first
    user = client.post("/users", json={"name": "Alice", "email": "alice@test.com"}).json()

    # Try to create asset with invalid type
    res = client.post("/assets", json={
        "user_id": user["id"],
        "type": "gold",  # invalid
        "value": 1000
    })

    assert res.status_code == 400
    assert "Invalid asset type" in res.json()["detail"]
