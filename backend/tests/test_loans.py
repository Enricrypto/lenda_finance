from app.rules import LoanStatus

def test_request_loan(client):
    user = client.post("/users", json={"name": "Dave", "email": "dave@example.com"}).json()
    client.post("/assets", json={"user_id": user["id"], "type": "property", "value": 10000})
    response = client.post("/borrow", json={"user_id": user["id"], "amount": 4000})
    data = response.json()
    assert response.status_code == 200
    assert "id" in data
    assert data["amount"] == 4000
    assert data["amount_repaid"] == 0  
    assert data["status"] == LoanStatus.approved.value

def test_request_loan_exceeds_max(client):
    user = client.post("/users", json={"name": "Eve", "email": "eve@example.com"}).json()
    client.post("/assets", json={"user_id": user["id"], "type": "property", "value": 5000})
    response = client.post("/borrow", json={"user_id": user["id"], "amount": 5000})
    assert response.status_code == 400
    assert "Loan exceeds remaining available credit" in response.json()["detail"]
