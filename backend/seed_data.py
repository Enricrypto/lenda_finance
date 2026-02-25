"""
Seed script — populates the database with demo data for Lenda Finance.

Run from backend/ directory:
    python seed_data.py

Uses the refactored service layer:
  - register_user() for user creation (with password hashing)
  - create_asset() for collateral (runs valuation engine)
  - create_loan() for loans (runs risk engine, sets ACTIVE or REJECTED)
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.auth_service import register_user
from app.service import create_asset, create_loan

db: Session = SessionLocal()

# ──────────────────────────────────────
# Demo user (primary showcase account)
# ──────────────────────────────────────
DEMO_EMAIL    = "demo@lenda.com"
DEMO_PASSWORD = "password123"

print("Creating demo user...")
try:
    demo = register_user(db, name="Demo User", email=DEMO_EMAIL, password=DEMO_PASSWORD)
    print(f"  + {demo.name} ({demo.email})")
except Exception as e:
    print(f"  ! Skipped demo user: {e}")
    db.rollback()
    # Try to look up existing user so seed can continue
    from app.repository import get_user_by_email
    demo = get_user_by_email(db, DEMO_EMAIL)
    if not demo:
        print("Cannot seed without demo user. Exiting.")
        db.close()
        exit(1)

# ──────────────────────────────────────
# Additional users (supporting cast)
# ──────────────────────────────────────
extra_users_data = [
    ("Alice Johnson", "alice@lenda.com"),
    ("Bob Martinez",  "bob@lenda.com"),
    ("Carol Chen",    "carol@lenda.com"),
]

print("\nCreating supporting users...")
extra_users = []
for name, email in extra_users_data:
    try:
        u = register_user(db, name=name, email=email, password="password123")
        extra_users.append(u)
        print(f"  + {u.name} ({u.email})")
    except Exception as e:
        print(f"  ! Skipped {email}: {e}")
        db.rollback()

alice = extra_users[0] if len(extra_users) > 0 else None
bob   = extra_users[1] if len(extra_users) > 1 else None
carol = extra_users[2] if len(extra_users) > 2 else None

# ──────────────────────────────────────
# Assets  (valuation engine runs per asset)
# ──────────────────────────────────────
# LTV ratios: property=70%, crypto=50%, car=60%
# Demo portfolio:
#   Property $400k → $280k eligible
#   Crypto   $75k  → $37.5k eligible
#   Car      $30k  → $18k eligible
#   Total eligible = $335.5k → can borrow up to $335.5k

print("\nCreating assets...")

demo_assets = [
    ("property", 400_000, "Primary residence"),
    ("crypto",    75_000, "BTC/ETH holdings"),
    ("car",       30_000, "Tesla Model 3"),
]
for asset_type, value, description in demo_assets:
    try:
        a = create_asset(db, demo.id, asset_type, value, description)
        print(f"  + [{demo.email}] {a.type} ${a.stated_value:,.0f} → collateral ${a.appraised_value:,.0f}")
    except Exception as e:
        print(f"  ! Skipped asset: {e}")
        db.rollback()

if alice:
    for asset_type, value, description in [
        ("property", 350_000, "Rental property"),
        ("crypto",    45_000, "ETH holdings"),
    ]:
        try:
            a = create_asset(db, alice.id, asset_type, value, description)
            print(f"  + [{alice.email}] {a.type} ${a.stated_value:,.0f} → collateral ${a.appraised_value:,.0f}")
        except Exception as e:
            print(f"  ! Skipped asset: {e}")
            db.rollback()

if bob:
    for asset_type, value, description in [
        ("crypto", 180_000, "BTC holdings"),
        ("car",     42_000, "BMW 5 Series"),
    ]:
        try:
            a = create_asset(db, bob.id, asset_type, value, description)
            print(f"  + [{bob.email}] {a.type} ${a.stated_value:,.0f} → collateral ${a.appraised_value:,.0f}")
        except Exception as e:
            print(f"  ! Skipped asset: {e}")
            db.rollback()

if carol:
    for asset_type, value, description in [
        ("property", 500_000, "Commercial property"),
    ]:
        try:
            a = create_asset(db, carol.id, asset_type, value, description)
            print(f"  + [{carol.email}] {a.type} ${a.stated_value:,.0f} → collateral ${a.appraised_value:,.0f}")
        except Exception as e:
            print(f"  ! Skipped asset: {e}")
            db.rollback()

# ──────────────────────────────────────
# Loans  (risk engine approves/rejects)
# ──────────────────────────────────────
# Demo user eligible collateral ≈ $335.5k
# We request $200k (well within limit → ACTIVE)
# Then request $200k more (over remaining capacity → REJECTED — shows the rejection flow)

print("\nCreating loans...")

demo_loans = [
    200_000,   # Approved: $200k < $335.5k eligible
    200_000,   # Rejected: total $400k > $335.5k eligible
]
for amount in demo_loans:
    try:
        loan = create_loan(db, demo.id, amount)
        print(f"  + [{demo.email}] ${amount:,.0f} → {loan.status}")
    except Exception as e:
        print(f"  ! Skipped loan ${amount:,.0f}: {e}")
        db.rollback()

if alice:
    try:
        # Alice: eligible ≈ $245k+$22.5k = $267.5k; borrow $150k → approved
        loan = create_loan(db, alice.id, 150_000)
        print(f"  + [{alice.email}] $150,000 → {loan.status}")
    except Exception as e:
        print(f"  ! Skipped alice loan: {e}")
        db.rollback()

if bob:
    try:
        # Bob: eligible ≈ $90k+$25.2k = $115.2k; borrow $80k → approved
        loan = create_loan(db, bob.id, 80_000)
        print(f"  + [{bob.email}] $80,000 → {loan.status}")
    except Exception as e:
        print(f"  ! Skipped bob loan: {e}")
        db.rollback()

print("\nSeed complete. Demo credentials: demo@lenda.com / password123")
db.close()
