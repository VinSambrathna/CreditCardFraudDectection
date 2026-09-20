"""
SentinelPay - SQLAlchemy ORM Models
Defines User, UserProfile, Transaction, VerificationEvent, Feedback, and ModelVersion.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
)
from sqlalchemy.orm import relationship
from backend.database.connection import Base

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    phone = Column(String(25), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    profile = relationship("UserProfile", back_populates="user", uselist=False)
    transactions = relationship("Transaction", back_populates="user")

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    home_location = Column(String(150), default="40.7128,-74.0060")
    average_spend = Column(Float, default=65.00)
    usual_transaction_velocity = Column(Integer, default=2)
    device_trust_score = Column(Float, default=0.950)

    user = relationship("User", back_populates="profile")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_token = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    distance = Column(Float, nullable=False)
    time_delta = Column(Float, nullable=False)
    merchant_risk = Column(Float, nullable=False)
    device_trust = Column(Float, nullable=False)
    fraud_probability = Column(Float, nullable=False)
    prediction = Column(Integer, nullable=False) # 0 = Legit, 1 = Fraud
    risk_level = Column(String(20), nullable=False) # LOW, REVIEW, HIGH
    status = Column(String(20), nullable=False) # PENDING, APPROVED, SOFT_BLOCKED, VERIFIED, BLOCKED
    explanation_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    user = relationship("User", back_populates="transactions")
    verification_events = relationship("VerificationEvent", back_populates="transaction")
    feedback = relationship("Feedback", back_populates="transaction", uselist=False)

class VerificationEvent(Base):
    __tablename__ = "verification_events"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    verification_type = Column(String(50), default="SIMULATED_MFA_OTP")
    status = Column(String(20), default="PENDING") # PENDING, APPROVED, DENIED, EXPIRED
    otp_code = Column(String(10), default="123456")
    attempted_at = Column(DateTime, default=utc_now)
    completed_at = Column(DateTime, nullable=True)

    transaction = relationship("Transaction", back_populates="verification_events")

class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    original_prediction = Column(Integer, nullable=False)
    user_decision = Column(String(20), nullable=False) # APPROVED, DENIED
    final_label = Column(Integer, nullable=False) # 0 = Legitimate, 1 = Fraud
    added_to_training = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    transaction = relationship("Transaction", back_populates="feedback")

class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String(100), nullable=False)
    version = Column(String(20), nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    pr_auc = Column(Float, nullable=False)
    trained_at = Column(DateTime, default=utc_now)
    is_active = Column(Boolean, default=True)
