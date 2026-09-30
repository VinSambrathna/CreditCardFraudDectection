"""
SentinelPay - SQLAlchemy ORM Models
Defines Institution, ApiCredential, FieldMapping, AuditLog, User, UserProfile,
Transaction, VerificationEvent, Feedback, and ModelVersion.
"""

from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, UniqueConstraint
)
from sqlalchemy.orm import relationship
from backend.database.connection import Base

def utc_now():
    return datetime.now(timezone.utc)

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    institution_code = Column(String(50), unique=True, index=True, nullable=False)
    institution_type = Column(String(50), default="BANK") # BANK, FINTECH, PAYMENT_PROCESSOR
    environment = Column(String(20), default="SANDBOX") # SANDBOX, PRODUCTION
    status = Column(String(20), default="ACTIVE") # ACTIVE, SUSPENDED, PENDING_APPROVAL
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    credentials = relationship("ApiCredential", back_populates="institution", cascade="all, delete-orphan")
    field_mappings = relationship("FieldMapping", back_populates="institution", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="institution")
    audit_logs = relationship("AuditLog", back_populates="institution")

class ApiCredential(Base):
    __tablename__ = "api_credentials"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    client_id = Column(String(100), unique=True, index=True, nullable=False)
    api_key = Column(String(128), unique=True, index=True, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    institution = relationship("Institution", back_populates="credentials")

class FieldMapping(Base):
    __tablename__ = "field_mappings"
    __table_args__ = (
        UniqueConstraint("institution_id", "source_field", name="uq_inst_source"),
    )

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False)
    source_field = Column(String(100), nullable=False)
    sentinelpay_field = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=utc_now)

    institution = relationship("Institution", back_populates="field_mappings")

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
    home_location = Column(String(150), default="11.5564,104.9282")
    average_spend = Column(Float, default=65.00)
    usual_transaction_velocity = Column(Integer, default=2)
    device_trust_score = Column(Float, default=0.950)

    user = relationship("User", back_populates="profile")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True, index=True)
    transaction_token = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="USD", nullable=False)
    payment_method = Column(String(30), default="KHQR", nullable=False)
    distance = Column(Float, nullable=False)
    time_delta = Column(Float, nullable=False)
    merchant_risk = Column(Float, nullable=False)
    device_trust = Column(Float, nullable=False)
    fraud_probability = Column(Float, nullable=False)
    prediction = Column(Integer, nullable=False) # 0 = Legit, 1 = Fraud
    risk_level = Column(String(20), nullable=False) # LOW, REVIEW, HIGH
    status = Column(String(20), nullable=False) # PENDING, APPROVED, SOFT_BLOCKED, VERIFIED, BLOCKED, RELEASED
    explanation_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    institution = relationship("Institution", back_populates="transactions")
    user = relationship("User", back_populates="transactions")
    verification_events = relationship("VerificationEvent", back_populates="transaction")
    feedback = relationship("Feedback", back_populates="transaction", uselist=False)

class VerificationEvent(Base):
    __tablename__ = "verification_events"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id", ondelete="CASCADE"), nullable=False)
    verification_type = Column(String(50), default="BANK_STEP_UP_OTP")
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

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    institution_id = Column(Integer, ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True, index=True)
    action = Column(String(100), nullable=False, index=True)
    transaction_token = Column(String(64), nullable=True, index=True)
    endpoint = Column(String(150), nullable=True)
    ip_address = Column(String(50), nullable=True)
    status = Column(String(50), default="SUCCESS")
    detail = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    institution = relationship("Institution", back_populates="audit_logs")

