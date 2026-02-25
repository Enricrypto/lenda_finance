"""
Risk Engine — pure calculation layer, no DB calls.

Inputs are already-resolved numbers (totals), not ORM objects.
This keeps the engine fully testable without a database.
"""
from dataclasses import dataclass
from typing import Optional
from .rules import HEALTH_FACTOR_MIN, MAX_LTV


@dataclass
class EvaluationResult:
    approved: bool
    requested_amount: float
    projected_ltv: float
    health_factor: float
    total_eligible_collateral: float
    outstanding_debt: float
    max_additional_borrow: float
    rejection_reason: Optional[str] = None


def calculate_health_factor(
    total_eligible_collateral: float,
    total_outstanding_debt: float,
) -> float:
    """
    health_factor = eligible_collateral / outstanding_debt
    > 1.0 → solvent
    < 1.0 → under-collateralised (liquidation territory)
    """
    if total_outstanding_debt <= 0:
        return float("inf")
    return total_eligible_collateral / total_outstanding_debt


def calculate_ltv(
    outstanding_debt: float,
    eligible_collateral: float,
) -> float:
    if eligible_collateral <= 0:
        return float("inf")
    return outstanding_debt / eligible_collateral


def evaluate_loan_eligibility(
    requested_amount: float,
    total_eligible_collateral: float,
    total_outstanding_debt: float,
) -> EvaluationResult:
    """
    Decide whether a loan of `requested_amount` should be approved.

    Rules:
    - eligible_collateral must be > 0
    - projected LTV (debt after loan / eligible_collateral) must be ≤ MAX_LTV (100%)
    - projected health_factor must be ≥ HEALTH_FACTOR_MIN (1.0)
    """
    max_additional = max(total_eligible_collateral - total_outstanding_debt, 0.0)

    # No collateral at all
    if total_eligible_collateral <= 0:
        return EvaluationResult(
            approved=False,
            requested_amount=requested_amount,
            projected_ltv=float("inf"),
            health_factor=0.0,
            total_eligible_collateral=0.0,
            outstanding_debt=total_outstanding_debt,
            max_additional_borrow=0.0,
            rejection_reason="No eligible collateral. Deposit assets first.",
        )

    projected_debt = total_outstanding_debt + requested_amount
    projected_ltv  = calculate_ltv(projected_debt, total_eligible_collateral)
    health_factor  = calculate_health_factor(total_eligible_collateral, projected_debt)

    if projected_ltv > MAX_LTV:
        return EvaluationResult(
            approved=False,
            requested_amount=requested_amount,
            projected_ltv=projected_ltv,
            health_factor=health_factor,
            total_eligible_collateral=total_eligible_collateral,
            outstanding_debt=total_outstanding_debt,
            max_additional_borrow=max_additional,
            rejection_reason=(
                f"Loan exceeds eligible collateral. "
                f"Maximum additional borrow: ${max_additional:,.2f}"
            ),
        )

    if health_factor < HEALTH_FACTOR_MIN:
        return EvaluationResult(
            approved=False,
            requested_amount=requested_amount,
            projected_ltv=projected_ltv,
            health_factor=health_factor,
            total_eligible_collateral=total_eligible_collateral,
            outstanding_debt=total_outstanding_debt,
            max_additional_borrow=max_additional,
            rejection_reason="Health factor would fall below minimum. Reduce amount or add collateral.",
        )

    return EvaluationResult(
        approved=True,
        requested_amount=requested_amount,
        projected_ltv=projected_ltv,
        health_factor=health_factor,
        total_eligible_collateral=total_eligible_collateral,
        outstanding_debt=total_outstanding_debt,
        max_additional_borrow=max_additional,
    )
