from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from datetime import datetime, timezone
import uuid
from .database import Base
from .rules import LoanStatus, AssetStatus


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id            = Column(String, primary_key=True, default=generate_uuid)
    name          = Column(String, nullable=False)
    email         = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=True)


class Asset(Base):
    __tablename__ = "assets"
    id              = Column(String, primary_key=True, default=generate_uuid)
    user_id         = Column(String, ForeignKey("users.id"), nullable=False)
    type            = Column(String, nullable=False)
    description     = Column(String, nullable=True)
    # "value" is the legacy DB column name — kept for migration compatibility
    stated_value    = Column("value", Float, nullable=False)
    appraised_value = Column(Float, nullable=False, default=0.0)
    ltv_ratio       = Column(Float, nullable=False, default=0.5)
    status          = Column(String, nullable=False, default=AssetStatus.active.value)
    created_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    appraised_at    = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Loan(Base):
    __tablename__ = "loans"
    id                      = Column(String, primary_key=True, default=generate_uuid)
    user_id                 = Column(String, ForeignKey("users.id"), nullable=False)
    amount                  = Column(Float, nullable=False)
    amount_repaid           = Column(Float, nullable=False, default=0.0)
    accrued_interest        = Column(Float, nullable=False, default=0.0)
    interest_rate           = Column(Float, nullable=False, default=0.05)
    status                  = Column(String, default=LoanStatus.pending.value)
    ltv_at_origination      = Column(Float, nullable=True)
    health_factor_snapshot  = Column(Float, nullable=True)
    rejection_reason        = Column(String, nullable=True)
    collateral_value_locked = Column(Float, nullable=True)
    created_at              = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    activated_at            = Column(DateTime, nullable=True)
    repaid_at               = Column(DateTime, nullable=True)
