def test_negative_asset_value(client):
    user = client.post("/users", json={"name": "Bob", "email": "bob@test.com"}).json()

    res = client.post("/assets", json={
        "user_id": user["id"],
        "type": "crypto",
        "value": -500
    })

    assert res.status_code == 400
    assert "Asset value must be positive" in res.json()["detail"]
