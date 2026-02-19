def test_loan_exceeds_available_credit(client):
    # Create user
    user = client.post("/users", json={"name": "Charlie", "email": "charlie@test.com"}).json()

    # Add assets
    client.post("/assets", json={
        "user_id": user["id"],
        "type": "property",
        "value": 1000
    })

    # Available credit = 50% of assets = 500
    # Request a loan larger than that
    res = client.post("/borrow", json={
        "user_id": user["id"],
        "amount": 600
    })

    assert res.status_code == 400
    assert "Loan exceeds remaining available credit" in res.json()["detail"]
