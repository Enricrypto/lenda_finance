from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime


# ─────────────────────────────────────
# Auth
# ─────────────────────────────────────
class RegisterRequest(BaseModel):
    name: str     = Field(..., min_length=1)
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    id: str
    name: str
    email: str
    access_token: str
    token_type: str = "bearer"


# ─────────────────────────────────────
# Users
# ─────────────────────────────────────
class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    email: str


# ─────────────────────────────────────
# Assets
# ─────────────────────────────────────
class AssetCreate(BaseModel):
    type: str         = Field(..., description="property | crypto | car")
    stated_value: float = Field(..., gt=0, description="User-provided market value")
    description: Optional[str] = None


class AssetPreviewResponse(BaseModel):
    asset_type: str
    stated_value: float
    ltv_ratio: float
    appraised_value: float
    risk_tier: str


class AssetRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    type: str
    description: Optional[str]
    stated_value: float
    appraised_value: float
    ltv_ratio: float
    status: str
    created_at: datetime


# ─────────────────────────────────────
# Loans
# ─────────────────────────────────────
class LoanRequest(BaseModel):
    amount: float = Field(..., gt=0)


class LoanEvaluationResponse(BaseModel):
    approved: bool
    requested_amount: float
    projected_ltv: float
    health_factor: float
    total_eligible_collateral: float
    outstanding_debt: float
    max_additional_borrow: float
    rejection_reason: Optional[str] = None


class RepayRequest(BaseModel):
    amount: float = Field(..., gt=0)


class LoanRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: str
    amount: float
    amount_repaid: float
    accrued_interest: float
    interest_rate: float
    status: str
    ltv_at_origination: Optional[float]
    health_factor_snapshot: Optional[float]
    rejection_reason: Optional[str]
    created_at: datetime
    activated_at: Optional[datetime]
    repaid_at: Optional[datetime]


# ─────────────────────────────────────
# Position
# ─────────────────────────────────────
class PositionResponse(BaseModel):
    user_id: str
    total_deposited: float           # sum of stated_values
    total_eligible_collateral: float # sum of appraised_values
    total_borrowed: float            # principal outstanding
    total_interest: float            # accrued interest outstanding
    available_credit: float          # eligible_collateral - borrowed - interest
    yield_earned: float              # net yield
    health_factor: Optional[float]   # None when no debt
    ltv: Optional[float]             # None when no debt
