"""
SentinelPay - Step-Up MFA & Feedback API Router
Handles POST /verify and POST /feedback
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database import crud
from backend.schemas.verification import VerifyRequest, VerifyResponse, FeedbackRequest

router = APIRouter(prefix="", tags=["Verification & MFA"])

@router.post("/verify", response_model=VerifyResponse)
def verify_transaction(req: VerifyRequest, db: Session = Depends(get_db)):
    tx = crud.get_transaction_by_token(db, req.transaction_token)
    if not tx:
        raise HTTPException(status_code=404, detail=f"Transaction {req.transaction_token} not found")

    if tx.status not in ["SOFT_BLOCKED", "PENDING"]:
        return VerifyResponse(
            transaction_token=req.transaction_token,
            status=tx.status,
            message=f"Transaction is already in status {tx.status}",
            feedback_recorded=False
        )

    # Simulated MFA OTP validation: any 6 digit code or '123456' accepted
    if req.action == "APPROVE" and len(req.otp_code.strip()) != 6:
        raise HTTPException(status_code=400, detail="Invalid verification code format (must be 6 digits)")

    updated_tx = crud.update_verification_status(db, req.transaction_token, req.action.upper())

    msg = "Transaction successfully verified and payment released." if req.action.upper() == "APPROVE" else "Transaction blocked. Security feedback logged for future model retraining."

    return VerifyResponse(
        transaction_token=req.transaction_token,
        status=updated_tx.status,
        message=msg,
        feedback_recorded=True
    )

@router.post("/feedback")
def submit_feedback(req: FeedbackRequest, db: Session = Depends(get_db)):
    tx = crud.get_transaction_by_token(db, req.transaction_token)
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    updated_tx = crud.update_verification_status(db, req.transaction_token, req.action.upper())
    return {
        "status": "success",
        "message": f"Feedback recorded for {req.transaction_token}",
        "final_status": updated_tx.status
    }
