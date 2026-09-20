"""
SentinelPay - CRUD and Data Access Helpers
"""

import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.models import (
    User, UserProfile, Transaction, VerificationEvent, Feedback, ModelVersion
)

def utc_now():
    return datetime.now(timezone.utc)

def get_or_create_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(
            id=user_id,
            name=f"Cardholder #{user_id}",
            email=f"user{user_id}@sentinelpay-demo.com",
            phone="+1-555-0100"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = UserProfile(
            user_id=user.id,
            home_location="40.7128,-74.0060",
            average_spend=65.0,
            usual_transaction_velocity=2,
            device_trust_score=0.95
        )
        db.add(profile)
        db.commit()
    return user

def create_transaction(
    db: Session,
    transaction_token: str,
    user_id: int,
    amount: float,
    distance: float,
    time_delta: float,
    merchant_risk: float,
    device_trust: float,
    fraud_probability: float,
    prediction: int,
    risk_level: str,
    status: str,
    explanation: List[Dict[str, Any]]
) -> Transaction:
    get_or_create_user(db, user_id)
    tx = Transaction(
        transaction_token=transaction_token,
        user_id=user_id,
        amount=amount,
        distance=distance,
        time_delta=time_delta,
        merchant_risk=merchant_risk,
        device_trust=device_trust,
        fraud_probability=fraud_probability,
        prediction=prediction,
        risk_level=risk_level,
        status=status,
        explanation_json=json.dumps(explanation)
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    # If soft-blocked, create an initial verification event
    if status == "SOFT_BLOCKED":
        ve = VerificationEvent(
            transaction_id=tx.id,
            verification_type="SIMULATED_MFA_OTP",
            status="PENDING",
            otp_code="123456" # Standard demo OTP code
        )
        db.add(ve)
        db.commit()

    return tx

def get_transaction_by_token(db: Session, token: str) -> Optional[Transaction]:
    return db.query(Transaction).filter(Transaction.transaction_token == token).first()

def get_transactions(db: Session, skip: int = 0, limit: int = 100) -> List[Transaction]:
    return db.query(Transaction).order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()

def update_verification_status(
    db: Session,
    transaction_token: str,
    action: str # "APPROVE" or "DENY"
) -> Optional[Transaction]:
    tx = get_transaction_by_token(db, transaction_token)
    if not tx:
        return None

    ve = db.query(VerificationEvent).filter(
        VerificationEvent.transaction_id == tx.id
    ).order_by(VerificationEvent.attempted_at.desc()).first()

    now = utc_now()

    if action == "APPROVE":
        tx.status = "VERIFIED"
        final_label = 0 # Released by legitimate cardholder
        if ve:
            ve.status = "APPROVED"
            ve.completed_at = now
    else:
        tx.status = "BLOCKED"
        final_label = 1 # Confirmed fraud by cardholder denial
        if ve:
            ve.status = "DENIED"
            ve.completed_at = now

    # Record Human-in-the-Loop Feedback for Future Batch Retraining
    fb = db.query(Feedback).filter(Feedback.transaction_id == tx.id).first()
    if not fb:
        fb = Feedback(
            transaction_id=tx.id,
            original_prediction=tx.prediction,
            user_decision=action,
            final_label=final_label,
            added_to_training=False
        )
        db.add(fb)
    else:
        fb.user_decision = action
        fb.final_label = final_label

    db.commit()
    db.refresh(tx)
    return tx

def get_dashboard_statistics(db: Session) -> Dict[str, Any]:
    total_tx = db.query(func.count(Transaction.id)).scalar() or 0
    fraud_flagged = db.query(func.count(Transaction.id)).filter(Transaction.prediction == 1).scalar() or 0
    approved_count = db.query(func.count(Transaction.id)).filter(Transaction.status.in_(["APPROVED", "VERIFIED"])).scalar() or 0
    soft_blocked_count = db.query(func.count(Transaction.id)).filter(Transaction.status == "SOFT_BLOCKED").scalar() or 0
    blocked_count = db.query(func.count(Transaction.id)).filter(Transaction.status == "BLOCKED").scalar() or 0

    fraud_rate = (fraud_flagged / total_tx * 100) if total_tx > 0 else 0.0

    # Risk level distribution
    low_risk = db.query(func.count(Transaction.id)).filter(Transaction.risk_level == "LOW").scalar() or 0
    review_risk = db.query(func.count(Transaction.id)).filter(Transaction.risk_level == "REVIEW").scalar() or 0
    high_risk = db.query(func.count(Transaction.id)).filter(Transaction.risk_level == "HIGH").scalar() or 0

    # Total volume in dollars
    total_volume = db.query(func.sum(Transaction.amount)).scalar() or 0.0

    # Feedback counts
    feedback_collected = db.query(func.count(Feedback.id)).scalar() or 0

    return {
        "summary": {
            "total_transactions": total_tx,
            "total_volume_usd": round(float(total_volume), 2),
            "fraud_flagged": fraud_flagged,
            "fraud_rate_pct": round(float(fraud_rate), 2),
            "approved": approved_count,
            "soft_blocked_pending": soft_blocked_count,
            "blocked": blocked_count,
            "feedback_records_ready_for_retraining": feedback_collected
        },
        "risk_distribution": {
            "low": low_risk,
            "review": review_risk,
            "high": high_risk
        },
        "model_champion": {
            "name": "SentinelPay XGBoost Classifier v1.0",
            "recall": "98.61%",
            "precision": "97.93%",
            "pr_auc": "0.9990",
            "f1_score": "0.9827"
        }
    }

def seed_demo_data_if_empty(db: Session):
    """Seed sample users and diverse demo transactions if database is fresh."""
    if db.query(User).count() == 0:
        alex = User(id=1001, name="Alex Morgan", email="alex.morgan@demo.com", phone="+1-555-0192")
        sarah = User(id=1002, name="Sarah Chen", email="sarah.chen@demo.com", phone="+1-555-0184")
        db.add_all([alex, sarah])
        db.commit()

    if db.query(Transaction).count() == 0:
        # Pre-seed 3 demo baseline transactions matching the 3 presentation scenarios
        t1 = Transaction(
            transaction_token="TX1001",
            user_id=1001,
            amount=42.50,
            distance=3.2,
            time_delta=18.0,
            merchant_risk=0.09,
            device_trust=0.98,
            fraud_probability=0.042,
            prediction=0,
            risk_level="LOW",
            status="APPROVED",
            explanation_json=json.dumps([
                {"feature": "device_trust", "label": "Device Trust Score", "contribution": -1.45, "direction": "RISK_DECREASING", "value": 0.98},
                {"feature": "distance", "label": "Distance from Home (km)", "contribution": -1.12, "direction": "RISK_DECREASING", "value": 3.2}
            ]),
            created_at=utc_now() - timedelta(minutes=45)
        )
        t2 = Transaction(
            transaction_token="TX1002",
            user_id=1001,
            amount=650.00,
            distance=180.0,
            time_delta=1.2,
            merchant_risk=0.65,
            device_trust=0.55,
            fraud_probability=0.52,
            prediction=1,
            risk_level="REVIEW",
            status="VERIFIED", # Approved via simulated MFA
            explanation_json=json.dumps([
                {"feature": "amount", "label": "Transaction Amount ($)", "contribution": 1.25, "direction": "RISK_INCREASING", "value": 650.0},
                {"feature": "distance", "label": "Distance from Home (km)", "contribution": 0.98, "direction": "RISK_INCREASING", "value": 180.0}
            ]),
            created_at=utc_now() - timedelta(minutes=25)
        )
        t3 = Transaction(
            transaction_token="TX1007",
            user_id=1002,
            amount=1999.00,
            distance=850.0,
            time_delta=0.15,
            merchant_risk=0.92,
            device_trust=0.10,
            fraud_probability=0.985,
            prediction=1,
            risk_level="HIGH",
            status="SOFT_BLOCKED",
            explanation_json=json.dumps([
                {"feature": "distance", "label": "Distance from Home (km)", "contribution": 5.40, "direction": "RISK_INCREASING", "value": 850.0},
                {"feature": "device_trust", "label": "Device Trust Score", "contribution": 2.48, "direction": "RISK_INCREASING", "value": 0.10},
                {"feature": "amount", "label": "Transaction Amount ($)", "contribution": 0.88, "direction": "RISK_INCREASING", "value": 1999.0}
            ]),
            created_at=utc_now() - timedelta(minutes=5)
        )
        db.add_all([t1, t2, t3])
        db.commit()

        # Add verification event for TX1007
        ve = VerificationEvent(
            transaction_id=t3.id,
            verification_type="SIMULATED_MFA_OTP",
            status="PENDING",
            otp_code="123456"
        )
        db.add(ve)
        db.commit()
