# Service Layer
# ----------------
# Handles business logic:
# - Validations
# - Rules (loan max amount, positive values)
# - Calculations (positions)
# Controller calls this layer. Repository handles DB ops.

from sqlalchemy.orm import Session
from .models import User, Asset, Loan
from .schemas import UserCreate, AssetCreate, PositionResponse
from .repository import add_user, add_asset, get_loan, add_loan, get_user, get_user_by_email, list_assets, list_loans
from .rules import ALLOWED_ASSET_TYPES, ASSET_DEFAULT_RATES, LoanStatus
from typing import Dict
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ----------------
# Custom Exceptions
# ----------------
class NotFoundError(Exception):
    """Raised when a requested resource (user, asset) is not found."""
    pass

# ----------------
# User Services
# ----------------
def create_user_service(db: Session, user_data: UserCreate) -> User:
    """
    Create a new user. Raises IntegrityError if email already exists.
    Optionally hashes a password if provided.
    """
    password_hash = None
    if hasattr(user_data, 'password') and user_data.password:
        password_hash = pwd_context.hash(user_data.password)
    user = User(name=user_data.name, email=user_data.email, password_hash=password_hash)
    return add_user(db, user)

def authenticate_user(db: Session, email: str, password: str) -> User:
    """
    Authenticate a user by email and password.
    Raises NotFoundError if user not found or password is incorrect.
    """
    user = get_user_by_email(db, email)
    if not user:
        raise NotFoundError("Invalid email or password")
    if not user.password_hash:
        raise NotFoundError("Invalid email or password")
    if not pwd_context.verify(password, user.password_hash):
        raise NotFoundError("Invalid email or password")
    return user

# ----------------
# Asset Services
# ----------------
def create_asset_service(db: Session, asset_data: AssetCreate) -> Asset:
    """
    Validate and create a new asset.

    Business Rules:
    - User must exist
    - Asset value must be positive
    - Asset type must be one of the allowed predefined types
    - Asset type input is normalized (case-insensitive)
    """

    # ----------------------------
    # Validate user exists
    # ----------------------------
    user = get_user(db, asset_data.user_id)
    if not user:
        raise NotFoundError("User not found")

    # ----------------------------
    # Validate asset value
    # ----------------------------
    if asset_data.value <= 0:
        raise ValueError("Asset value must be positive")

    # ----------------------------
    # Normalize + validate asset type
    # ----------------------------
    asset_type = asset_data.type.strip().lower()

    if asset_type not in ALLOWED_ASSET_TYPES:
        raise ValueError(
            f"Invalid asset type '{asset_data.type}'. "
            f"Allowed types: {ALLOWED_ASSET_TYPES}"
        )

    # ----------------------------
    # Create asset
    # ----------------------------
    asset = Asset(
        user_id=asset_data.user_id,
        type=asset_type,
        value=asset_data.value
    )

    return add_asset(db, asset)

# ----------------
# Loan Services
# ----------------
def calculate_max_borrow(db: Session, user_id: str) -> float:
    """Calculate max loan amount based on user's assets (50% of total)."""
    assets = list_assets(db, user_id)
    if assets is None:
        raise NotFoundError("User not found")
    return sum(a.value for a in assets) * 0.5

def calculate_outstanding_debt(db: Session, user_id: str) -> float:
    """
    Total borrowed amount that is still outstanding.
    Considers partial repayments using amount_repaid.
    """
    loans = list_loans(db, user_id)

    return sum(
        max(loan.amount - loan.amount_repaid, 0.0)  # remaining debt per loan
        for loan in loans
        if loan.status != LoanStatus.repaid.value or loan.amount_repaid < loan.amount
    )

def calculate_available_credit(db: Session, user_id: str) -> float:
    """
    Remaining credit:

    available_credit =
        max_borrow - outstanding_debt
    """
    max_borrow = calculate_max_borrow(db, user_id)
    debt = calculate_outstanding_debt(db, user_id)

    return max_borrow - debt


def create_loan(db: Session, user_id: str, amount: float) -> Loan:
    """
    Validate and create a new loan.

    Business Rules:
    - User must exist
    - Loan amount must be positive
    - User cannot borrow more than remaining available credit

    Available credit is defined as:

        available_credit =
            (50% of total assets) - outstanding debt
    """

    # ----------------------------
    # Validate user exists
    # ----------------------------
    user = get_user(db, user_id)
    if not user:
        raise NotFoundError("User not found")

    # ----------------------------
    # Validate loan amount
    # ----------------------------
    if amount <= 0:
        raise ValueError("Loan amount must be positive")

    # ----------------------------
    # Compute remaining credit
    # ----------------------------
    available_credit = calculate_available_credit(db, user_id)

    if available_credit <= 0:
        raise ValueError("User has no available credit remaining")

    # ----------------------------
    # Enforce borrowing rule
    # ----------------------------
    if amount > available_credit:
        raise ValueError(
            f"Loan exceeds remaining available credit. "
            f"Available: {available_credit}, Requested: {amount}"
        )

    # ----------------------------
    # Create loan with defaults
    # ----------------------------
    loan = Loan(
        user_id=user_id,
        amount=amount,
        interest_rate=0.05,
        status = LoanStatus.approved.value
    )

    return add_loan(db, loan)

def repay_loan(db: Session, loan_id: str, amount: float) -> Loan:
    """
    Repay a loan partially or fully.

    Business rules:
    - Loan must exist
    - Amount must be positive
    - Cannot repay more than remaining debt
    - Update status to 'repaid' if fully repaid
    """

    # Validate loan exists
    loan = get_loan(db, loan_id)
    if not loan:
        raise NotFoundError("Loan not found")

    # ----------------------------
    # Validate repayment amount
    # ----------------------------
    if amount <= 0:
        raise ValueError("Repayment amount must be positive")

    remaining_debt = max(loan.amount - loan.amount_repaid, 0.0)

    if amount > remaining_debt:
        raise ValueError(
            f"Repayment exceeds remaining debt. Remaining debt: {remaining_debt}, attempted repayment: {amount}"
        )

    # ----------------------------
    # Update amount_repaid
    # ----------------------------
    loan.amount_repaid += amount

    # ----------------------------
    # Update status if fully repaid
    # ----------------------------
    if loan.amount_repaid >= loan.amount:
        loan.status = LoanStatus.repaid.value

    db.add(loan)
    db.commit()
    db.refresh(loan)

    return loan


def repay_loans_batch(db: Session, repayments: list[Dict[str, float]]) -> list[Loan]:
    """
    Repay multiple loans in a single transaction.

    Parameters:
    - repayments: List of dicts: [{"loan_id": str, "amount": float}, ...]

    Returns:
    - List of updated Loan objects
    """
    updated_loans = []

    for repayment in repayments:
        loan_id = repayment.get("loan_id")
        amount = repayment.get("amount", 0.0)

        # Call existing repay_loan service for each
        updated_loan = repay_loan(db, loan_id, amount)
        updated_loans.append(updated_loan)

    return updated_loans

# ----------------
# Position / Dashboard Service
# ----------------
def calculate_position(db: Session, user_id: str) -> PositionResponse:
    """
    Calculate a user's financial position dashboard.

    This includes:
    - Total deposited assets
    - Total borrowed (outstanding debt, accounts for partial repayments)
    - Available credit
    - Yield earned minus interest on outstanding loans
    """

    # ----------------------------
    # Validate user exists
    # ----------------------------
    user = get_user(db, user_id)
    if not user:
        raise NotFoundError("User not found")

    # ----------------------------
    # Load user assets
    # ----------------------------
    assets = list_assets(db, user_id)
    total_deposited = sum(a.value for a in assets)

    # ----------------------------
    # Load user loans
    # ----------------------------
    loans = list_loans(db, user_id)

    # Remaining debt per loan
    total_borrowed = sum(
        max(loan.amount - loan.amount_repaid, 0.0) for loan in loans
    )

    available_credit = calculate_available_credit(db, user_id)

    # ----------------------------
    # Yield earned (from assets)
    # ----------------------------
    # Let's assume 5% annual yield per asset for simplicity
    yield_rate = 0.05
    yield_earned = total_deposited * yield_rate

    # ----------------------------
    # Interest owed on outstanding loans
    # ----------------------------
    interest_owed = sum(
        max(loan.amount - loan.amount_repaid, 0.0) * loan.interest_rate
        for loan in loans
    )

    # ----------------------------
    # Net yield (optional: can just show gross yield)
    # ----------------------------
    net_yield = yield_earned - interest_owed

    # ----------------------------
    # Return dashboard response
    # ----------------------------
    return PositionResponse(
        user_id=user_id,
        total_deposited=total_deposited,
        total_borrowed=total_borrowed,
        available_credit=available_credit,
        yield_earned=net_yield
    )


