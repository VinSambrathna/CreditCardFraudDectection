"""
SentinelPay - CRUD and Multi-Tenant Data Access Helpers
Provides operations for Institutions, API Credentials, Field Mappings,
Transactions, Verifications, Audit Logs, Feedback, and Dashboards.
"""

import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database.models import (
    Institution, ApiCredential, FieldMapping, AuditLog,
    User, UserProfile, Transaction, VerificationEvent, Feedback, ModelVersion
)

def utc_now():
    return datetime.now(timezone.utc)

# -------------------------------------------------------------
# Institution & Integration Management
# -------------------------------------------------------------

def get_institutions(db: Session, skip: int = 0, limit: int = 100) -> List[Institution]:
    return db.query(Institution).order_by(Institution.id.asc()).offset(skip).limit(limit).all()

def get_institution_by_id(db: Session, institution_id: int) -> Optional[Institution]:
    return db.query(Institution).filter(Institution.id == institution_id).first()

def get_institution_by_code(db: Session, code: str) -> Optional[Institution]:
    return db.query(Institution).filter(Institution.institution_code == code.upper()).first()

def get_institution_by_api_key(db: Session, api_key: str) -> Optional[Institution]:
    cred = db.query(ApiCredential).filter(
        ApiCredential.api_key == api_key,
        ApiCredential.is_active == True
    ).first()
    if cred:
        return cred.institution
    return None

def create_institution(
    db: Session,
    name: str,
    institution_code: str,
    institution_type: str = "BANK",
    environment: str = "SANDBOX"
) -> Institution:
    inst = Institution(
        name=name,
        institution_code=institution_code.upper(),
        institution_type=institution_type,
        environment=environment,
        status="ACTIVE"
    )
    db.add(inst)
    db.commit()
    db.refresh(inst)
    return inst

def create_api_credential(
    db: Session,
    institution_id: int,
    client_id: str,
    api_key: str
) -> ApiCredential:
    cred = ApiCredential(
        institution_id=institution_id,
        client_id=client_id,
        api_key=api_key,
        is_active=True
    )
    db.add(cred)
    db.commit()
    db.refresh(cred)
    return cred

def get_field_mappings_for_institution(db: Session, institution_id: int) -> Dict[str, str]:
    mappings = db.query(FieldMapping).filter(FieldMapping.institution_id == institution_id).all()
    return {m.source_field: m.sentinelpay_field for m in mappings}

def set_field_mapping(
    db: Session,
    institution_id: int,
    source_field: str,
    sentinelpay_field: str
) -> FieldMapping:
    mapping = db.query(FieldMapping).filter(
        FieldMapping.institution_id == institution_id,
        FieldMapping.source_field == source_field
    ).first()
    if mapping:
        mapping.sentinelpay_field = sentinelpay_field
    else:
        mapping = FieldMapping(
            institution_id=institution_id,
            source_field=source_field,
            sentinelpay_field=sentinelpay_field
        )
        db.add(mapping)
    db.commit()
    db.refresh(mapping)
    return mapping

# -------------------------------------------------------------
# Audit Logging
# -------------------------------------------------------------

def create_audit_log(
    db: Session,
    action: str,
    institution_id: Optional[int] = None,
    transaction_token: Optional[str] = None,
    endpoint: Optional[str] = None,
    ip_address: Optional[str] = None,
    status: str = "SUCCESS",
    detail: Optional[str] = None
) -> AuditLog:
    log = AuditLog(
        institution_id=institution_id,
        action=action,
        transaction_token=transaction_token,
        endpoint=endpoint,
        ip_address=ip_address,
        status=status,
        detail=detail
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log

def get_audit_logs(
    db: Session,
    institution_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50
) -> List[AuditLog]:
    q = db.query(AuditLog)
    if institution_id:
        q = q.filter(AuditLog.institution_id == institution_id)
    return q.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

# -------------------------------------------------------------
# User & Cardholder Profiles
# -------------------------------------------------------------

def get_or_create_user(db: Session, user_id: int) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        user = User(
            id=user_id,
            name=f"Cardholder #{user_id}",
            email=f"user{user_id}@sentinelpay-demo.kh",
            phone="+855-12-555000"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        profile = UserProfile(
            user_id=user.id,
            home_location="11.5564,104.9282", # Phnom Penh
            average_spend=65.0,
            usual_transaction_velocity=2,
            device_trust_score=0.95
        )
        db.add(profile)
        db.commit()
    return user

# -------------------------------------------------------------
# Transactions
# -------------------------------------------------------------

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
    explanation: List[Dict[str, Any]],
    institution_id: Optional[int] = None,
    currency: str = "USD",
    payment_method: str = "KHQR"
) -> Transaction:
    get_or_create_user(db, user_id)
    tx = Transaction(
        transaction_token=transaction_token,
        institution_id=institution_id,
        user_id=user_id,
        amount=amount,
        currency=currency,
        payment_method=payment_method,
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
            verification_type="BANK_STEP_UP_OTP",
            status="PENDING",
            otp_code="123456" # Standard demo OTP code
        )
        db.add(ve)
        db.commit()

    return tx

def get_transaction_by_token(
    db: Session,
    token: str,
    institution_id: Optional[int] = None
) -> Optional[Transaction]:
    q = db.query(Transaction).filter(Transaction.transaction_token == token)
    if institution_id is not None:
        q = q.filter(Transaction.institution_id == institution_id)
    return q.first()

def get_transactions(
    db: Session,
    institution_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100
) -> List[Transaction]:
    q = db.query(Transaction)
    if institution_id is not None:
        q = q.filter(Transaction.institution_id == institution_id)
    return q.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()

def update_verification_status(
    db: Session,
    transaction_token: str,
    action: str, # "APPROVE" or "DENY"
    institution_id: Optional[int] = None
) -> Optional[Transaction]:
    tx = get_transaction_by_token(db, transaction_token, institution_id=institution_id)
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

def get_dashboard_statistics(
    db: Session,
    institution_id: Optional[int] = None
) -> Dict[str, Any]:
    tx_q = db.query(Transaction)
    if institution_id is not None:
        tx_q = tx_q.filter(Transaction.institution_id == institution_id)

    total_tx = tx_q.count()
    fraud_flagged = tx_q.filter(Transaction.prediction == 1).count()
    approved_count = tx_q.filter(Transaction.status.in_(["APPROVED", "VERIFIED", "RELEASED"])).count()
    soft_blocked_count = tx_q.filter(Transaction.status == "SOFT_BLOCKED").count()
    blocked_count = tx_q.filter(Transaction.status == "BLOCKED").count()

    fraud_rate = (fraud_flagged / total_tx * 100) if total_tx > 0 else 0.0

    # Risk level distribution
    low_risk = tx_q.filter(Transaction.risk_level == "LOW").count()
    review_risk = tx_q.filter(Transaction.risk_level == "REVIEW").count()
    high_risk = tx_q.filter(Transaction.risk_level == "HIGH").count()

    # Total volume in dollars
    vol_q = db.query(func.sum(Transaction.amount))
    if institution_id is not None:
        vol_q = vol_q.filter(Transaction.institution_id == institution_id)
    total_volume = vol_q.scalar() or 0.0

    # Feedback counts
    feedback_collected = db.query(func.count(Feedback.id)).scalar() or 0

    inst_name = "All Institutions (Platform-Wide)"
    if institution_id is not None:
        inst = get_institution_by_id(db, institution_id)
        if inst:
            inst_name = inst.name

    return {
        "institution_id": institution_id,
        "institution_name": inst_name,
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
    """Seed sample institutions, API credentials, users, and diverse demo transactions."""
    # 1. Seed Institutions
    if db.query(Institution).count() == 0:
        inst_aba = Institution(id=1, name="ABA Bank (Simulated)", institution_code="ABA", institution_type="BANK", environment="SANDBOX", status="ACTIVE")
        inst_acleda = Institution(id=2, name="ACLEDA Bank (Simulated)", institution_code="ACLEDA", institution_type="BANK", environment="SANDBOX", status="ACTIVE")
        inst_wing = Institution(id=3, name="Wing Bank (Simulated)", institution_code="WING", institution_type="BANK", environment="SANDBOX", status="ACTIVE")
        inst_canadia = Institution(id=4, name="Canadia Bank (Simulated)", institution_code="CANADIA", institution_type="BANK", environment="SANDBOX", status="ACTIVE")
        inst_fintech = Institution(id=5, name="Demo Fintech (Simulated)", institution_code="FINTECH01", institution_type="FINTECH", environment="SANDBOX", status="ACTIVE")
        db.add_all([inst_aba, inst_acleda, inst_wing, inst_canadia, inst_fintech])
        db.commit()

        # Seed API credentials
        creds = [
            ApiCredential(institution_id=1, client_id="sp_aba_demo_001", api_key="aba_sandbox_live_key_9f83a", is_active=True),
            ApiCredential(institution_id=2, client_id="sp_acleda_demo_002", api_key="acleda_sandbox_live_key_7c41b", is_active=True),
            ApiCredential(institution_id=3, client_id="sp_wing_demo_003", api_key="wing_sandbox_live_key_2e19d", is_active=True),
            ApiCredential(institution_id=4, client_id="sp_canadia_demo_004", api_key="canadia_sandbox_live_key_5a38f", is_active=True),
            ApiCredential(institution_id=5, client_id="sp_fintech_demo_005", api_key="fintech_sandbox_live_key_8d24e", is_active=True),
        ]
        db.add_all(creds)
        db.commit()

        # Seed Field Mappings
        mappings = [
            FieldMapping(institution_id=1, source_field="transactionAmount", sentinelpay_field="amount"),
            FieldMapping(institution_id=1, source_field="currencyCode", sentinelpay_field="currency"),
            FieldMapping(institution_id=1, source_field="paymentType", sentinelpay_field="payment_method"),
            FieldMapping(institution_id=1, source_field="deviceTrustScore", sentinelpay_field="device_trust"),
            FieldMapping(institution_id=1, source_field="merchantRiskScore", sentinelpay_field="merchant_risk"),

            FieldMapping(institution_id=2, source_field="tx_amount", sentinelpay_field="amount"),
            FieldMapping(institution_id=2, source_field="cur", sentinelpay_field="currency"),
            FieldMapping(institution_id=2, source_field="device_score", sentinelpay_field="device_trust"),
            FieldMapping(institution_id=2, source_field="merchant_score", sentinelpay_field="merchant_risk"),

            FieldMapping(institution_id=3, source_field="payment_value", sentinelpay_field="amount"),
            FieldMapping(institution_id=3, source_field="curr", sentinelpay_field="currency"),
            FieldMapping(institution_id=3, source_field="trust_score", sentinelpay_field="device_trust"),
            FieldMapping(institution_id=3, source_field="m_risk", sentinelpay_field="merchant_risk"),
        ]
        db.add_all(mappings)
        db.commit()

    # 2. Seed Users
    if db.query(User).count() == 0:
        sophea = User(id=1001, name="Sophea Sok (Customer)", email="sophea.sok@demo-bank.kh", phone="+855-12-889901")
        vannak = User(id=1002, name="Vannak Chan (Customer)", email="vannak.chan@demo-bank.kh", phone="+855-15-776655")
        bopha = User(id=1003, name="Bopha Rath (Customer)", email="bopha.rath@demo-bank.kh", phone="+855-17-443322")
        db.add_all([sophea, vannak, bopha])
        db.commit()

        p1 = UserProfile(id=1, user_id=1001, home_location="11.5564,104.9282", average_spend=45.00, usual_transaction_velocity=2, device_trust_score=0.965)
        p2 = UserProfile(id=2, user_id=1002, home_location="13.3671,103.8448", average_spend=120.00, usual_transaction_velocity=3, device_trust_score=0.940)
        p3 = UserProfile(id=3, user_id=1003, home_location="13.0957,103.2022", average_spend=75.00, usual_transaction_velocity=1, device_trust_score=0.910)
        db.add_all([p1, p2, p3])
        db.commit()

    # 3. Seed Transactions
    if db.query(Transaction).count() == 0:
        t1 = Transaction(
            transaction_token="TX1001",
            institution_id=1, # ABA Bank
            user_id=1001,
            amount=8.50,
            currency="USD",
            payment_method="KHQR",
            distance=1.2,
            time_delta=18.0,
            merchant_risk=0.08,
            device_trust=0.98,
            fraud_probability=0.038,
            prediction=0,
            risk_level="LOW",
            status="APPROVED",
            explanation_json=json.dumps([
                {"feature": "device_trust", "label": "Device Trust Score", "contribution": -1.45, "direction": "RISK_DECREASING", "value": 0.98},
                {"feature": "distance", "label": "Distance from Home (km)", "contribution": -1.12, "direction": "RISK_DECREASING", "value": 1.2}
            ]),
            created_at=utc_now() - timedelta(minutes=45)
        )
        t2 = Transaction(
            transaction_token="TX1002",
            institution_id=2, # ACLEDA Bank
            user_id=1001,
            amount=650.00,
            currency="USD",
            payment_method="KHQR",
            distance=180.0,
            time_delta=1.2,
            merchant_risk=0.65,
            device_trust=0.55,
            fraud_probability=0.52,
            prediction=1,
            risk_level="REVIEW",
            status="VERIFIED",
            explanation_json=json.dumps([
                {"feature": "amount", "label": "Transaction Amount ($)", "contribution": 1.25, "direction": "RISK_INCREASING", "value": 650.0},
                {"feature": "distance", "label": "Distance from Home (km)", "contribution": 0.98, "direction": "RISK_INCREASING", "value": 180.0}
            ]),
            created_at=utc_now() - timedelta(minutes=25)
        )
        t3 = Transaction(
            transaction_token="TX1007",
            institution_id=1, # ABA Bank
            user_id=1002,
            amount=1800.00,
            currency="USD",
            payment_method="KHQR",
            distance=850.0,
            time_delta=0.15,
            merchant_risk=0.92,
            device_trust=0.10,
            fraud_probability=0.87,
            prediction=1,
            risk_level="HIGH",
            status="SOFT_BLOCKED",
            explanation_json=json.dumps([
                {"feature": "distance", "label": "Distance from Home (km)", "contribution": 5.40, "direction": "RISK_INCREASING", "value": 850.0},
                {"feature": "device_trust", "label": "Device Trust Score", "contribution": 2.48, "direction": "RISK_INCREASING", "value": 0.10},
                {"feature": "amount", "label": "Transaction Amount ($)", "contribution": 0.88, "direction": "RISK_INCREASING", "value": 1800.0}
            ]),
            created_at=utc_now() - timedelta(minutes=5)
        )
        db.add_all([t1, t2, t3])
        db.commit()

        # Add verification event for TX1007
        ve = VerificationEvent(
            transaction_id=t3.id,
            verification_type="BANK_STEP_UP_OTP",
            status="PENDING",
            otp_code="123456"
        )
        db.add(ve)

        # Add seed audit logs
        log1 = AuditLog(
            institution_id=1,
            action="API_FRAUD_CHECK",
            transaction_token="TX1007",
            endpoint="/api/v1/fraud/check",
            ip_address="192.168.1.100",
            status="STEP_UP_REQUIRED",
            detail="Transaction flagged with risk probability 87.0%. Step-up challenge initiated."
        )
        log2 = AuditLog(
            institution_id=1,
            action="API_FRAUD_CHECK",
            transaction_token="TX1001",
            endpoint="/api/v1/fraud/check",
            ip_address="192.168.1.100",
            status="APPROVED",
            detail="Transaction cleared automatically with risk probability 3.8%."
        )
        db.add_all([log1, log2])
        db.commit()

def get_active_model_version(db: Session) -> Optional[ModelVersion]:
    return db.query(ModelVersion).filter(ModelVersion.is_active == True).order_by(ModelVersion.trained_at.desc()).first()
