import pytest

def test_create_user(client):
    response = client.post("/users", json={"name": "Alice", "email": "alice@example.com"})
    data = response.json()
    assert response.status_code == 200
    assert "id" in data
    assert data["name"] == "Alice"

def test_create_duplicate_user(client):
    client.post("/users", json={"name": "Bob", "email": "bob@example.com"})
    response = client.post("/users", json={"name": "Bob2", "email": "bob@example.com"})
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_list_users(client):
    client.post("/users", json={"name": "Carol", "email": "carol@example.com"})
    response = client.get("/users")
    data = response.json()
    assert response.status_code == 200
    assert isinstance(data, list)
    assert len(data) >= 1
