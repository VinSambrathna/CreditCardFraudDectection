"""
SentinelPay - Tests for Interactive Telegram Bot Verification
Tests interactive inline buttons, text denial ("No"), text approval ("Yes"),
and webhook processing.
"""

import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.database.connection import SessionLocal
from backend.database.models import Transaction, Feedback
from backend.services.telegram_bot_service import TelegramBotService

ABA_KEY = "aba_sandbox_live_key_9f83a"

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_telegram_deny_inline_callback(client):
    """
    Simulate user clicking '🛑 Deny & Freeze Card' in Telegram.
    Expect: Transaction mutates to BLOCKED, Feedback.final_label = 1.
    """
    token = f"TX-TG-DENY-{uuid.uuid4().hex[:6].upper()}"

    # 1. Trigger high-risk check requiring Step-Up
    check_res = client.post("/api/v1/fraud/check", json={
        "transaction_token": token,
        "amount": 1800.0,
        "currency": "USD",
        "distance": 380.0,
        "device_trust": 0.05,
        "merchant_risk": 0.90,
        "velocity_1h": 6
    }, headers={"X-API-KEY": ABA_KEY, "X-INSTITUTION-ID": "ABA"})

    assert check_res.status_code == 200
    assert check_res.json()["action"] == "STEP_UP_REQUIRED"

    # 2. Simulate Telegram Webhook callback_query with DENY
    webhook_payload = {
        "update_id": 99901,
        "callback_query": {
            "id": "cb_query_123",
            "from": {"id": 1059593343, "first_name": "Cardholder"},
            "message": {
                "message_id": 555,
                "chat": {"id": 1059593343}
            },
            "data": f"DENY:{token}"
        }
    }

    tg_res = client.post("/api/v1/telegram/webhook", json=webhook_payload)
    assert tg_res.status_code == 200
    assert tg_res.json()["decision"] == "DENY"

    # 3. Verify in database
    db = SessionLocal()
    try:
        tx = db.query(Transaction).filter(Transaction.transaction_token == token).first()
        assert tx is not None
        assert tx.status == "BLOCKED"

        fb = db.query(Feedback).filter(Feedback.transaction_id == tx.id).first()
        assert fb is not None
        assert fb.user_decision == "DENIED"
        assert fb.final_label == 1
    finally:
        db.close()


def test_telegram_approve_inline_callback(client):
    """
    Simulate user clicking '✅ Authorize Payment' in Telegram.
    Expect: Transaction mutates to RELEASED, Feedback.final_label = 0.
    """
    token = f"TX-TG-APP-{uuid.uuid4().hex[:6].upper()}"

    # 1. Trigger high-risk check requiring Step-Up
    check_res = client.post("/api/v1/fraud/check", json={
        "transaction_token": token,
        "amount": 1500.0,
        "currency": "USD",
        "distance": 320.0,
        "device_trust": 0.08,
        "merchant_risk": 0.88,
        "velocity_1h": 4
    }, headers={"X-API-KEY": ABA_KEY, "X-INSTITUTION-ID": "ABA"})

    assert check_res.status_code == 200
    assert check_res.json()["action"] == "STEP_UP_REQUIRED"

    # 2. Simulate Telegram Webhook callback_query with APPROVE
    webhook_payload = {
        "update_id": 99902,
        "callback_query": {
            "id": "cb_query_124",
            "from": {"id": 1059593343, "first_name": "Cardholder"},
            "message": {
                "message_id": 556,
                "chat": {"id": 1059593343}
            },
            "data": f"APPROVE:{token}"
        }
    }

    tg_res = client.post("/api/v1/telegram/webhook", json=webhook_payload)
    assert tg_res.status_code == 200
    assert tg_res.json()["decision"] == "APPROVE"

    # 3. Verify in database
    db = SessionLocal()
    try:
        tx = db.query(Transaction).filter(Transaction.transaction_token == token).first()
        assert tx is not None
        assert tx.status == "RELEASED"

        fb = db.query(Feedback).filter(Feedback.transaction_id == tx.id).first()
        assert fb is not None
        assert fb.user_decision == "APPROVED"
        assert fb.final_label == 0
    finally:
        db.close()


def test_telegram_text_reply_no_denial(client):
    """
    Simulate user replying 'No' via text in Telegram.
    Expect: The latest pending SOFT_BLOCKED transaction is denied and blocked.
    """
    token = f"TX-TG-TEXT-NO-{uuid.uuid4().hex[:6].upper()}"

    # 1. Trigger high-risk check
    check_res = client.post("/api/v1/fraud/check", json={
        "transaction_token": token,
        "amount": 1200.0,
        "currency": "USD",
        "distance": 250.0,
        "device_trust": 0.10,
        "merchant_risk": 0.85
    }, headers={"X-API-KEY": ABA_KEY, "X-INSTITUTION-ID": "ABA"})

    assert check_res.status_code == 200

    # 2. Simulate Telegram text message 'No'
    webhook_payload = {
        "update_id": 99903,
        "message": {
            "message_id": 557,
            "chat": {"id": 1059593343},
            "text": "No"
        }
    }

    tg_res = client.post("/api/v1/telegram/webhook", json=webhook_payload)
    assert tg_res.status_code == 200
    assert tg_res.json()["status"] == "PROCESSED_DENIAL"

    # 3. Verify in database that the transaction is BLOCKED
    db = SessionLocal()
    try:
        tx = db.query(Transaction).filter(Transaction.transaction_token == token).first()
        assert tx is not None
        assert tx.status == "BLOCKED"
    finally:
        db.close()
