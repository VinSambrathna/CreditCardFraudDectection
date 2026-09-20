"""
SentinelPay - Threshold Sweep & Operational Risk Calibration
Evaluates the champion model across decision thresholds from 0.15 to 0.85,
computing Precision, Recall, F1, FPR, FNR, and recommending operational tiers.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score

FEATURES = [
    "amount", "distance", "time_delta", "merchant_risk",
    "device_trust", "velocity_1h", "velocity_24h", "hour_of_day", "is_weekend"
]
TARGET = "is_fraud"

def run_threshold_analysis():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, "models")
    test_path = os.path.join(base_dir, "data", "processed", "test_split.csv")

    model = joblib.load(os.path.join(models_dir, "fraud_model.pkl"))
    scaler = joblib.load(os.path.join(models_dir, "preprocessor.pkl"))

    df_test = pd.read_csv(test_path)
    X_test = df_test[FEATURES]
    y_test = df_test[TARGET]

    X_test_scaled = scaler.transform(X_test)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]

    thresholds = [0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.50, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85]
    sweep_results = []

    total_actual_fraud = int(y_test.sum())
    total_actual_legit = int(len(y_test) - total_actual_fraud)

    print("=" * 95)
    print("SENTINELPAY OPERATIONAL THRESHOLD ANALYSIS (SWEEP)")
    print("=" * 95)
    print(f"{'Threshold':<10} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'FPR (%)':<10} | {'FNR (%)':<10} | {'Action Tier'}")
    print("-" * 95)

    for th in thresholds:
        y_pred = (y_prob >= th).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        fpr = (fp / total_actual_legit) * 100
        fnr = (fn / total_actual_fraud) * 100

        tier = "LOW (Auto-Approve)" if th < 0.35 else ("REVIEW (Soft Block/MFA)" if th < 0.70 else "HIGH (Immediate Block/MFA)")

        sweep_results.append({
            "threshold": th,
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "fpr_pct": round(float(fpr), 2),
            "fnr_pct": round(float(fnr), 2),
            "tp": int(tp),
            "fp": int(fp),
            "tn": int(tn),
            "fn": int(fn),
            "tier": tier
        })

        print(f"{th:<10.2f} | {prec:<10.4f} | {rec:<10.4f} | {f1:<10.4f} | {fpr:<10.2f} | {fnr:<10.2f} | {tier}")

    print("=" * 95)

    # Operational Decision Threshold Recommendations
    operational_config = {
        "recommended_thresholds": {
            "low_risk_ceiling": 0.35,     # Below 0.35 -> APPROVED automatically
            "high_risk_floor": 0.70       # Above 0.70 -> SOFT_BLOCKED / Step-up MFA
        },
        "threshold_sweep": sweep_results,
        "test_population": {
            "total": len(y_test),
            "legitimate": total_actual_legit,
            "fraudulent": total_actual_fraud
        }
    }

    out_path = os.path.join(models_dir, "threshold_analysis.json")
    with open(out_path, "w") as f:
        json.dump(operational_config, f, indent=2)

    print(f"\nSaved threshold calibration to: {out_path}")

if __name__ == "__main__":
    run_threshold_analysis()
