"""
SentinelPay - Human-in-the-Loop Batch Retraining Cycle
Queries customer-resolved feedback events from the database,
augments the training corpus with verified labels,
retrains candidate models, and registers the next model version.
"""

import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from datetime import datetime, timezone

# Ensure project root is on sys.path for direct script execution
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from sklearn.preprocessing import RobustScaler
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
from sklearn.metrics import precision_score, recall_score, f1_score, average_precision_score
from backend.database.connection import SessionLocal
from backend.database.models import Feedback, Transaction, ModelVersion

FEATURES = [
    "amount", "distance", "time_delta", "merchant_risk",
    "device_trust", "velocity_1h", "velocity_24h", "hour_of_day", "is_weekend"
]
TARGET = "is_fraud"

def run_retraining_cycle():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    raw_data_path = os.path.join(base_dir, "data", "raw", "sentinelpay_benchmark_transactions.csv")
    test_path = os.path.join(base_dir, "data", "processed", "test_split.csv")
    models_dir = os.path.join(base_dir, "models")
    backend_ml_dir = os.path.join(base_dir, "..", "backend", "ml")

    print("=" * 75)
    print("SENTINELPAY HUMAN-IN-THE-LOOP BATCH RETRAINING CYCLE")
    print("=" * 75)

    db = SessionLocal()
    try:
        # Step 1: Query unconsumed feedback records
        feedback_records = db.query(Feedback).filter(Feedback.added_to_training == False).all()
        print(f"[1/5] Checking feedback database pool: Found {len(feedback_records)} newly verified records.")

        if not feedback_records:
            print("[INFO] No pending feedback records to process. Existing model remains champion.")
            return

        # Extract features and ground truth labels from cardholder actions
        feedback_data = []
        for fb in feedback_records:
            tx = fb.transaction
            if tx:
                # Attempt to extract exact feature values from explanation_json if present
                v1h, v24h, hod, wkd = 1.0, 2.0, 14.0, 0.0
                if tx.explanation_json:
                    try:
                        expl_items = json.loads(tx.explanation_json)
                        expl_map = {item["feature"]: item["value"] for item in expl_items}
                        v1h = expl_map.get("velocity_1h", v1h)
                        v24h = expl_map.get("velocity_24h", v24h)
                        hod = expl_map.get("hour_of_day", hod)
                        wkd = expl_map.get("is_weekend", wkd)
                    except Exception:
                        pass

                feedback_data.append({
                    "amount": tx.amount,
                    "distance": tx.distance,
                    "time_delta": tx.time_delta,
                    "merchant_risk": tx.merchant_risk,
                    "device_trust": tx.device_trust,
                    "velocity_1h": v1h,
                    "velocity_24h": v24h,
                    "hour_of_day": hod,
                    "is_weekend": wkd,
                    "is_fraud": fb.final_label
                })

        new_df = pd.DataFrame(feedback_data)
        legit_resolutions = (new_df["is_fraud"] == 0).sum()
        fraud_resolutions = (new_df["is_fraud"] == 1).sum()
        print(f"      - Legitimate cardholder releases (False Positive Corrections): {legit_resolutions}")
        print(f"      - Confirmed fraudulent attempts (True Positives Confirmed):    {fraud_resolutions}")

        # Step 2: Load historical training data and augment strictly on Train split
        print("[2/5] Augmenting base training split with verified human feedback...")
        base_df = pd.read_csv(raw_data_path)
        from sklearn.model_selection import train_test_split
        X_train, _, y_train, _ = train_test_split(
            base_df[FEATURES], base_df[TARGET], test_size=0.20, random_state=42, stratify=base_df[TARGET]
        )
        augmented_X = pd.concat([X_train, new_df[FEATURES]], ignore_index=True)
        augmented_y = pd.concat([y_train, new_df[TARGET]], ignore_index=True)
        print(f"      Base Train Split: {len(X_train)} records | New Feedback: {len(new_df)} records.")
        print(f"      Total Training Pool: {len(augmented_X)} records.")

        # Step 3: Train-only scaling and SMOTE
        print("[3/5] Applying RobustScaler and SMOTE balancing to augmented training fold...")
        scaler = RobustScaler()
        X_train_scaled = scaler.fit_transform(augmented_X)

        smote = SMOTE(sampling_strategy=0.25, random_state=42)
        X_resampled, y_resampled = smote.fit_resample(X_train_scaled, augmented_y)

        # Step 4: Retrain XGBoost Champion
        print("[4/5] Retraining XGBoost Champion with updated decision boundaries...")
        new_model = XGBClassifier(
            n_estimators=150,
            max_depth=5,
            learning_rate=0.07,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric="logloss"
        )
        new_model.fit(X_resampled, y_resampled)

        # Evaluate on untouched holdout test split
        df_test = pd.read_csv(test_path)
        X_test_scaled = scaler.transform(df_test[FEATURES])
        y_test = df_test[TARGET]

        y_prob = new_model.predict_proba(X_test_scaled)[:, 1]
        y_pred = (y_prob >= 0.50).astype(int)

        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred))
        f1 = float(f1_score(y_test, y_pred))
        pr_auc = float(average_precision_score(y_test, y_prob))

        print(f"      Holdout Test Results: Precision={prec:.4f} | Recall={rec:.4f} | F1={f1:.4f} | PR-AUC={pr_auc:.4f}")

        # Validation Quality Gate: Require high performance before production promotion
        if pr_auc < 0.95 or rec < 0.90:
            print(f"[WARN] Retrained model failed quality gate (PR-AUC={pr_auc:.4f}, Recall={rec:.4f}). Retaining current champion.")
            return

        # Step 5: Version Registry & Artifact Deployment
        print("[5/5] Registering new model version in database and updating artifacts...")
        # Deactivate old versions
        db.query(ModelVersion).update({ModelVersion.is_active: False})

        # Register new active version
        new_version_num = f"1.1.{len(feedback_records)}"
        mv = ModelVersion(
            model_name="SentinelPay XGBoost Classifier",
            version=new_version_num,
            precision=round(prec, 4),
            recall=round(rec, 4),
            f1_score=round(f1, 4),
            pr_auc=round(pr_auc, 4),
            trained_at=datetime.now(timezone.utc),
            is_active=True
        )
        db.add(mv)

        # Mark feedback records as consumed
        for fb in feedback_records:
            fb.added_to_training = True

        db.commit()

        # Update runtime model artifacts in backend/ml/
        joblib.dump(new_model, os.path.join(backend_ml_dir, "fraud_model.pkl"))
        joblib.dump(scaler, os.path.join(backend_ml_dir, "preprocessor.pkl"))

        # Trigger in-memory cache reload for active services
        try:
            from backend.services.prediction_service import PredictionService
            from backend.services.shap_service import ShapService
            PredictionService.reload()
            ShapService.reload()
            print("[INFO] Hot-reloaded in-memory PredictionService & TreeSHAP instances.")
        except Exception:
            pass

        print("\n" + "=" * 75)
        print(f"[SUCCESS] Retraining Complete! Promoted to Version {new_version_num}")
        print(f"Retraining Feedback Records Consumed: {len(feedback_records)}")
        print(f"Updated Runtime Model: {os.path.join(backend_ml_dir, 'fraud_model.pkl')}")
        print("=" * 75)

    finally:
        db.close()

if __name__ == "__main__":
    run_retraining_cycle()
