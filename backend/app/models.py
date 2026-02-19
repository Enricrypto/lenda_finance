from sqlalchemy import Column, String, Float, DateTime, ForeignKey
from datetime import datetime, timezone
import uuid
from .database import Base  # import Base from database.py
from .rules import LoanStatus 

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=True)

class Asset(Base):
    __tablename__ = "assets"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)
    value = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))

class Loan(Base):
    __tablename__ = "loans"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    amount_repaid = Column(Float, nullable=False, default=0.0)
    interest_rate = Column(Float, nullable=False, default=0.05)
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    status = Column(String, default=LoanStatus.pending.value)
