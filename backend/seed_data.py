"""
Seed script — populates the database with realistic demo data.
Run from backend/: python seed_data.py
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.schemas import UserCreate, AssetCreate
from app.service import create_user_service, create_asset_service, create_loan
from app.rules import LoanStatus

db: Session = SessionLocal()

# ──────────────────────────────────────
# Users (all password: "password123")
# ──────────────────────────────────────
users_data = [
    UserCreate(name="Alice Johnson", email="alice@lenda.com", password="password123"),
    UserCreate(name="Bob Martinez", email="bob@lenda.com", password="password123"),
    UserCreate(name="Carol Chen", email="carol@lenda.com", password="password123"),
    UserCreate(name="David Kim", email="david@lenda.com", password="password123"),
    UserCreate(name="Elena Rossi", email="elena@lenda.com", password="password123"),
    UserCreate(name="Demo User", email="demo@lenda.com", password="password123"),
]

print("Creating users...")
users = []
for u in users_data:
    try:
        user = create_user_service(db, u)
        users.append(user)
        print(f"  + {user.name} ({user.email})")
    except Exception as e:
        print(f"  ! Skipped {u.email}: {e}")
        db.rollback()

if len(users) < 2:
    print("Not enough users created. Exiting.")
    db.close()
    exit(1)

alice, bob, carol, david, elena, demo = (
    users[0] if len(users) > 0 else None,
    users[1] if len(users) > 1 else None,
    users[2] if len(users) > 2 else None,
    users[3] if len(users) > 3 else None,
    users[4] if len(users) > 4 else None,
    users[5] if len(users) > 5 else None,
)

# ──────────────────────────────────────
# Assets
# ──────────────────────────────────────
assets_data = [
    # Alice — property investor
    AssetCreate(user_id=alice.id, type="property", value=350000),
    AssetCreate(user_id=alice.id, type="property", value=220000),
    AssetCreate(user_id=alice.id, type="crypto", value=45000),

    # Bob — crypto-heavy
    AssetCreate(user_id=bob.id, type="crypto", value=180000),
    AssetCreate(user_id=bob.id, type="crypto", value=95000),
    AssetCreate(user_id=bob.id, type="car", value=42000),

    # Carol — diversified
    AssetCreate(user_id=carol.id, type="property", value=500000),
    AssetCreate(user_id=carol.id, type="crypto", value=60000),
    AssetCreate(user_id=carol.id, type="car", value=35000),

    # David — car collector
    AssetCreate(user_id=david.id, type="car", value=85000),
    AssetCreate(user_id=david.id, type="car", value=62000),
    AssetCreate(user_id=david.id, type="property", value=180000),

    # Elena — modest portfolio
    AssetCreate(user_id=elena.id, type="property", value=275000),
    AssetCreate(user_id=elena.id, type="crypto", value=15000),

    # Demo — balanced
    AssetCreate(user_id=demo.id, type="property", value=400000),
    AssetCreate(user_id=demo.id, type="crypto", value=75000),
    AssetCreate(user_id=demo.id, type="car", value=30000),
]

print("\nCreating assets...")
for a in assets_data:
    try:
        asset = create_asset_service(db, a)
        print(f"  + {asset.type} ${asset.value:,.0f} for user {a.user_id[:8]}...")
    except Exception as e:
        print(f"  ! Skipped asset: {e}")
        db.rollback()

# ──────────────────────────────────────
# Loans (go through service to respect credit limits)
# ──────────────────────────────────────
loans_data = [
    # Alice borrows against her ~$615k in assets (max borrow = $307.5k)
    (alice.id, 120000),
    (alice.id, 50000),

    # Bob borrows against ~$317k (max = $158.5k)
    (bob.id, 80000),
    (bob.id, 45000),

    # Carol borrows against ~$595k (max = $297.5k)
    (carol.id, 150000),

    # David borrows against ~$327k (max = $163.5k)
    (david.id, 70000),

    # Elena borrows against ~$290k (max = $145k)
    (elena.id, 60000),
    (elena.id, 30000),

    # Demo borrows against ~$505k (max = $252.5k)
    (demo.id, 100000),
    (demo.id, 50000),
]

print("\nCreating loans...")
for user_id, amount in loans_data:
    try:
        loan = create_loan(db, user_id, amount)
        print(f"  + ${amount:,.0f} loan for user {user_id[:8]}... (status: {loan.status})")
    except Exception as e:
        print(f"  ! Skipped loan ${amount:,.0f}: {e}")
        db.rollback()

print("\nSeed data inserted successfully!")
db.close()
