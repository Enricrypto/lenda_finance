# Controller Layer
from fastapi import FastAPI, Depends, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import (
    UserCreate, UserRead, AssetCreate, AssetRead,
    LoanRequest, LoanRead, PositionResponse,
    LoanRepaymentRequest, RepayRequest,
    LoginRequest, LoginResponse,
)
from app.service import (
    create_user_service, create_asset_service, create_loan,
    calculate_position, repay_loan, repay_loans_batch,
    authenticate_user, NotFoundError,
)
from sqlalchemy.exc import IntegrityError
from app.config import settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------
# Auth Endpoints
# -----------------
@app.post("/auth/login", response_model=LoginResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = authenticate_user(db, body.email, body.password)
        return LoginResponse(id=user.id, name=user.name, email=user.email)
    except NotFoundError:
        raise HTTPException(status_code=401, detail="Invalid email or password")

# -----------------
# User Endpoints
# -----------------
@app.post("/users", response_model=UserRead)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    try:
        new_user = create_user_service(db, user)
        return new_user
    except IntegrityError:
        raise HTTPException(status_code=400, detail="Email already registered")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/users", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db)):
    from app.repository import list_users as repo_list_users
    return repo_list_users(db)

@app.get("/users/{user_id}", response_model=UserRead)
def get_user(user_id: str, db: Session = Depends(get_db)):
    from app.repository import get_user as repo_get_user
    user = repo_get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# -----------------
# Asset Endpoints
# -----------------
@app.post("/assets", response_model=AssetRead)
def create_asset(asset: AssetCreate, db: Session = Depends(get_db)):
    try:
        return create_asset_service(db, asset)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/assets", response_model=list[AssetRead])
def list_assets(db: Session = Depends(get_db)):
    from app.repository import list_assets as repo_list_assets
    return repo_list_assets(db)

# -----------------
# Loan Endpoints
# -----------------
@app.get("/loans", response_model=list[LoanRead])
def list_all_loans(db: Session = Depends(get_db)):
    from app.repository import list_loans as repo_list_loans
    return repo_list_loans(db)

@app.post("/borrow", response_model=LoanRead)
def borrow(loan_req: LoanRequest, db: Session = Depends(get_db)):
    try:
        return create_loan(db, loan_req.user_id, loan_req.amount)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# -----------------
# Repay Loan Endpoint
# -----------------
@app.post("/repay/{loan_id}", response_model=LoanRead)
def repay(body: RepayRequest,
          loan_id: str = Path(..., description="ID of the loan to repay"),
          db: Session = Depends(get_db)):
    """
    Repay a loan partially or fully.

    Parameters:
    - loan_id: ID of the loan
    - amount: Amount to repay (must be positive and <= remaining debt)
    """
    try:
        updated_loan = repay_loan(db, loan_id, body.amount)
        return updated_loan
    except NotFoundError:
        raise HTTPException(status_code=404, detail="Loan not found")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/repay/batch", response_model=list[LoanRead])
def repay_batch(repayments: list[LoanRepaymentRequest], db: Session = Depends(get_db)):
    """
    Repay multiple loans in a single request.

    Example payload:
    [
        {"loan_id": "abc123", "amount": 50},
        {"loan_id": "def456", "amount": 30}
    ]
    """
    try:
        repayments_dicts = [repayment.model_dump() for repayment in repayments]
        updated_loans = repay_loans_batch(db, repayments_dicts)
        return updated_loans
    except NotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# -----------------
# Position / Dashboard
# -----------------
@app.get("/positions/{user_id}", response_model=PositionResponse)
def get_position(user_id: str, db: Session = Depends(get_db)):
    try:
        return calculate_position(db, user_id)
    except NotFoundError:
        raise HTTPException(status_code=404, detail="User not found")
