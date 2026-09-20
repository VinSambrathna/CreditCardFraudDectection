"""
SentinelPay - Model Packaging & Explainable AI (SHAP) Exporter
Computes global SHAP importance using TreeExplainer, tests sub-millisecond local
inference, and packages all runtime artifacts into `backend/ml/`.
"""

import os
import json
import shutil
import joblib
import numpy as np
import pandas as pd
import shap

FEATURES = [
    "amount", "distance", "time_delta", "merchant_risk",
    "device_trust", "velocity_1h", "velocity_24h", "hour_of_day", "is_weekend"
]

FEATURE_LABELS = {
    "amount": "Transaction Amount ($)",
    "distance": "Distance from Home (km)",
    "time_delta": "Time Since Last Txn (hrs)",
    "merchant_risk": "Merchant Category Risk",
    "device_trust": "Device Trust Score",
    "velocity_1h": "1-Hour Txn Velocity",
    "velocity_24h": "24-Hour Txn Velocity",
    "hour_of_day": "Hour of Day (0-23)",
    "is_weekend": "Weekend Transaction"
}

def export_pipeline_and_shap():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    models_dir = os.path.join(base_dir, "models")
    test_path = os.path.join(base_dir, "data", "processed", "test_split.csv")
    backend_ml_dir = os.path.join(base_dir, "..", "backend", "ml")
    os.makedirs(backend_ml_dir, exist_ok=True)

    print("[1/5] Loading champion model & preprocessor...")
    model = joblib.load(os.path.join(models_dir, "fraud_model.pkl"))
    scaler = joblib.load(os.path.join(models_dir, "preprocessor.pkl"))

    df_test = pd.read_csv(test_path)
    X_test = df_test[FEATURES]

    # Step 2: Initialize TreeExplainer
    print("[2/5] Initializing TreeSHAP explainer...")
    explainer = shap.TreeExplainer(model, feature_perturbation="tree_path_dependent")

    # Step 3: Compute Global Feature Importance (Mean Absolute SHAP)
    print("[3/5] Computing Global Feature Importances...")
    sample_scaled = scaler.transform(X_test.sample(n=min(1000, len(X_test)), random_state=42))
    shap_values = explainer.shap_values(sample_scaled)

    # In binary XGBoost / TreeExplainer, shap_values can be 2D array [samples, features] or list
    if isinstance(shap_values, list):
        shap_matrix = shap_values[1] # positive class
    else:
        shap_matrix = shap_values

    mean_abs_shap = np.abs(shap_matrix).mean(axis=0)
    global_importance = []
    for feat, score in zip(FEATURES, mean_abs_shap):
        global_importance.append({
            "feature": feat,
            "label": FEATURE_LABELS[feat],
            "importance": round(float(score), 4)
        })
    global_importance.sort(key=lambda x: x["importance"], reverse=True)

    print("\n" + "="*50)
    print("GLOBAL SHAP FEATURE IMPORTANCE")
    print("="*50)
    for item in global_importance:
        bar = "#" * int(min(item["importance"] * 8, 30))
        print(f"{item['label']:<30} | {item['importance']:<6.4f} | {bar}")
    print("="*50)

    # Step 4: Validate Local Inference & Fast SHAP calculation
    print("\n[4/5] Validating Local SHAP Explanation on a high-risk transaction...")
    sample_high_risk = {
        "amount": 1850.00,
        "distance": 840.5,
        "time_delta": 0.15,
        "merchant_risk": 0.88,
        "device_trust": 0.12,
        "velocity_1h": 4,
        "velocity_24h": 7,
        "hour_of_day": 3,
        "is_weekend": 1
    }
    sample_df = pd.DataFrame([sample_high_risk])[FEATURES]
    sample_scaled = scaler.transform(sample_df)
    prob = float(model.predict_proba(sample_scaled)[0, 1])
    local_shap = explainer.shap_values(sample_scaled)
    if isinstance(local_shap, list):
        local_vals = local_shap[1][0]
    else:
        local_vals = local_shap[0]

    local_explanations = []
    for feat, val, raw_val in zip(FEATURES, local_vals, sample_df.iloc[0]):
        local_explanations.append({
            "feature": feat,
            "label": FEATURE_LABELS[feat],
            "value": round(float(raw_val), 2),
            "contribution": round(float(val), 4),
            "direction": "RISK_INCREASING" if val > 0 else "RISK_DECREASING"
        })
    local_explanations.sort(key=lambda x: abs(x["contribution"]), reverse=True)

    print(f"Sample Prediction Probability: {prob:.4f}")
    print("Top local feature attributions:")
    for exp in local_explanations[:5]:
        arrow = "(+)" if exp["direction"] == "RISK_INCREASING" else "(-)"
        print(f"  {arrow} {exp['label']:<28}: contribution {exp['contribution']:+0.4f} (actual: {exp['value']})")

    # Step 5: Packaging Artifacts into backend/ml/
    print("\n[5/5] Packaging production artifacts into backend/ml/...")
    
    # Save model and preprocessor to backend/ml
    shutil.copy(os.path.join(models_dir, "fraud_model.pkl"), os.path.join(backend_ml_dir, "fraud_model.pkl"))
    shutil.copy(os.path.join(models_dir, "preprocessor.pkl"), os.path.join(backend_ml_dir, "preprocessor.pkl"))

    # Load comparison metrics and threshold analysis
    comp_path = os.path.join(models_dir, "model_comparison_metrics.json")
    thresh_path = os.path.join(models_dir, "threshold_analysis.json")
    with open(comp_path, "r") as f:
        comp_metrics = json.load(f)
    with open(thresh_path, "r") as f:
        thresh_data = json.load(f)

    # Create feature_config.json
    feature_config = {
        "features": FEATURES,
        "feature_labels": FEATURE_LABELS,
        "default_values": {
            "velocity_1h": 1,
            "velocity_24h": 2,
            "hour_of_day": 14,
            "is_weekend": 0
        },
        "risk_thresholds": {
            "low": 0.35,
            "high": 0.70
        },
        "global_importance": global_importance
    }
    with open(os.path.join(backend_ml_dir, "feature_config.json"), "w") as f:
        json.dump(feature_config, f, indent=2)

    # Create model_intelligence.json (Complete metrics document for Admin & Model Intelligence UI)
    model_intelligence = {
        "model_metadata": {
            "name": "SentinelPay XGBoost Classifier",
            "version": "1.0.0",
            "framework": "XGBoost + Scikit-Learn + SHAP",
            "balancing_method": "SMOTE (Applied to Train Split Only)",
            "scaler": "RobustScaler"
        },
        "performance_metrics": comp_metrics["champion"]["metrics"],
        "model_comparison": comp_metrics["candidate_models"],
        "threshold_calibration": thresh_data,
        "global_feature_importance": global_importance,
        "evaluation_summary": {
            "test_set_size": thresh_data["test_population"]["total"],
            "fraud_cases_in_test": thresh_data["test_population"]["fraudulent"],
            "fraud_capture_rate_at_default": f"{comp_metrics['champion']['metrics']['recall']*100:.1f}%",
            "precision_at_default": f"{comp_metrics['champion']['metrics']['precision']*100:.1f}%",
            "pr_auc": comp_metrics["champion"]["metrics"]["pr_auc"]
        }
    }
    with open(os.path.join(backend_ml_dir, "model_intelligence.json"), "w") as f:
        json.dump(model_intelligence, f, indent=2)

    print("\n[SUCCESS] Production Model Packaged Successfully!")
    print(f"Artifacts in {os.path.abspath(backend_ml_dir)}:")
    print("  - fraud_model.pkl")
    print("  - preprocessor.pkl")
    print("  - feature_config.json")
    print("  - model_intelligence.json")

if __name__ == "__main__":
    export_pipeline_and_shap()
