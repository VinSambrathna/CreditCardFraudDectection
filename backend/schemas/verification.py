"""
SentinelPay - Step-Up MFA & Feedback Schemas
"""

from pydantic import BaseModel, Field

class VerifyRequest(BaseModel):
    transaction_token: str = Field(..., description="Transaction token (e.g., TX1007)")
    otp_code: str = Field(default="123456", description="6-digit simulated OTP verification code")
    action: str = Field(default="APPROVE", description="'APPROVE' or 'DENY'")

class VerifyResponse(BaseModel):
    transaction_token: str
    status: str # "VERIFIED" or "BLOCKED"
    message: str
    feedback_recorded: bool

class FeedbackRequest(BaseModel):
    transaction_token: str
    action: str = Field(..., description="'APPROVE' (genuine cardholder) or 'DENY' (confirmed fraud)")
