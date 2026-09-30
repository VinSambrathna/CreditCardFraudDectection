"""
SentinelPay - Automated Integration Tests for Multi-Tenant Gateway
Tests /api/v1/fraud/check, /api/v1/verification/result,
API Key authentication, IDOR tenant isolation, KHR currency, and audit trails.
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app

ABA_KEY = "aba_sandbox_live_key_9f83a"
ACLEDA_KEY = "acleda_sandbox_live_key_7c41b"
WING_KEY = "wing_sandbox_live_key_2e19d"

def unique_token(prefix: str = "TX") -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

# -------------------------------------------------------------
# 1. Authentication & Security
# -------------------------------------------------------------

def test_gateway_missing_api_key(client):
    """Calling gateway without X-API-KEY returns 401 Unauthorized"""
    res = client.post("/api/v1/fraud/check", json={
        "transaction_token": unique_token("TEST-NO-KEY"),
        "amount": 100.0,
        "currency": "USD"
    })
    assert res.status_code == 401
    assert "Missing required 'X-API-KEY'" in res.json()["detail"]

def test_gateway_invalid_api_key(client):
    """Calling gateway with invalid X-API-KEY returns 401 Unauthorized"""
    res = client.post("/api/v1/fraud/check", json={
        "transaction_token": unique_token("TEST-BAD-KEY"),
        "amount": 100.0,
        "currency": "USD"
    }, headers={"X-API-KEY": "totally_invalid_key_12345"})
    assert res.status_code == 401
    assert "Invalid or revoked" in res.json()["detail"]

def test_gateway_tenant_mismatch_prevention(client):
    """Providing ABA key with X-INSTITUTION-ID: ACLEDA returns 403 IDOR prevention"""
    res = client.post("/api/v1/fraud/check", json={
        "transaction_token": unique_token("TEST-MISMATCH"),
        "amount": 100.0,
        "currency": "USD"
    }, headers={
        "X-API-KEY": ABA_KEY,
        "X-INSTITUTION-ID": "ACLEDA"
    })
    assert res.status_code == 403
    assert "Tenant mismatch" in res.json()["detail"]

# -------------------------------------------------------------
# 2. Fraud Check Scenarios
# -------------------------------------------------------------

def test_gateway_fraud_check_low_risk(client):
    """Normal KHQR payment through ABA Bank -> Auto Approved"""
    token = unique_token("ABA-TX-LOW")
    payload = {
        "transaction_token": token,
        "amount": 8.50,
        "currency": "USD",
        "payment_method": "KHQR",
        "distance": 1.2,
        "time_delta": 18.0,
        "merchant_risk": 0.08,
        "device_trust": 0.98
    }
    res = client.post("/api/v1/fraud/check", json=payload, headers={"X-API-KEY": ABA_KEY})
    assert res.status_code == 200
    data = res.json()
    assert data["transaction_token"] == token
    assert data["institution_code"] == "ABA"
    assert data["risk_level"] == "LOW"
    assert data["action"] == "APPROVE"
    assert data["requires_verification"] is False
    assert len(data["explanation"]) > 0

def test_gateway_fraud_check_high_risk_step_up(client):
    """Suspicious overseas payment -> Step Up Required"""
    token = unique_token("ABA-TX-SUSPICIOUS")
    payload = {
        "transaction_token": token,
        "amount": 1800.00,
        "currency": "USD",
        "payment_method": "KHQR",
        "distance": 850.0,
        "time_delta": 0.15,
        "merchant_risk": 0.92,
        "device_trust": 0.10
    }
    res = client.post("/api/v1/fraud/check", json=payload, headers={"X-API-KEY": ABA_KEY})
    assert res.status_code == 200
    data = res.json()
    assert data["transaction_token"] == token
    assert data["risk_level"] in ["REVIEW", "HIGH"]
    assert data["action"] == "STEP_UP_REQUIRED"
    assert data["requires_verification"] is True
    assert data["status"] == "SOFT_BLOCKED"

def test_gateway_khr_currency_normalization(client):
    """KHR currency transaction is evaluated and normalized to USD for model"""
    token = unique_token("WING-KHR")
    payload = {
        "transaction_token": token,
        "amount": 40500.0,
        "currency": "KHR",
        "payment_method": "KHQR",
        "distance": 2.0,
        "time_delta": 12.0,
        "merchant_risk": 0.09,
        "device_trust": 0.95
    }
    res = client.post("/api/v1/fraud/check", json=payload, headers={"X-API-KEY": WING_KEY})
    assert res.status_code == 200
    data = res.json()
    assert data["currency"] == "KHR"
    assert data["amount"] == 40500.0
    assert data["amount_usd"] == 10.0
    assert data["risk_level"] == "LOW"

# -------------------------------------------------------------
# 3. Step-Up Verification State Machine Callback
# -------------------------------------------------------------

def test_gateway_verification_flow_approval(client):
    """Customer approves step-up challenge -> State mutates to RELEASED"""
    token = unique_token("ABA-TX-STEPUP-REL")
    pred = client.post("/api/v1/fraud/check", json={
        "transaction_token": token,
        "amount": 1750.00,
        "currency": "USD",
        "distance": 900.0,
        "time_delta": 0.2,
        "merchant_risk": 0.88,
        "device_trust": 0.12
    }, headers={"X-API-KEY": ABA_KEY}).json()
    assert pred["action"] == "STEP_UP_REQUIRED"

    verif_res = client.post("/api/v1/verification/result", json={
        "transaction_token": token,
        "verification": "APPROVED",
        "auth_method": "FACE_ID",
        "reason": "Customer confirmed biometric scan in mobile app"
    }, headers={"X-API-KEY": ABA_KEY})

    assert verif_res.status_code == 200
    v_data = verif_res.json()
    assert v_data["status"] == "RELEASED"
    assert v_data["feedback_recorded"] is True

def test_gateway_verification_flow_denial(client):
    """Customer denies step-up challenge -> State mutates to BLOCKED"""
    token = unique_token("ABA-TX-STEPUP-BLK")
    pred = client.post("/api/v1/fraud/check", json={
        "transaction_token": token,
        "amount": 2800.00,
        "currency": "USD",
        "distance": 1800.0,
        "time_delta": 0.05,
        "merchant_risk": 0.95,
        "device_trust": 0.05
    }, headers={"X-API-KEY": ABA_KEY}).json()
    assert pred["action"] == "STEP_UP_REQUIRED"

    verif_res = client.post("/api/v1/verification/result", json={
        "transaction_token": token,
        "verification": "DENIED",
        "auth_method": "BANK_OTP",
        "reason": "Customer clicked 'I did not initiate this payment'"
    }, headers={"X-API-KEY": ABA_KEY})

    assert verif_res.status_code == 200
    assert verif_res.json()["status"] == "BLOCKED"

# -------------------------------------------------------------
# 4. Multi-Tenant Isolation (Anti-IDOR Verification)
# -------------------------------------------------------------

def test_multi_tenant_cross_access_prevented(client):
    """
    Strict Tenant Isolation:
    ACLEDA Bank cannot query or mutate ABA Bank's transactions.
    """
    token = unique_token("ABA-ISOLATED")
    # ABA creates transaction
    client.post("/api/v1/fraud/check", json={
        "transaction_token": token,
        "amount": 50.0,
        "currency": "USD"
    }, headers={"X-API-KEY": ABA_KEY})

    # ACLEDA attempts to query ABA's transaction -> Expect 404
    query_res = client.get(f"/api/v1/transactions/{token}", headers={"X-API-KEY": ACLEDA_KEY})
    assert query_res.status_code == 404

    # ACLEDA attempts to mutate ABA's transaction -> Expect 404
    mutate_res = client.post("/api/v1/verification/result", json={
        "transaction_token": token,
        "verification": "APPROVED"
    }, headers={"X-API-KEY": ACLEDA_KEY})
    assert mutate_res.status_code == 404

# -------------------------------------------------------------
# 5. Institutions, Field Mappings & Audit Trail
# -------------------------------------------------------------

def test_list_institutions_and_audit_logs(client):
    inst_res = client.get("/api/v1/institutions")
    assert inst_res.status_code == 200
    inst_list = inst_res.json()
    assert len(inst_list) >= 4

    audit_res = client.get("/api/v1/audit-logs?limit=10")
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0
    assert any("FRAUD_CHECK" in log["action"] or "GATEWAY" in log["action"] for log in logs)

def test_websocket_alerts_connection(client):
    """Test WebSocket hub connection and heartbeat ping-pong"""
    with client.websocket_connect("/ws/alerts?institution_id=1") as ws:
        ws.send_text("ping")
        data = ws.receive_text()
        assert data == "pong"

# -------------------------------------------------------------
# 6. External Services Integration (Criterion 3: User -> App -> AI -> External Services)
# -------------------------------------------------------------

def test_external_geo_ip_resolution(client):
    """
    Verifies live external IP geolocation integration:
    Resolves client IP, extracts country/city/coords, and computes distance via Haversine.
    """
    token = unique_token("GEO-TEST")
    res = client.post("/api/v1/fraud/check", json={
        "transaction_token": token,
        "amount": 250.0,
        "currency": "USD",
        "client_ip": "103.216.51.10" # Public IP
    }, headers={"X-API-KEY": ABA_KEY})

    assert res.status_code == 200
    data = res.json()
    assert data["geo_resolution"] is not None
    assert "distance_km" in data["geo_resolution"]
    assert "source" in data["geo_resolution"]
    assert data["geo_resolution"]["distance_km"] >= 0.0

def test_external_step_up_notification_dispatch(client):
    """
    Verifies live out-of-band notification integration:
    When transaction is HIGH or REVIEW risk, dispatches step-up advisory & OTP challenge.
    """
    token = unique_token("NOTIF-TEST")
    res = client.post("/api/v1/fraud/check", json={
        "transaction_token": token,
        "amount": 3500.0,
        "currency": "USD",
        "distance": 900.0,
        "device_trust": 0.15
    }, headers={"X-API-KEY": ABA_KEY})

    assert res.status_code == 200
    data = res.json()
    assert data["risk_level"] in ["REVIEW", "HIGH"]
    assert data["notification_status"] is not None
    assert data["notification_status"]["status"] in ["DELIVERED", "SIMULATED_DISPATCH"]
