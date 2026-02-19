from app.rules import ALLOWED_ASSET_TYPES, LoanStatus
from app.database import get_db
from app.service import calculate_outstanding_debt, calculate_available_credit, calculate_max_borrow

# -------------------------------
# Asset Validation Tests
# -------------------------------
def test_invalid_asset_type(client):
    user = client.post("/users", json={"name": "Alice", "email": "alice_p2@test.com"}).json()

    invalid_type = "gold"
    assert invalid_type not in ALLOWED_ASSET_TYPES

    res = client.post(
        "/assets",
        json={"user_id": user["id"], "type": invalid_type, "value": 1000}
    )
    assert res.status_code == 400
    assert "Invalid asset type" in res.json()["detail"]


def test_negative_asset_value(client):
    user = client.post("/users", json={"name": "Bob", "email": "bob_p2@test.com"}).json()

    res = client.post(
        "/assets",
        json={"user_id": user["id"], "type": "property", "value": -500}
    )
    assert res.status_code == 400
    assert "Asset value must be positive" in res.json()["detail"]


# -------------------------------
# Loan Validation Tests
# -------------------------------
def test_loan_exceeds_available_credit(client):
    user = client.post("/users", json={"name": "Carol", "email": "carol_p2@test.com"}).json()

    # Add an asset worth 500 -> max borrow = 250
    client.post(
        "/assets",
        json={"user_id": user["id"], "type": "crypto", "value": 500}
    )

    # Attempt to borrow 400 > 250 available credit
    res = client.post("/borrow", json={"user_id": user["id"], "amount": 400})
    assert res.status_code == 400
    assert "Loan exceeds remaining available credit" in res.json()["detail"]

    # Confirm outstanding debt logic using service functions
    db = next(client.app.dependency_overrides[get_db]())
    debt = calculate_outstanding_debt(db, user["id"])
    max_borrow = calculate_max_borrow(db, user["id"])
    available_credit = calculate_available_credit(db, user["id"])

    # No approved loans yet, so debt should be 0 and available_credit == max_borrow
    assert debt == 0
    assert available_credit == max_borrow
    db.close()


def test_successful_loan_sets_status(client):
    user = client.post("/users", json={"name": "Dave", "email": "dave_p2@example.com"}).json()

    # Add asset worth 1000 -> max borrow = 500
    client.post(
        "/assets",
        json={"user_id": user["id"], "type": "property", "value": 1000}
    )

    # Borrow 400 <= 500 available credit
    loan = client.post("/borrow", json={"user_id": user["id"], "amount": 400}).json()

    # Assert loan status uses LoanStatus enum
    assert loan["status"] == LoanStatus.approved.value


# -------------------------------
# End-to-End Position Test
# -------------------------------
def test_e2e_user_asset_loan_dashboard_refactored(client):
    # ----------------------------
    # Create user
    # ----------------------------
    user = client.post("/users", json={"name": "Eve", "email": "eve_phase3@test.com"}).json()
    user_id = user["id"]

    # ----------------------------
    # Add assets
    # ----------------------------
    asset1 = client.post("/assets", json={"user_id": user_id, "type": "property", "value": 2000}).json()
    asset2 = client.post("/assets", json={"user_id": user_id, "type": "crypto", "value": 1000}).json()

    # ----------------------------
    # Borrow loans
    # ----------------------------
    loan1 = client.post("/borrow", json={"user_id": user_id, "amount": 1000}).json()
    loan2 = client.post("/borrow", json={"user_id": user_id, "amount": 400}).json()

    # ----------------------------
    # Partial repayment of first loan
    # ----------------------------
    client.post(f"/repay/{loan1['id']}", json={"amount": 200})

    # ----------------------------
    # Calculate expected values using service functions
    # ----------------------------
    db = next(client.app.dependency_overrides[get_db]())
    expected_total_deposited = sum(a["value"] for a in [asset1, asset2])
    expected_total_borrowed = calculate_outstanding_debt(db, user_id)
    expected_available_credit = calculate_available_credit(db, user_id)
    db.close()

    # ----------------------------
    # Check dashboard via API
    # ----------------------------
    pos = client.get(f"/positions/{user_id}").json()

    # ----------------------------
    # Assertions
    # ----------------------------
    assert pos["total_deposited"] == expected_total_deposited
    assert pos["total_borrowed"] == expected_total_borrowed
    assert pos["available_credit"] == expected_available_credit

    # Yield is net: gross yield (5% of deposits) minus interest on outstanding debt (5% of debt)
    # total_deposited = 3000, debt = 1200 (1000+400-200)
    # net_yield = 3000*0.05 - 1200*0.05 = 150 - 60 = 90
    expected_net_yield = expected_total_deposited * 0.05 - expected_total_borrowed * 0.05
    assert pos["yield_earned"] == expected_net_yield