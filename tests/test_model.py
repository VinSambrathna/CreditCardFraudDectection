"""
SentinelPay - Automated Unit Tests for ML Model and SHAP Explainer
Verifies model loading, preprocessor scaling, probability boundaries,
SHAP computation latency, and risk classification.
"""

import os
import json
import time
import joblib
import pytest
import numpy as np
import pandas as pd
import shap

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_ML_DIR = os.path.join(BASE_DIR, "backend", "ml")

@pytest.fixture(scope="module")
def model_assets():
    model_path = os.path.join(BACKEND_ML_DIR, "fraud_model.pkl")
    scaler_path = os.path.join(BACKEND_ML_DIR, "preprocessor.pkl")
    config_path = os.path.join(BACKEND_ML_DIR, "feature_config.json")

    assert os.path.exists(model_path), "fraud_model.pkl does not exist"
    assert os.path.exists(scaler_path), "preprocessor.pkl does not exist"
    assert os.path.exists(config_path), "feature_config.json does not exist"

    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    with open(config_path, "r") as f:
        config = json.load(f)

    explainer = shap.TreeExplainer(model, feature_perturbation="tree_path_dependent")

    return {
        "model": model,
        "scaler": scaler,
        "config": config,
        "explainer": explainer
    }

def test_model_and_preprocessor_loading(model_assets):
    assert model_assets["model"] is not None
    assert model_assets["scaler"] is not None
    assert len(model_assets["config"]["features"]) == 9

def test_low_risk_prediction(model_assets):
    low_risk_tx = {
        "amount": 35.50,
        "distance": 4.2,
        "time_delta": 24.0,
        "merchant_risk": 0.08,
        "device_trust": 0.95,
        "velocity_1h": 1,
        "velocity_24h": 2,
        "hour_of_day": 14,
        "is_weekend": 0
    }
    features = model_assets["config"]["features"]
    df = pd.DataFrame([low_risk_tx])[features]
    scaled = model_assets["scaler"].transform(df)
    prob = float(model_assets["model"].predict_proba(scaled)[0, 1])

    assert 0.0 <= prob <= 1.0
    assert prob < model_assets["config"]["risk_thresholds"]["low"], f"Expected low risk, got {prob}"

def test_high_risk_prediction_and_fast_shap(model_assets):
    high_risk_tx = {
        "amount": 2100.00,
        "distance": 1250.0,
        "time_delta": 0.10,
        "merchant_risk": 0.92,
        "device_trust": 0.08,
        "velocity_1h": 5,
        "velocity_24h": 9,
        "hour_of_day": 3,
        "is_weekend": 1
    }
    features = model_assets["config"]["features"]
    df = pd.DataFrame([high_risk_tx])[features]
    scaled = model_assets["scaler"].transform(df)

    start_time = time.time()
    prob = float(model_assets["model"].predict_proba(scaled)[0, 1])
    shap_vals = model_assets["explainer"].shap_values(scaled)
    latency_ms = (time.time() - start_time) * 1000

    assert 0.0 <= prob <= 1.0
    assert prob >= model_assets["config"]["risk_thresholds"]["high"], f"Expected high risk, got {prob}"
    assert latency_ms < 100, f"Inference + SHAP latency too slow: {latency_ms:.2f}ms"

    # Verify SHAP value count matches features
    if isinstance(shap_vals, list):
        vals = shap_vals[1][0]
    else:
        vals = shap_vals[0]
    assert len(vals) == len(features)
