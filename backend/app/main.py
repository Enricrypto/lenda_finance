# Controller Layer
from fastapi import FastAPI, Depends, HTTPException, Path, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.schemas import (
    RegisterRequest, LoginRequest, LoginResponse, UserRead,
    AssetCreate, AssetRead, AssetPreviewResponse,
    LoanRequest, LoanRead, LoanEvaluationResponse,
    RepayRequest, PositionResponse,
)
from app.auth_service import register_user, authenticate_user, create_access_token
from app.service import (
    preview_asset, create_asset, get_user_assets,
    evaluate_loan, create_loan, repay_loan, get_user_loans,
    calculate_position,
    ForbiddenError,
)
from app.dependencies import get_current_user
from app.models import User
from app.config import settings

app = FastAPI(title="Lenda API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────
# Auth
# ─────────────────────────────────────
@app.post("/auth/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = register_user(db, name=body.name, email=body.email, password=body.password)
        return user
    except IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")


@app.post("/auth/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, body.email, body.password)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.id)
    return LoginResponse(
        id=user.id, name=user.name, email=user.email,
        access_token=token,
    )


@app.get("/auth/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ─────────────────────────────────────
# Assets  (all scoped to current user)
# ─────────────────────────────────────
@app.post("/assets/preview", response_model=AssetPreviewResponse)
def preview_asset_endpoint(
    body: AssetCreate,
    _: User = Depends(get_current_user),
):
    """Valuation dry-run — returns appraised_value without saving."""
    try:
        result = preview_asset(body.type, body.stated_value)
        return AssetPreviewResponse(
            asset_type=result.asset_type,
            stated_value=result.stated_value,
            ltv_ratio=result.ltv_ratio,
            appraised_value=result.appraised_value,
            risk_tier=result.risk_tier,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/assets", response_model=list[AssetRead])
def list_assets_endpoint(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_user_assets(db, current_user.id)


@app.post("/assets", response_model=AssetRead, status_code=status.HTTP_201_CREATED)
def create_asset_endpoint(
    body: AssetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return create_asset(
            db,
            user_id=current_user.id,
            asset_type=body.type,
            stated_value=body.stated_value,
            description=body.description,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─────────────────────────────────────
# Loans  (all scoped to current user)
# ─────────────────────────────────────
@app.post("/loans/evaluate", response_model=LoanEvaluationResponse)
def evaluate_loan_endpoint(
    body: LoanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Risk engine dry-run — returns approval decision without saving."""
    result = evaluate_loan(db, current_user.id, body.amount)
    return LoanEvaluationResponse(
        approved=result.approved,
        requested_amount=result.requested_amount,
        projected_ltv=result.projected_ltv if result.projected_ltv != float("inf") else 999.0,
        health_factor=result.health_factor if result.health_factor != float("inf") else 999.0,
        total_eligible_collateral=result.total_eligible_collateral,
        outstanding_debt=result.outstanding_debt,
        max_additional_borrow=result.max_additional_borrow,
        rejection_reason=result.rejection_reason,
    )


@app.get("/loans", response_model=list[LoanRead])
def list_loans_endpoint(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_user_loans(db, current_user.id)


@app.post("/loans", response_model=LoanRead, status_code=status.HTTP_201_CREATED)
def create_loan_endpoint(
    body: LoanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return create_loan(db, current_user.id, body.amount)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/loans/{loan_id}/repay", response_model=LoanRead)
def repay_loan_endpoint(
    body: RepayRequest,
    loan_id: str = Path(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        return repay_loan(db, loan_id, current_user.id, body.amount)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Loan not found")
    except ForbiddenError:
        raise HTTPException(status_code=403, detail="Not your loan")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─────────────────────────────────────
# Position
# ─────────────────────────────────────
@app.get("/position", response_model=PositionResponse)
def get_position(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return calculate_position(db, current_user.id)
