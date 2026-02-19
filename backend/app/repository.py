# Repository Layer
# ----------------
# Handles all database CRUD operations.
# No business logic or validations here — that’s for service.py

from sqlalchemy.orm import Session
from .models import User, Asset, Loan

# ----------------
# Users
# ----------------
def add_user(db: Session, user: User) -> User:
    """
    Add a new user to the database.
    Returns the created user object.
    """
    db.add(user)
    db.commit()
    db.refresh(user)  # refresh to get `id`
    return user

def get_user(db: Session, user_id: str) -> User | None:
    """Return a user by ID or None if not found."""
    return db.query(User).filter(User.id == user_id).first()

def list_users(db: Session) -> list[User]:
    """Return all users."""
    return db.query(User).all()

def get_user_by_email(db: Session, email: str) -> User | None:
    """Return a user by email or None if not found."""
    return db.query(User).filter(User.email == email).first()


# ----------------
# Assets
# ----------------
def add_asset(db: Session, asset: Asset) -> Asset:
    """
    Add an asset to the database.
    Returns the created asset object.
    """
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset

def list_assets(db: Session, user_id: str | None = None) -> list[Asset]:
    """
    Return all assets, or if user_id is provided, return assets for that user.
    """
    query = db.query(Asset)
    if user_id:
        query = query.filter(Asset.user_id == user_id)
    return query.all()


# ----------------
# Loans
# ----------------
def add_loan(db: Session, loan: Loan) -> Loan:
    """
    Add a loan to the database.
    Returns the created loan object.
    """
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan

def list_loans(db: Session, user_id: str | None = None) -> list[Loan]:
    """
    Return all loans, or if user_id is provided, return loans for that user.
    """
    query = db.query(Loan)
    if user_id:
        query = query.filter(Loan.user_id == user_id)
    return query.all()

def get_loan(db: Session, loan_id: str) -> Loan | None:
    """
    Return a single loan by ID, or None if not found.
    """
    return db.query(Loan).filter(Loan.id == loan_id).first()