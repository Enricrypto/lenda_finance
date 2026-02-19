from app.rules import LoanStatus

def test_partial_repayment(client):
    user = client.post("/users", json={"name": "Anna", "email": "anna@test.com"}).json()
    client.post("/assets", json={"user_id": user["id"], "type": "property", "value": 1000})
    loan = client.post("/borrow", json={"user_id": user["id"], "amount": 400}).json()

    # Partial repayment
    response = client.post(f"/repay/{loan['id']}", json={"amount": 150})
    data = response.json()
    assert data["amount_repaid"] == 150
    assert data["status"] == LoanStatus.approved.value

    # Full repayment
    response = client.post(f"/repay/{loan['id']}", json={"amount": 250})
    data = response.json()
    assert data["amount_repaid"] == 400
    assert data["status"] == LoanStatus.repaid.value

def test_overpayment_raises(client):
    user = client.post("/users", json={"name": "Ben", "email": "ben@test.com"}).json()
    client.post("/assets", json={"user_id": user["id"], "type": "property", "value": 1000})
    loan = client.post("/borrow", json={"user_id": user["id"], "amount": 400}).json()

    res = client.post(f"/repay/{loan['id']}", json={"amount": 500})
    assert res.status_code == 400
    assert "Repayment exceeds remaining debt" in res.json()["detail"]
