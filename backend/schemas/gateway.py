"""
SentinelPay - Gateway API Pydantic Schemas
Defines request and response contracts for external institution integration,
fraud check, verification result callback, field mapping, and audit logging.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from backend.schemas.transaction import ExplanationItem

class GatewayFraudCheckRequest(BaseModel):
    transaction_token: str = Field(..., description="External Bank Transaction Identifier (e.g. ABA-TX-10029)")
    amount: float = Field(..., gt=0, description="Transaction amount")
    currency: str = Field(default="USD", description="Currency code (USD, KHR)")
    payment_method: str = Field(default="KHQR", description="Payment method: KHQR, CARD, BANK_TRANSFER, MOBILE")
    distance: Optional[float] = Field(default=2.5, ge=0, description="Distance from cardholder normal geolocation (km)")
    time_delta: Optional[float] = Field(default=12.0, ge=0, description="Hours since last transaction on account")
    merchant_risk: Optional[float] = Field(default=0.1, ge=0.0, le=1.0, description="Merchant category risk index (0.0 to 1.0)")
    device_trust: Optional[float] = Field(default=0.95, ge=0.0, le=1.0, description="Device fingerprint trust confidence (0.0 to 1.0)")
    user_id: Optional[int] = Field(default=1001, description="Cardholder account identifier")
    velocity_1h: Optional[int] = Field(default=None, ge=0, description="Transactions on account in trailing 1 hour")
    velocity_24h: Optional[int] = Field(default=None, ge=0, description="Transactions on account in trailing 24 hours")
    extra_fields: Optional[Dict[str, Any]] = Field(default=None, description="Raw bank payload for dynamic field mapping")
    client_ip: Optional[str] = Field(default=None, description="Client IP address for real-time external geolocation resolution")

class GatewayFraudCheckResponse(BaseModel):
    transaction_token: str
    institution_code: str
    fraud_probability: float
    risk_level: str # LOW, REVIEW, HIGH
    action: str # APPROVE, STEP_UP_REQUIRED, BLOCK
    requires_verification: bool
    status: str # APPROVED, SOFT_BLOCKED, BLOCKED
    currency: str
    amount: float
    amount_usd: float
    explanation: List[ExplanationItem]
    processed_at: str
    is_fallback: bool = Field(default=False, description="Flag indicating deterministic fallback when ML model is degraded")
    geo_resolution: Optional[Dict[str, Any]] = Field(default=None, description="External IP Geolocation resolution telemetry")
    notification_status: Optional[Dict[str, Any]] = Field(default=None, description="Out-of-band external notification dispatch telemetry")

class GatewayVerificationResultRequest(BaseModel):
    transaction_token: str = Field(..., description="Bank Transaction token (e.g. ABA-TX-10029)")
    verification: str = Field(..., description="'APPROVED' (Cardholder confirmed) or 'DENIED' (Cardholder rejected)")
    auth_method: Optional[str] = Field(default="BANK_OTP", description="Authentication challenge method: BANK_OTP, FACE_ID, BIOMETRIC")
    reason: Optional[str] = Field(default=None, description="Optional bank resolution note")

class GatewayVerificationResultResponse(BaseModel):
    transaction_token: str
    institution_code: str
    status: str # RELEASED or BLOCKED
    message: str
    feedback_recorded: bool
    updated_at: str

class InstitutionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    institution_code: str
    institution_type: str
    environment: str
    status: str
    created_at: datetime

class InstitutionCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=150)
    institution_code: str = Field(..., min_length=2, max_length=50)
    institution_type: str = Field(default="BANK")
    environment: str = Field(default="SANDBOX")

class FieldMappingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: int
    source_field: str
    sentinelpay_field: str
    created_at: datetime

class FieldMappingCreate(BaseModel):
    source_field: str = Field(..., min_length=1, max_length=100)
    sentinelpay_field: str = Field(..., min_length=1, max_length=100)

class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    institution_id: Optional[int]
    action: str
    transaction_token: Optional[str]
    endpoint: Optional[str]
    ip_address: Optional[str]
    status: str
    detail: Optional[str]
    created_at: datetime
