"""
SentinelPay - Real-Time ML Prediction Service
Loads the trained XGBoost model and RobustScaler, executes inference,
and computes calibrated operational risk tiers.
"""

import os
import json
import joblib
import pandas as pd
from typing import Tuple, Dict, Any
from backend.schemas.transaction import PredictRequest

class PredictionService:
    _instance = None

    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        ml_dir = os.path.join(base_dir, "ml")

        model_path = os.path.join(ml_dir, "fraud_model.pkl")
        scaler_path = os.path.join(ml_dir, "preprocessor.pkl")
        config_path = os.path.join(ml_dir, "feature_config.json")
        intel_path = os.path.join(ml_dir, "model_intelligence.json")

        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)

        with open(config_path, "r") as f:
            self.config = json.load(f)

        self.features = self.config["features"]
        self.feature_labels = self.config["feature_labels"]
        self.risk_thresholds = self.config["risk_thresholds"]

        if os.path.exists(intel_path):
            with open(intel_path, "r") as f:
                self.intelligence = json.load(f)
        else:
            self.intelligence = {}

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def reload(cls):
        cls._instance = cls()
        return cls._instance

    def predict(self, req: PredictRequest) -> Tuple[float, int, str, str, bool, pd.DataFrame, Any]:
        """
        Executes real-time inference and returns:
        (fraud_prob, prediction, risk_level, status, requires_verification, raw_df, scaled_matrix)
        """
        raw_dict = {
            "amount": req.amount,
            "distance": req.distance,
            "time_delta": req.time_delta,
            "merchant_risk": req.merchant_risk,
            "device_trust": req.device_trust,
            "velocity_1h": req.velocity_1h or self.config["default_values"]["velocity_1h"],
            "velocity_24h": req.velocity_24h or self.config["default_values"]["velocity_24h"],
            "hour_of_day": req.hour_of_day if req.hour_of_day is not None else self.config["default_values"]["hour_of_day"],
            "is_weekend": req.is_weekend if req.is_weekend is not None else self.config["default_values"]["is_weekend"]
        }

        df = pd.DataFrame([raw_dict])[self.features]
        scaled_matrix = self.scaler.transform(df)

        prob = float(self.model.predict_proba(scaled_matrix)[0, 1])

        low_th = self.risk_thresholds.get("low", 0.35)
        high_th = self.risk_thresholds.get("high", 0.70)

        if prob < low_th:
            risk_level = "LOW"
            status = "APPROVED"
            requires_verification = False
            prediction = 0
        elif prob < high_th:
            risk_level = "REVIEW"
            status = "SOFT_BLOCKED"
            requires_verification = True
            prediction = 1
        else:
            risk_level = "HIGH"
            status = "SOFT_BLOCKED"
            requires_verification = True
            prediction = 1

        # Operational Circuit Breaker: Outlier amount (> $5,000) overrides to at least REVIEW
        if req.amount >= 5000.0 and risk_level == "LOW":
            risk_level = "REVIEW"
            status = "SOFT_BLOCKED"
            requires_verification = True
            prediction = 1

        return prob, prediction, risk_level, status, requires_verification, df, scaled_matrix

    def get_model_intelligence(self) -> Dict[str, Any]:
        return self.intelligence
