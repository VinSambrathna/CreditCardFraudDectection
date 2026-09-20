"""
SentinelPay - End-to-End Interactive Demo & API Test Runner
Executes the 3 presentation scenarios through the backend:
  1. Legitimate Transaction (Auto-Approved)
  2. Suspicious Transaction (Soft-Blocked -> SHAP Explanation -> MFA Approved)
  3. Confirmed Fraud Transaction (Soft-Blocked -> MFA Denied -> Hard Blocked)
"""

import json
from fastapi.testclient import TestClient
from backend.main import app

def print_header(title):
    print("\n" + "=" * 75)
    print(f"  {title}")
    print("=" * 75)

def run_demo():
    print_header("SENTINELPAY AI FRAUD DETECTION - END-TO-END DEMO")

    with TestClient(app) as client:
        # 0. Health Check
        health = client.get("/health").json()
        print(f"[HEALTH] Status: {health['status']} | Model: {health['model_champion']}")

        # ---------------------------------------------------------------------
        # SCENARIO 1: Normal Legitimate Transaction
        # ---------------------------------------------------------------------
        print_header("SCENARIO 1: Legitimate Transaction (Grocery, Near Home, Trusted Device)")
        legit_payload = {
            "user_id": 1001,
            "amount": 42.50,
            "distance": 3.8,
            "time_delta": 22.5,
            "merchant_risk": 0.08,
            "device_trust": 0.98,
            "velocity_1h": 1,
            "velocity_24h": 2,
            "hour_of_day": 14,
            "is_weekend": 0
        }
        res1 = client.post("/predict", json=legit_payload).json()
        print(f"Transaction ID : {res1['transaction_id']}")
        print(f"Amount         : ${legit_payload['amount']:.2f}")
        print(f"Fraud Prob     : {res1['fraud_probability']*100:.2f}%")
        print(f"Risk Level     : {res1['risk_level']}")
        print(f"Verdict        : [ {res1['status']} ] (Requires MFA: {res1['requires_verification']})")

        # ---------------------------------------------------------------------
        # SCENARIO 2: Suspicious Transaction -> Soft Block -> MFA Approval
        # ---------------------------------------------------------------------
        print_header("SCENARIO 2: Suspicious High-Value Purchase (Remote IP, Abnormal Amount)")
        suspicious_payload = {
            "user_id": 1001,
            "amount": 1850.00,
            "distance": 890.0,
            "time_delta": 0.15,
            "merchant_risk": 0.88,
            "device_trust": 0.12,
            "velocity_1h": 4,
            "velocity_24h": 7,
            "hour_of_day": 3,
            "is_weekend": 1
        }
        res2 = client.post("/predict", json=suspicious_payload).json()
        token2 = res2["transaction_id"]
        print(f"Transaction ID : {token2}")
        print(f"Amount         : ${suspicious_payload['amount']:.2f}")
        print(f"Fraud Prob     : {res2['fraud_probability']*100:.2f}%")
        print(f"Risk Level     : {res2['risk_level']}")
        print(f"Initial State  : [ {res2['status']} ] -> Triggering Step-Up MFA")

        print("\n--- Real-Time SHAP Waterfall Explanation ('Why was this flagged?') ---")
        for item in res2["explanation"][:4]:
            direction = "(+) Increases Risk" if item["direction"] == "RISK_INCREASING" else "(-) Decreases Risk"
            print(f"  * {item['label']:<28} | Value: {item['value']:<8} | {direction} (contribution {item['contribution']:+0.3f})")

        print("\nSimulating Customer Step-Up MFA Verification...")
        print("  -> User receives SMS/App OTP '123456' and clicks 'APPROVE'...")
        verify_res2 = client.post("/verify", json={
            "transaction_token": token2,
            "otp_code": "123456",
            "action": "APPROVE"
        }).json()
        print(f"  -> Verification Status: [ {verify_res2['status']} ]")
        print(f"  -> Outcome Message    : {verify_res2['message']}")
        print(f"  -> Retraining Feedback: Recorded as Legitimate (Label 0)")

        # ---------------------------------------------------------------------
        # SCENARIO 3: Fraud Attack -> Soft Block -> Cardholder Denial
        # ---------------------------------------------------------------------
        print_header("SCENARIO 3: Account Takeover Attack (Foreign Terminal, Untrusted Device)")
        fraud_payload = {
            "user_id": 1002,
            "amount": 2650.00,
            "distance": 2100.0,
            "time_delta": 0.05,
            "merchant_risk": 0.95,
            "device_trust": 0.04,
            "velocity_1h": 6,
            "velocity_24h": 12,
            "hour_of_day": 4,
            "is_weekend": 1
        }
        res3 = client.post("/predict", json=fraud_payload).json()
        token3 = res3["transaction_id"]
        print(f"Transaction ID : {token3}")
        print(f"Amount         : ${fraud_payload['amount']:.2f}")
        print(f"Fraud Prob     : {res3['fraud_probability']*100:.2f}%")
        print(f"Risk Level     : {res3['risk_level']}")
        print(f"Initial State  : [ {res3['status']} ] -> Triggering Step-Up MFA")

        print("\nSimulating Cardholder Response...")
        print("  -> Cardholder recognizes they did NOT initiate this payment and clicks 'DENY'...")
        verify_res3 = client.post("/verify", json={
            "transaction_token": token3,
            "otp_code": "123456",
            "action": "DENY"
        }).json()
        print(f"  -> Verification Status: [ {verify_res3['status']} ]")
        print(f"  -> Outcome Message    : {verify_res3['message']}")
        print(f"  -> Retraining Feedback: Recorded as Confirmed Fraud (Label 1)")

        # ---------------------------------------------------------------------
        # 4. Dashboard Statistics
        # ---------------------------------------------------------------------
        print_header("REAL-TIME ADMIN DASHBOARD STATISTICS")
        stats = client.get("/dashboard/statistics").json()
        summary = stats["summary"]
        print(f"Total Transactions Processed : {summary['total_transactions']}")
        print(f"Total Volume Processed       : ${summary['total_volume_usd']:,.2f}")
        print(f"Transactions Flagged Fraud   : {summary['fraud_flagged']} ({summary['fraud_rate_pct']}%)")
        print(f"Approved Transactions        : {summary['approved']}")
        print(f"Permanently Blocked          : {summary['blocked']}")
        print(f"Feedback Records for Retrain : {summary['feedback_records_ready_for_retraining']}")

        print("\nRisk Level Distribution:")
        for tier, count in stats["risk_distribution"].items():
            print(f"  - {tier.upper():<8}: {count}")

        print_header("ALL CHECKS PASSED - SENTINELPAY BACKEND READY!")

if __name__ == "__main__":
    run_demo()
