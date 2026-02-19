def test_get_position(client):
    user = client.post("/users", json={"name": "Frank", "email": "frank@example.com"}).json()
    client.post("/assets", json={"user_id": user["id"], "type": "property", "value": 20000})
    client.post("/borrow", json={"user_id": user["id"], "amount": 5000})
    response = client.get(f"/positions/{user['id']}")
    data = response.json()
    assert response.status_code == 200
    assert data["total_deposited"] == 20000
    assert data["total_borrowed"] == 5000
    assert data["available_credit"] == 5000  # 50% of 20000 = 10000 - 5000 borrowed
    # Net yield: gross yield (5% of 20000 = 1000) minus interest on debt (5% of 5000 = 250) = 750
    assert data["yield_earned"] == 750
