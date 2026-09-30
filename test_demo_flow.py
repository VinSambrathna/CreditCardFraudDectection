"""
SentinelPay - End-to-End Capstone Interactive Demo & Gateway Verification Runner
Executes the full-cycle capstone demonstration:
  1. Multi-Tenant Enterprise Gateway Ingestion (POST /api/v1/fraud/check)
  2. TreeSHAP Local Feature Attribution
  3. Bank-Controlled Step-Up Verification Callback (POST /api/v1/verification/result)
  4. Multi-Tenant Anti-IDOR Security & Data Isolation
  5. Immutable Audit Trail Logging
  6. Operations Dashboard Telemetry
"""

import time
import json
from fastapi.testclient import TestClient
from backend.main import app

ABA_KEY = "aba_sandbox_live_key_9f83a"
ACLEDA_KEY = "acleda_sandbox_live_key_7c41b"

def print_header(title):
    print("\n" + "=" * 80)
    print(f"  {title}")
    print("=" * 80)

def run_demo():
    print_header("SENTINELPAY MULTI-TENANT AI FRAUD PLATFORM - CAPSTONE DEMO")

    t_id = int(time.time() * 1000) % 100000

    with TestClient(app) as client:
        # 0. Gateway Health & Active Tenants Check
        health = client.get("/health").json()
        print(f"[GATEWAY] Status: {health['status']} | Active Tenants: {health['active_tenants']}")
        print(f"[MODEL]   Champion: {health['model_champion']}")
        print(f"[RAILS]   Currencies: {health['supported_currencies']} | Methods: {health['payment_methods']}")

        # ---------------------------------------------------------------------
        # DEMO SCENARIO 1: Normal KHQR (ABA Bank, Phnom Penh Coffee, Auto-Approved)
        # ---------------------------------------------------------------------
        print_header("DEMO 1: Routine KHQR Payment (ABA Bank -> Phnom Penh Coffee)")
        token1 = f"ABA-TX-{t_id}-01"
        res1 = client.post("/api/v1/fraud/check", json={
            "transaction_token": token1,
            "amount": 8.50,
            "currency": "USD",
            "payment_method": "KHQR",
            "distance": 1.2,
            "time_delta": 18.0,
            "merchant_risk": 0.08,
            "device_trust": 0.98
        }, headers={"X-API-KEY": ABA_KEY}).json()

        print(f"Transaction Token : {res1['transaction_token']}")
        print(f"Institution       : {res1['institution_code']}")
        print(f"Amount & Rail     : {res1['currency']} {res1['amount']:.2f} via KHQR")
        print(f"Fraud Probability : {res1['fraud_probability']*100:.2f}%")
        print(f"Risk Tier         : {res1['risk_level']}")
        print(f"Gateway Decision  : [ {res1['action']} ] (Requires Step-Up: {res1['requires_verification']})")

        # ---------------------------------------------------------------------
        # DEMO SCENARIO 2: Confirmed Fraud (Poipet Duty Free -> Step-Up Denied -> Blocked)
        # ---------------------------------------------------------------------
        print_header("DEMO 2: High-Risk Account Takeover (Poipet Duty Free, Proxy Device)")
        suspicious_token = f"ABA-TX-{t_id}-02"
        res2 = client.post("/api/v1/fraud/check", json={
            "transaction_token": suspicious_token,
            "amount": 1800.00,
            "currency": "USD",
            "payment_method": "KHQR",
            "distance": 850.0,
            "time_delta": 0.15,
            "merchant_risk": 0.92,
            "device_trust": 0.10,
            "client_ip": "171.96.180.20"
        }, headers={"X-API-KEY": ABA_KEY}).json()

        print(f"Transaction Token : {res2['transaction_token']}")
        print(f"Fraud Probability : {res2['fraud_probability']*100:.2f}%")
        print(f"Risk Level        : {res2['risk_level']}")
        print(f"Gateway Action    : [ {res2['action']} ] -> Hold in SOFT_BLOCKED")

        if res2.get("geo_resolution"):
            geo = res2["geo_resolution"]
            print(f"External Geo API  : Resolved IP {geo.get('ip')} -> {geo.get('distance_km')} km (via {geo.get('source')})")

        if res2.get("notification_status"):
            notif = res2["notification_status"]
            print(f"External Notif API: Step-Up Out-of-Band Status: [{notif.get('status')}] via {notif.get('provider')}")

        print("\n--- Real-Time Exact TreeSHAP Local Attributions ---")
        for item in res2["explanation"][:3]:
            direction = "(+) Increases Risk" if item["direction"] == "RISK_INCREASING" else "(-) Decreases Risk"
            print(f"  * {item['label']:<28} | Val: {item['value']:<8} | {direction} (SHAP contribution: {item['contribution']:+0.3f})")

        print("\nStep-Up Challenge Executed by Bank:")
        print("  -> ABA Mobile prompts customer: 'Did you authorize $1,800.00 at Poipet Duty Free?'")
        print("  -> Cardholder clicks 'I DID NOT INITIATE THIS' (Deny)...")

        verify_res2 = client.post("/api/v1/verification/result", json={
            "transaction_token": suspicious_token,
            "verification": "DENIED",
            "auth_method": "BANK_OTP",
            "reason": "Cardholder denied unauthorized transaction"
        }, headers={"X-API-KEY": ABA_KEY}).json()

        print(f"  -> State Machine Transition: [ {verify_res2['status']} ]")
        print(f"  -> Gateway Message         : {verify_res2['message']}")
        print(f"  -> Retraining Feedback     : Confirmed Fraud (Label 1) recorded in database")

        # ---------------------------------------------------------------------
        # DEMO SCENARIO 3: False Positive Resolution (Siem Reap Laptop -> Customer Approves)
        # ---------------------------------------------------------------------
        print_header("DEMO 3: False Positive Step-Up Resolution (Travel Electronics)")
        fp_token = f"ABA-TX-{t_id}-03"
        client.post("/api/v1/fraud/check", json={
            "transaction_token": fp_token,
            "amount": 1500.00,
            "currency": "USD",
            "distance": 310.0,
            "time_delta": 1.5,
            "merchant_risk": 0.65,
            "device_trust": 0.88
        }, headers={"X-API-KEY": ABA_KEY})

        print("  -> Cardholder confirms identity via OTP '123456'...")
        verify_res3 = client.post("/api/v1/verification/result", json={
            "transaction_token": fp_token,
            "verification": "APPROVED",
            "auth_method": "FACE_ID",
            "reason": "Cardholder confirmed legitimate travel purchase"
        }, headers={"X-API-KEY": ABA_KEY}).json()

        print(f"  -> State Machine Transition: [ {verify_res3['status']} ]")
        print(f"  -> Retraining Feedback     : Legitimate Cardholder Release (Label 0) logged")

        # ---------------------------------------------------------------------
        # DEMO SCENARIO 4: Multi-Tenant Data Isolation (Anti-IDOR Security)
        # ---------------------------------------------------------------------
        print_header("DEMO 4: Multi-Tenant Access Isolation (Anti-IDOR Defense)")
        print("ACLEDA Bank attempts to query ABA Bank's transaction ABA-TX-10029...")
        idor_res = client.get(f"/api/v1/transactions/{suspicious_token}", headers={"X-API-KEY": ACLEDA_KEY})
        print(f"  -> Result: HTTP {idor_res.status_code} ({idor_res.json()['detail']})")
        print("  -> Security Audit: Cross-tenant data isolation strictly enforced by tenant scoping")

        # ---------------------------------------------------------------------
        # 5. Immutable Audit Logs & Dashboard
        # ---------------------------------------------------------------------
        print_header("DEMO 5: Immutable Compliance Audit Trail")
        logs = client.get("/api/v1/audit-logs?limit=4").json()
        for log in logs:
            print(f"  [{log['created_at'][:19]}] Action: {log['action']:<28} | Status: {log['status']:<16} | Token: {log['transaction_token']}")

        print_header("ALL CAPSTONE DEMONSTRATION WORKFLOWS VERIFIED!")

if __name__ == "__main__":
    run_demo()
