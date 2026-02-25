"""
Service Layer — orchestrates business logic for assets, loans, and positions.
Auth logic lives in auth_service.py.
"""
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session

from .models import Asset, Loan
from .schemas import PositionResponse
from .repository import (
    add_asset, add_loan, get_loan,
    list_assets, list_loans,
)
from .rules import LoanStatus, AssetStatus
from .valuation_service import appraise
from .risk_engine import (
    evaluate_loan_eligibility,
    calculate_health_factor,
    calculate_ltv,
    EvaluationResult,
)


# ────────────────────────────────────────
# Custom Exceptions
# ────────────────────────────────────────
class NotFoundError(Exception):
    pass


class ForbiddenError(Exception):
    pass


# ────────────────────────────────────────
# Asset Services
# ────────────────────────────────────────
def preview_asset(asset_type: str, stated_value: float):
    """Valuation dry-run — no DB write."""
    return appraise(asset_type, stated_value)


def create_asset(
    db: Session,
    user_id: str,
    asset_type: str,
    stated_value: float,
    description: Optional[str] = None,
) -> Asset:
    # user_id is already validated by get_current_user dependency
    valuation = appraise(asset_type, stated_value)

    asset = Asset(
        user_id=user_id,
        type=valuation.asset_type,
        description=description,
        stated_value=stated_value,
        appraised_value=valuation.appraised_value,
        ltv_ratio=valuation.ltv_ratio,
        status=AssetStatus.active.value,
        appraised_at=datetime.now(timezone.utc),
    )
    return add_asset(db, asset)


def get_user_assets(db: Session, user_id: str) -> list[Asset]:
    return list_assets(db, user_id)


# ────────────────────────────────────────
# Helpers — collateral and debt totals
# ────────────────────────────────────────
def _total_eligible_collateral(db: Session, user_id: str) -> float:
    """Sum of appraised_value for ACTIVE and LOCKED assets."""
    assets = list_assets(db, user_id)
    return sum(
        a.appraised_value for a in assets
        if a.status in (AssetStatus.active.value, AssetStatus.locked.value)
    )


def _total_outstanding_debt(db: Session, user_id: str) -> float:
    """Principal + accrued interest still owed on active loans."""
    loans = list_loans(db, user_id)
    return sum(
        max((l.amount or 0.0) - (l.amount_repaid or 0.0), 0.0) + (l.accrued_interest or 0.0)
        for l in loans
        if l.status == LoanStatus.active.value
    )


def _compute_accrued_interest(loan: Loan) -> float:
    """
    Simple interest since activation: principal × rate × (days / 365).
    Returns 0 if loan has no activated_at timestamp.
    """
    if not loan.activated_at:
        return 0.0
    reference = loan.activated_at
    if reference.tzinfo is None:
        reference = reference.replace(tzinfo=timezone.utc)
    days = (datetime.now(timezone.utc) - reference).days
    principal_remaining = max((loan.amount or 0.0) - (loan.amount_repaid or 0.0), 0.0)
    return principal_remaining * (loan.interest_rate or 0.05) * (days / 365.0)


# ────────────────────────────────────────
# Loan Services
# ────────────────────────────────────────
def evaluate_loan(db: Session, user_id: str, amount: float) -> EvaluationResult:
    """Risk assessment dry-run — no DB write."""
    eligible = _total_eligible_collateral(db, user_id)
    debt     = _total_outstanding_debt(db, user_id)
    return evaluate_loan_eligibility(amount, eligible, debt)


def create_loan(db: Session, user_id: str, amount: float) -> Loan:
    # user_id is already validated by get_current_user dependency
    eligible = _total_eligible_collateral(db, user_id)
    debt     = _total_outstanding_debt(db, user_id)
    result   = evaluate_loan_eligibility(amount, eligible, debt)

    now = datetime.now(timezone.utc)

    if result.approved:
        loan = Loan(
            user_id=user_id,
            amount=amount,
            interest_rate=0.05,
            status=LoanStatus.active.value,
            ltv_at_origination=result.projected_ltv,
            health_factor_snapshot=result.health_factor,
            collateral_value_locked=eligible,
            activated_at=now,
        )
    else:
        loan = Loan(
            user_id=user_id,
            amount=amount,
            interest_rate=0.05,
            status=LoanStatus.rejected.value,
            rejection_reason=result.rejection_reason,
            ltv_at_origination=result.projected_ltv if result.projected_ltv != float("inf") else None,
            health_factor_snapshot=result.health_factor if result.health_factor != float("inf") else None,
            collateral_value_locked=eligible,
        )

    return add_loan(db, loan)


def repay_loan(db: Session, loan_id: str, user_id: str, amount: float) -> Loan:
    loan = get_loan(db, loan_id)
    if not loan:
        raise NotFoundError("Loan not found")
    if loan.user_id != user_id:
        raise ForbiddenError("Not your loan")
    if loan.status != LoanStatus.active.value:
        raise ValueError("Only active loans can be repaid")
    if amount <= 0:
        raise ValueError("Repayment amount must be positive")

    # Refresh accrued interest before repayment
    loan.accrued_interest = _compute_accrued_interest(loan)

    # Waterfall: interest first, then principal
    if amount <= loan.accrued_interest:
        loan.accrued_interest -= amount
    else:
        remaining = amount - loan.accrued_interest
        loan.accrued_interest = 0.0
        principal_remaining = max(loan.amount - loan.amount_repaid, 0.0)
        if remaining > principal_remaining:
            raise ValueError(
                f"Overpayment. Total outstanding: "
                f"${principal_remaining + loan.accrued_interest:,.2f}"
            )
        loan.amount_repaid += remaining

    # Check full repayment
    if loan.amount_repaid >= loan.amount and loan.accrued_interest <= 0:
        loan.status = LoanStatus.repaid.value
        loan.repaid_at = datetime.now(timezone.utc)

    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


def get_user_loans(db: Session, user_id: str) -> list[Loan]:
    return list_loans(db, user_id)


# ────────────────────────────────────────
# Position / Dashboard
# ────────────────────────────────────────
def calculate_position(db: Session, user_id: str) -> PositionResponse:
    # user_id is already validated by get_current_user dependency
    assets = list_assets(db, user_id)
    loans  = list_loans(db, user_id)

    total_deposited  = sum(a.stated_value for a in assets)
    eligible         = sum(
        a.appraised_value for a in assets
        if a.status in (AssetStatus.active.value, AssetStatus.locked.value)
    )

    active_loans = [l for l in loans if l.status == LoanStatus.active.value]
    total_principal  = sum(max(l.amount - l.amount_repaid, 0.0) for l in active_loans)
    total_interest   = sum(_compute_accrued_interest(l) for l in active_loans)
    total_debt       = total_principal + total_interest
    available_credit = max(eligible - total_debt, 0.0)

    yield_rate   = 0.05
    gross_yield  = total_deposited * yield_rate
    net_yield    = gross_yield - total_interest

    health_factor = (
        calculate_health_factor(eligible, total_debt)
        if total_debt > 0 else None
    )
    ltv = (
        calculate_ltv(total_debt, eligible)
        if eligible > 0 and total_debt > 0 else None
    )

    return PositionResponse(
        user_id=user_id,
        total_deposited=total_deposited,
        total_eligible_collateral=eligible,
        total_borrowed=total_principal,
        total_interest=total_interest,
        available_credit=available_credit,
        yield_earned=net_yield,
        health_factor=health_factor,
        ltv=ltv,
    )
