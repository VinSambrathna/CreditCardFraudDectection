"""
SentinelPay - Enterprise Integration Gateway API Router
Provides /api/v1/fraud/check, /api/v1/verification/result,
multi-tenant query endpoints, field mapping, and audit logging.
"""

import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database import crud
from backend.database.models import Transaction, Feedback, VerificationEvent, Institution
from backend.security.auth import verify_api_key, AuthenticatedTenant
from backend.services.prediction_service import PredictionService
from backend.services.shap_service import ShapService
from backend.services.websocket_hub import AlertHub
from backend.services.external_geo_service import ExternalGeoService
from backend.services.external_notification_service import ExternalNotificationService
from backend.schemas.transaction import PredictRequest, ExplanationItem
from backend.schemas.gateway import (
    GatewayFraudCheckRequest,
    GatewayFraudCheckResponse,
    GatewayVerificationResultRequest,
    GatewayVerificationResultResponse,
    InstitutionOut,
    InstitutionCreate,
    FieldMappingOut,
    FieldMappingCreate,
    AuditLogOut
)

router = APIRouter(prefix="/api/v1", tags=["Integration Gateway"])

def utc_now_iso():
    return datetime.now(timezone.utc).isoformat()

# -------------------------------------------------------------
# 1. Fraud Check API (/api/v1/fraud/check)
# -------------------------------------------------------------

@router.post("/fraud/check", response_model=GatewayFraudCheckResponse)
async def check_transaction_fraud(
    req: GatewayFraudCheckRequest,
    request: Request,
    tenant: AuthenticatedTenant = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """
    Main external ingestion point for banks and payment processors.
    Normalizes bank payload, performs real-time ML inference,
    computes local TreeSHAP attribution, logs audit trail,
    and publishes alerts via WebSockets.
    """
    pred_service = PredictionService.get_instance()
    shap_service = ShapService.get_instance()
    alert_hub = AlertHub.get_instance()
    geo_service = ExternalGeoService.get_instance()
    notif_service = ExternalNotificationService.get_instance()

    # 1. Dynamic Field Mapping Normalization
    raw_amount = req.amount
    currency = req.currency.upper()
    payment_method = req.payment_method.upper()
    distance = req.distance if req.distance is not None else 2.5
    time_delta = req.time_delta if req.time_delta is not None else 12.0
    merchant_risk = req.merchant_risk if req.merchant_risk is not None else 0.1
    device_trust = req.device_trust if req.device_trust is not None else 0.95

    # Live External IP Geolocation Resolution (External Service Integration)
    geo_telemetry = None
    if req.client_ip:
        resolved_dist, geo_telemetry = await geo_service.resolve_ip_distance(req.client_ip)
        distance = resolved_dist

    # Check database field mappings for this institution
    inst_mappings = crud.get_field_mappings_for_institution(db, tenant.institution_id)
    if req.extra_fields and inst_mappings:
        for source_f, target_f in inst_mappings.items():
            if source_f in req.extra_fields:
                val = req.extra_fields[source_f]
                if target_f == "amount":
                    raw_amount = float(val)
                elif target_f == "currency":
                    currency = str(val).upper()
                elif target_f == "payment_method":
                    payment_method = str(val).upper()
                elif target_f == "distance":
                    distance = float(val)
                elif target_f == "time_delta":
                    time_delta = float(val)
                elif target_f == "merchant_risk":
                    merchant_risk = float(val)
                elif target_f == "device_trust":
                    device_trust = float(val)

    # 2. Currency Normalization (KHR to USD conversion for ML feature vector)
    amount_usd = raw_amount
    if currency == "KHR":
        # Standard conversion: ~4,050 KHR = $1 USD
        amount_usd = round(raw_amount / 4050.0, 2)

    # 3. Build Model Feature Request
    # Derive trailing velocity from explicit payload or rapid time_delta burst
    velocity_1h = req.velocity_1h
    velocity_24h = req.velocity_24h
    if velocity_1h is None:
        if time_delta is not None and time_delta <= 0.1:
            velocity_1h = 6
        else:
            velocity_1h = 1
    if velocity_24h is None:
        velocity_24h = max(velocity_1h + 2, 2)

    model_req = PredictRequest(
        user_id=req.user_id or 1001,
        amount=amount_usd,
        distance=distance,
        time_delta=time_delta,
        merchant_risk=merchant_risk,
        device_trust=device_trust,
        velocity_1h=velocity_1h,
        velocity_24h=velocity_24h,
        hour_of_day=14,
        is_weekend=0
    )

    # 4. Real-time ML Inference
    prob, prediction, risk_level, internal_status, requires_verification, raw_df, scaled_matrix = pred_service.predict(model_req)

    # 5. Fast TreeSHAP Attribution
    explanations = shap_service.explain_transaction(raw_df, scaled_matrix)

    # 6. Operational Risk Action Mapping
    if risk_level == "LOW":
        action = "APPROVE"
        final_status = "APPROVED"
        requires_verification = False
    elif risk_level == "REVIEW":
        action = "STEP_UP_REQUIRED"
        final_status = "SOFT_BLOCKED"
        requires_verification = True
    else: # HIGH
        action = "STEP_UP_REQUIRED"
        final_status = "SOFT_BLOCKED"
        requires_verification = True

    # 7. Persist to Multi-Tenant Storage
    crud.create_transaction(
        db=db,
        transaction_token=req.transaction_token,
        user_id=model_req.user_id,
        amount=raw_amount,
        currency=currency,
        payment_method=payment_method,
        distance=distance,
        time_delta=time_delta,
        merchant_risk=merchant_risk,
        device_trust=device_trust,
        fraud_probability=prob,
        prediction=prediction,
        risk_level=risk_level,
        status=final_status,
        explanation=explanations,
        institution_id=tenant.institution_id
    )

    # 8. Record Compliance Audit Trail
    client_ip = request.client.host if request.client else "127.0.0.1"
    crud.create_audit_log(
        db=db,
        action="FRAUD_CHECK_EVALUATED",
        institution_id=tenant.institution_id,
        transaction_token=req.transaction_token,
        endpoint="/api/v1/fraud/check",
        ip_address=client_ip,
        status=action,
        detail=f"Risk: {risk_level} ({prob*100:.1f}%) | Action: {action} | Payment: {currency} {raw_amount:.2f} via {payment_method}"
    )

    # 9. Real-Time Alert Broadcast via WebSocket
    alert_payload = {
        "transaction_token": req.transaction_token,
        "institution_code": tenant.institution_code,
        "institution_name": tenant.institution_name,
        "amount": raw_amount,
        "currency": currency,
        "payment_method": payment_method,
        "fraud_probability": round(prob, 4),
        "risk_level": risk_level,
        "action": action,
        "status": final_status,
        "explanation": explanations[:3] if explanations else [],
        "timestamp": utc_now_iso()
    }
    await alert_hub.broadcast_alert(
        event_type="FRAUD_ALERT" if risk_level in ["REVIEW", "HIGH"] else "TRANSACTION_CLEARED",
        payload=alert_payload,
        institution_id=tenant.institution_id
    )

    is_fallback = getattr(pred_service, "is_last_prediction_fallback", False)

    # 10. Real-Time Out-of-Band Step-Up Notification Dispatch (External Service Integration)
    notif_status = None
    if risk_level in ["REVIEW", "HIGH"]:
        notif_status = await notif_service.send_step_up_alert(
            transaction_token=req.transaction_token,
            institution_code=tenant.institution_code,
            amount=raw_amount,
            currency=currency,
            risk_level=risk_level,
            fraud_probability=prob,
            top_explanations=explanations[:1],
            geo_telemetry=geo_telemetry,
            distance_km=distance
        )

    return GatewayFraudCheckResponse(
        transaction_token=req.transaction_token,
        institution_code=tenant.institution_code,
        fraud_probability=round(prob, 4),
        risk_level=risk_level,
        action=action,
        requires_verification=requires_verification,
        status=final_status,
        currency=currency,
        amount=raw_amount,
        amount_usd=amount_usd,
        explanation=[ExplanationItem(**item) for item in explanations],
        processed_at=utc_now_iso(),
        is_fallback=is_fallback,
        geo_resolution=geo_telemetry,
        notification_status=notif_status
    )

# -------------------------------------------------------------
# 2. Step-Up Verification State Machine Callback
# -------------------------------------------------------------

async def resolve_transaction_verification(
    db: Session,
    transaction_token: str,
    action: str,
    auth_method: str = "TELEGRAM_INLINE_CHALLENGE",
    reason: Optional[str] = None,
    client_ip: str = "127.0.0.1",
    institution_id: Optional[int] = None
) -> Dict[str, Any]:
    """
    Core state machine transition engine for Step-Up Verification.
    Can be invoked by:
    - Gateway API endpoint (/api/v1/verification/result)
    - Telegram Bot inline button callbacks & text replies
    - Webhook callbacks
    """
    action_upper = action.upper()
    if action_upper not in ["APPROVE", "APPROVED", "RELEASE", "DENY", "DENIED", "BLOCK"]:
        raise ValueError("Verification verdict must be 'APPROVED' or 'DENIED'.")

    if institution_id:
        tx = crud.get_transaction_by_token(db, transaction_token, institution_id=institution_id)
    else:
        tx = db.query(Transaction).filter(Transaction.transaction_token == transaction_token).first()

    if not tx:
        return {
            "success": False,
            "status": "NOT_FOUND",
            "message": f"Transaction '{transaction_token}' not found."
        }

    inst = db.query(Institution).filter(Institution.id == tx.institution_id).first()
    inst_code = inst.institution_code if inst else "UNKNOWN"

    # If already finalized, do not overwrite state
    if tx.status in ["RELEASED", "BLOCKED"]:
        return {
            "success": True,
            "already_finalized": True,
            "transaction_token": tx.transaction_token,
            "institution_code": inst_code,
            "status": tx.status,
            "amount": tx.amount,
            "currency": tx.currency,
            "message": f"Transaction already finalized with status: {tx.status}."
        }

    is_approval = action_upper in ["APPROVE", "APPROVED", "RELEASE"]
    now = datetime.now(timezone.utc)

    if is_approval:
        tx.status = "RELEASED"
        final_label = 0  # Released by legitimate cardholder
        message = "Step-up verification approved. Transaction released for settlement."
    else:
        tx.status = "BLOCKED"
        final_label = 1  # Confirmed fraud by cardholder refusal
        message = "Step-up verification denied. Transaction permanently blocked."

    # Update verification event record
    ve = db.query(VerificationEvent).filter(
        VerificationEvent.transaction_id == tx.id
    ).order_by(VerificationEvent.attempted_at.desc()).first()

    if ve:
        ve.status = "APPROVED" if is_approval else "DENIED"
        ve.completed_at = now
        if auth_method:
            ve.verification_type = auth_method

    # Record Human-in-the-Loop Feedback for Retraining
    fb = db.query(Feedback).filter(Feedback.transaction_id == tx.id).first()
    if not fb:
        fb = Feedback(
            transaction_id=tx.id,
            original_prediction=tx.prediction,
            user_decision="APPROVED" if is_approval else "DENIED",
            final_label=final_label,
            added_to_training=False
        )
        db.add(fb)
    else:
        fb.user_decision = "APPROVED" if is_approval else "DENIED"
        fb.final_label = final_label

    db.commit()
    db.refresh(tx)

    # Compliance Audit Log
    crud.create_audit_log(
        db=db,
        action="VERIFICATION_RESULT_RECORDED",
        institution_id=tx.institution_id,
        transaction_token=tx.transaction_token,
        endpoint="/api/v1/verification/result",
        ip_address=client_ip,
        status=tx.status,
        detail=f"Cardholder challenge result: {action_upper} via {auth_method}. Reason: {reason or 'N/A'}"
    )

    # Real-Time Event Push via WebSocket
    alert_hub = AlertHub.get_instance()
    await alert_hub.broadcast_alert(
        event_type="TRANSACTION_STATUS_MUTATED",
        payload={
            "transaction_token": tx.transaction_token,
            "institution_code": inst_code,
            "new_status": tx.status,
            "decision": action_upper,
            "timestamp": utc_now_iso()
        },
        institution_id=tx.institution_id
    )

    return {
        "success": True,
        "already_finalized": False,
        "transaction_token": tx.transaction_token,
        "institution_code": inst_code,
        "status": tx.status,
        "amount": tx.amount,
        "currency": tx.currency,
        "message": message,
        "auth_method": auth_method,
        "feedback_recorded": True,
        "updated_at": utc_now_iso()
    }


@router.post("/verification/result", response_model=GatewayVerificationResultResponse)
async def submit_verification_result(
    req: GatewayVerificationResultRequest,
    request: Request,
    tenant: AuthenticatedTenant = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """
    Pure state machine transition callback.
    Mutates transaction status from SOFT_BLOCKED to RELEASED or BLOCKED.
    Strictly isolated: Banks can only resolve their own institution's transactions.
    """
    action = req.verification.upper()
    if action not in ["APPROVE", "APPROVED", "RELEASE", "DENY", "DENIED", "BLOCK"]:
        raise HTTPException(
            status_code=400,
            detail="Verification verdict must be 'APPROVED' or 'DENIED'."
        )

    client_ip = request.client.host if request.client else "127.0.0.1"
    res = await resolve_transaction_verification(
        db=db,
        transaction_token=req.transaction_token,
        action=action,
        auth_method=req.auth_method or "BANK_APP",
        reason=req.reason,
        client_ip=client_ip,
        institution_id=tenant.institution_id
    )

    if not res.get("success"):
        raise HTTPException(
            status_code=404,
            detail=f"Transaction '{req.transaction_token}' not found under institution '{tenant.institution_code}'"
        )

    return GatewayVerificationResultResponse(
        transaction_token=res["transaction_token"],
        institution_code=res["institution_code"],
        status=res["status"],
        message=res["message"],
        feedback_recorded=True,
        updated_at=res.get("updated_at", utc_now_iso())
    )


@router.post("/telegram/webhook")
async def telegram_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Inbound webhook endpoint for Telegram Bot updates (optional if long-polling is running).
    """
    payload = await request.json()
    from backend.services.telegram_bot_service import TelegramBotService
    result = await TelegramBotService.get_instance().handle_update(payload, db)
    return result

# -------------------------------------------------------------
# 3. Multi-Tenant Scoped Transaction Queries
# -------------------------------------------------------------

@router.get("/transactions/{token}")
def get_gateway_transaction(
    token: str,
    tenant: AuthenticatedTenant = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """
    Secure transaction detail query.
    Enforces tenant scoping: returns 404 if token does not belong to calling institution.
    """
    tx = crud.get_transaction_by_token(db, token, institution_id=tenant.institution_id)
    if not tx:
        raise HTTPException(
            status_code=404,
            detail=f"Transaction '{token}' not found under institution '{tenant.institution_code}'"
        )

    expl = []
    if tx.explanation_json:
        try:
            expl = [ExplanationItem(**item) for item in json.loads(tx.explanation_json)]
        except Exception:
            expl = []

    return {
        "id": tx.id,
        "transaction_token": tx.transaction_token,
        "institution_code": tenant.institution_code,
        "amount": tx.amount,
        "currency": tx.currency,
        "payment_method": tx.payment_method,
        "distance": tx.distance,
        "time_delta": tx.time_delta,
        "merchant_risk": tx.merchant_risk,
        "device_trust": tx.device_trust,
        "fraud_probability": tx.fraud_probability,
        "prediction": tx.prediction,
        "risk_level": tx.risk_level,
        "status": tx.status,
        "explanation": expl,
        "created_at": tx.created_at
    }

# -------------------------------------------------------------
# 4. Institution Onboarding & Field Mapping Endpoints
# -------------------------------------------------------------

@router.get("/institutions", response_model=List[InstitutionOut])
def list_institutions(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Lists registered financial institutions."""
    return crud.get_institutions(db, skip=skip, limit=limit)

@router.post("/institutions", response_model=InstitutionOut)
def register_institution(
    req: InstitutionCreate,
    db: Session = Depends(get_db)
):
    """Registers a new bank or fintech institution into the SentinelPay platform."""
    existing = crud.get_institution_by_code(db, req.institution_code)
    if existing:
        raise HTTPException(status_code=409, detail=f"Institution code '{req.institution_code}' already exists")

    inst = crud.create_institution(
        db=db,
        name=req.name,
        institution_code=req.institution_code,
        institution_type=req.institution_type,
        environment=req.environment
    )

    # Automatically generate default sandbox API credentials
    demo_key = f"{req.institution_code.lower()}_sandbox_key_{int(datetime.now().timestamp()) % 100000}"
    client_id = f"sp_{req.institution_code.lower()}_client_01"
    crud.create_api_credential(db, institution_id=inst.id, client_id=client_id, api_key=demo_key)

    return inst

@router.get("/institutions/{code}/field-mappings")
def get_institution_mappings(code: str, db: Session = Depends(get_db)):
    """Retrieves dynamic schema field mappings for an institution."""
    inst = crud.get_institution_by_code(db, code)
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return crud.get_field_mappings_for_institution(db, inst.id)

@router.post("/institutions/{code}/field-mappings")
def add_institution_mapping(
    code: str,
    req: FieldMappingCreate,
    db: Session = Depends(get_db)
):
    """Creates or updates a field normalization mapping for an institution."""
    inst = crud.get_institution_by_code(db, code)
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    m = crud.set_field_mapping(db, inst.id, req.source_field, req.sentinelpay_field)
    return {
        "status": "success",
        "institution_code": code,
        "source_field": m.source_field,
        "sentinelpay_field": m.sentinelpay_field
    }

# -------------------------------------------------------------
# 5. Audit Logging Trail
# -------------------------------------------------------------

@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_trail(
    institution_id: Optional[int] = Query(None, description="Filter logs by institution ID"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Retrieves immutable audit trail for compliance and security forensics."""
    return crud.get_audit_logs(db, institution_id=institution_id, skip=skip, limit=limit)
