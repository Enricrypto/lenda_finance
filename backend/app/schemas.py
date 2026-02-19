from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ----------------
# Input Schemas
# ----------------
class UserCreate(BaseModel):
    name: str = Field(..., example="Alice")
    email: str = Field(..., example="alice@example.com")
    password: Optional[str] = Field(None, example="securepass123")

class AssetCreate(BaseModel):
    user_id: str
    type: str
    value: float

class LoanRequest(BaseModel):
    user_id: str
    amount: float

class RepayRequest(BaseModel):
    amount: float = Field(..., gt=0, description="Amount to repay, must be positive")

class LoanRepaymentRequest(BaseModel):
    loan_id: str
    amount: float = Field(..., gt=0, description="Amount to repay, must be positive")

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    id: str
    name: str
    email: str

# ----------------
# Output Schemas
# ----------------
class UserRead(BaseModel):
    id: str
    name: str
    email: str

    class Config:
        orm_mode = True  # allows SQLAlchemy ORM objects to be returned directly

class AssetRead(BaseModel):
    id: str
    user_id: str
    type: str
    value: float
    created_at: datetime

    class Config:
        orm_mode = True

class LoanRead(BaseModel):
    id: str
    user_id: str
    amount: float
    amount_repaid: float
    interest_rate: float
    status: str
    created_at: datetime

    class Config:
        orm_mode = True

class PositionResponse(BaseModel):
    user_id: str
    total_deposited: float
    total_borrowed: float
    available_credit: float
    yield_earned: float
