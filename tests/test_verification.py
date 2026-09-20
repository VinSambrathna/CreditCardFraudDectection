"""
SentinelPay - Step-Up Verification & Edge Case Automated Tests
Tests verification states, OTP code validations, negative amounts,
missing fields, boundary conditions, and state machine transitions.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_verification_workflow_approval(client):
    """Scenario: High risk -> Soft block -> Valid OTP approval -> Verified"""
    pred_res = client.post("/predict", json={
        "user_id": 1001,
        "amount": 1750.00,
        "distance": 850.0,
        "time_delta": 0.2,
        "merchant_risk": 0.85,
        "device_trust": 0.15
    })
    assert pred_res.status_code == 200
    token = pred_res.json()["transaction_id"]
    assert pred_res.json()["status"] == "SOFT_BLOCKED"

    # Submit valid OTP approval
    verify_res = client.post("/verify", json={
        "transaction_token": token,
        "otp_code": "123456",
        "action": "APPROVE"
    })
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "VERIFIED"
    assert verify_res.json()["feedback_recorded"] is True

    # Attempting to re-verify an already verified transaction should be rejected or idempotent
    re_verify = client.post("/verify", json={
        "transaction_token": token,
        "otp_code": "123456",
        "action": "APPROVE"
    })
    assert re_verify.status_code == 200
    assert re_verify.json()["feedback_recorded"] is False

def test_verification_workflow_denial(client):
    """Scenario: High risk -> Soft block -> Cardholder denies -> Permanently Blocked"""
    pred_res = client.post("/predict", json={
        "user_id": 1002,
        "amount": 2800.00,
        "distance": 1800.0,
        "time_delta": 0.05,
        "merchant_risk": 0.92,
        "device_trust": 0.05
    })
    token = pred_res.json()["transaction_id"]

    verify_res = client.post("/verify", json={
        "transaction_token": token,
        "otp_code": "123456",
        "action": "DENY"
    })
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "BLOCKED"
    assert verify_res.json()["feedback_recorded"] is True

def test_invalid_otp_code_length(client):
    """OTP code must be 6 digits"""
    pred_res = client.post("/predict", json={
        "user_id": 1001,
        "amount": 1600.00,
        "distance": 750.0,
        "time_delta": 0.1,
        "merchant_risk": 0.8,
        "device_trust": 0.1
    })
    token = pred_res.json()["transaction_id"]

    bad_otp_res = client.post("/verify", json={
        "transaction_token": token,
        "otp_code": "12", # Invalid: too short
        "action": "APPROVE"
    })
    assert bad_otp_res.status_code == 400
    assert "Invalid verification code" in bad_otp_res.json()["detail"]

def test_nonexistent_transaction_token(client):
    """Verifying an unknown transaction returns 404"""
    res = client.post("/verify", json={
        "transaction_token": "TX_NONEXISTENT_99999",
        "otp_code": "123456",
        "action": "APPROVE"
    })
    assert res.status_code == 404

# =========================================================================
# EDGE CASE VALIDATIONS
# =========================================================================

def test_edge_case_negative_amount(client):
    """Negative amount should fail Pydantic validation (422)"""
    res = client.post("/predict", json={
        "user_id": 1001,
        "amount": -50.00,
        "distance": 5.0,
        "time_delta": 10.0,
        "merchant_risk": 0.1,
        "device_trust": 0.9
    })
    assert res.status_code == 422

def test_edge_case_zero_amount(client):
    """Zero amount should fail Pydantic validation (422)"""
    res = client.post("/predict", json={
        "user_id": 1001,
        "amount": 0.00,
        "distance": 5.0,
        "time_delta": 10.0,
        "merchant_risk": 0.1,
        "device_trust": 0.9
    })
    assert res.status_code == 422

def test_edge_case_invalid_risk_bounds(client):
    """Merchant risk and device trust must be between 0.0 and 1.0"""
    res_high_risk = client.post("/predict", json={
        "user_id": 1001,
        "amount": 100.00,
        "distance": 5.0,
        "time_delta": 10.0,
        "merchant_risk": 1.5, # Exceeds 1.0
        "device_trust": 0.9
    })
    assert res_high_risk.status_code == 422

    res_negative_trust = client.post("/predict", json={
        "user_id": 1001,
        "amount": 100.00,
        "distance": 5.0,
        "time_delta": 10.0,
        "merchant_risk": 0.5,
        "device_trust": -0.2 # Below 0.0
    })
    assert res_negative_trust.status_code == 422

def test_edge_case_missing_required_fields(client):
    """Missing critical features fails validation"""
    res = client.post("/predict", json={
        "user_id": 1001,
        "amount": 100.00
        # Missing distance, time_delta, merchant_risk, device_trust
    })
    assert res.status_code == 422

def test_edge_case_extremely_large_amount(client):
    """Extremely large purchase should be safely processed and flagged as high risk"""
    res = client.post("/predict", json={
        "user_id": 1001,
        "amount": 950000.00,
        "distance": 25.0,
        "time_delta": 12.0,
        "merchant_risk": 0.5,
        "device_trust": 0.7
    })
    assert res.status_code == 200
    assert res.json()["risk_level"] in ["REVIEW", "HIGH"]
