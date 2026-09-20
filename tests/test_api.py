"""
SentinelPay - Automated Integration Tests for FastAPI Endpoints
Tests /health, /predict, /verify, /transactions, /dashboard/statistics, /model/info.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

@pytest.fixture(scope="module")
def client():
    # Using context manager activates the FastAPI lifespan handler (creates tables and seeds demo data)
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "XGBoost" in data["model_champion"]

def test_predict_low_risk(client):
    payload = {
        "user_id": 1001,
        "amount": 25.00,
        "distance": 3.5,
        "time_delta": 24.0,
        "merchant_risk": 0.08,
        "device_trust": 0.98,
        "velocity_1h": 1,
        "velocity_24h": 2,
        "hour_of_day": 14,
        "is_weekend": 0
    }
    response = client.post("/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "transaction_id" in data
    assert data["risk_level"] == "LOW"
    assert data["status"] == "APPROVED"
    assert data["requires_verification"] is False
    assert len(data["explanation"]) > 0

def test_predict_and_verify_high_risk_approve(client):
    payload = {
        "user_id": 1001,
        "amount": 1850.00,
        "distance": 920.0,
        "time_delta": 0.10,
        "merchant_risk": 0.89,
        "device_trust": 0.08,
        "velocity_1h": 4,
        "velocity_24h": 8,
        "hour_of_day": 3,
        "is_weekend": 1
    }
    pred_res = client.post("/predict", json=payload)
    assert pred_res.status_code == 200
    pred_data = pred_res.json()
    token = pred_data["transaction_id"]

    assert pred_data["risk_level"] in ["REVIEW", "HIGH"]
    assert pred_data["status"] == "SOFT_BLOCKED"
    assert pred_data["requires_verification"] is True

    # Now verify with simulated MFA approval
    verify_res = client.post("/verify", json={
        "transaction_token": token,
        "otp_code": "123456",
        "action": "APPROVE"
    })
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["status"] == "VERIFIED"
    assert verify_data["feedback_recorded"] is True

def test_predict_and_verify_high_risk_deny(client):
    payload = {
        "user_id": 1002,
        "amount": 2500.00,
        "distance": 1400.0,
        "time_delta": 0.05,
        "merchant_risk": 0.95,
        "device_trust": 0.05
    }
    pred_res = client.post("/predict", json=payload)
    assert pred_res.status_code == 200
    token = pred_res.json()["transaction_id"]

    # Deny transaction
    verify_res = client.post("/verify", json={
        "transaction_token": token,
        "otp_code": "123456",
        "action": "DENY"
    })
    assert verify_res.status_code == 200
    assert verify_res.json()["status"] == "BLOCKED"

def test_list_and_detail_transactions(client):
    res = client.get("/transactions?limit=5")
    assert res.status_code == 200
    txs = res.json()
    assert len(txs) > 0

    first_token = txs[0]["transaction_token"]
    detail_res = client.get(f"/transactions/{first_token}")
    assert detail_res.status_code == 200
    assert detail_res.json()["transaction_token"] == first_token

def test_dashboard_statistics(client):
    res = client.get("/dashboard/statistics")
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "risk_distribution" in data
    assert data["summary"]["total_transactions"] > 0

def test_model_info(client):
    res = client.get("/model/info")
    assert res.status_code == 200
    data = res.json()
    assert "model_metadata" in data
    assert "performance_metrics" in data
    assert "global_feature_importance" in data
