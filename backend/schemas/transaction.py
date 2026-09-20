"""
SentinelPay - Transaction & Prediction Pydantic Schemas
"""

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class ExplanationItem(BaseModel):
    feature: str
    label: str
    contribution: float
    direction: str # "RISK_INCREASING" or "RISK_DECREASING"
    value: float

class PredictRequest(BaseModel):
    user_id: int = Field(default=1001, description="Cardholder identifier")
    amount: float = Field(..., gt=0, description="Transaction amount in USD")
    distance: float = Field(..., ge=0, description="Distance from cardholder's home in km")
    time_delta: float = Field(..., ge=0, description="Time since last card activity in hours")
    merchant_risk: float = Field(..., ge=0.0, le=1.0, description="Merchant risk score (0.0 to 1.0)")
    device_trust: float = Field(..., ge=0.0, le=1.0, description="Device fingerprint trust score (0.0 to 1.0)")
    velocity_1h: Optional[int] = Field(default=1, ge=0, description="Transactions in past 1 hour")
    velocity_24h: Optional[int] = Field(default=2, ge=0, description="Transactions in past 24 hours")
    hour_of_day: Optional[int] = Field(default=14, ge=0, le=23, description="Hour of day (0-23)")
    is_weekend: Optional[int] = Field(default=0, ge=0, le=1, description="1 if weekend, 0 otherwise")

class PredictResponse(BaseModel):
    transaction_id: str
    fraud_probability: float
    risk_level: str # "LOW", "REVIEW", "HIGH"
    status: str # "APPROVED", "SOFT_BLOCKED"
    requires_verification: bool
    explanation: List[ExplanationItem]

class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    transaction_token: str
    user_id: int
    amount: float
    distance: float
    time_delta: float
    merchant_risk: float
    device_trust: float
    fraud_probability: float
    prediction: int
    risk_level: str
    status: str
    explanation: Optional[List[ExplanationItem]] = None
    created_at: datetime
