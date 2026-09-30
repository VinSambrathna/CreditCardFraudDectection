"""
SentinelPay - Real-Time ML Prediction Service
Loads the trained XGBoost model and RobustScaler, executes inference,
and computes calibrated operational risk tiers with graceful heuristic fallback.
"""

import os
import json
import logging
import joblib
import pandas as pd
from typing import Tuple, Dict, Any
from backend.schemas.transaction import PredictRequest

logger = logging.getLogger("sentinelpay.prediction")

class PredictionService:
    _instance = None

    def __init__(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        ml_dir = os.path.join(base_dir, "ml")

        model_path = os.path.join(ml_dir, "fraud_model.pkl")
        scaler_path = os.path.join(ml_dir, "preprocessor.pkl")
        config_path = os.path.join(ml_dir, "feature_config.json")
        intel_path = os.path.join(ml_dir, "model_intelligence.json")

        self.model = None
        self.scaler = None
        self.model_loaded = False
        self.is_last_prediction_fallback = False

        try:
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                self.model = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)
                self.model_loaded = True
                logger.info("[INIT] Production XGBoost model and preprocessor loaded.")
            else:
                logger.warning(f"[INIT] Model asset missing at {model_path}. Fallback active.")
        except Exception as e:
            logger.error(f"[INIT] Error loading model assets: {e}. Fallback active.")

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

    def _fallback_predict(self, raw_dict: Dict[str, Any], req: PredictRequest) -> Tuple[float, int, str, str, bool, pd.DataFrame, Any]:
        """
        Graceful heuristic fallback engine when ML model is degraded or unavailable.
        Prevents checkout outages on commercial payment rails while maintaining a fail-safe security posture.
        """
        amount = raw_dict.get("amount", 0.0)
        distance = raw_dict.get("distance", 0.0)
        device_trust = raw_dict.get("device_trust", 1.0)
        vel_1h = raw_dict.get("velocity_1h", 1)

        score = 0.05
        if amount >= 1000.0:
            score += 0.35
        elif amount >= 300.0:
            score += 0.15

        if distance >= 200.0:
            score += 0.30
        elif distance >= 50.0:
            score += 0.15

        if device_trust <= 0.30:
            score += 0.30
        elif device_trust <= 0.60:
            score += 0.15

        if vel_1h >= 4:
            score += 0.25

        prob = min(round(score, 4), 0.95)
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

        df = pd.DataFrame([raw_dict])[self.features]
        return prob, prediction, risk_level, status, requires_verification, df, None

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

        # Attempt ML model inference; gracefully fall back if model unavailable or throws
        if self.model is not None and self.scaler is not None:
            try:
                scaled_matrix = self.scaler.transform(df)
                prob = float(self.model.predict_proba(scaled_matrix)[0, 1])
                self.is_last_prediction_fallback = False
            except Exception as e:
                logger.error(f"[PREDICTION] Inference runtime error: {e}. Engaging heuristic fallback.")
                self.is_last_prediction_fallback = True
                return self._fallback_predict(raw_dict, req)
        else:
            self.is_last_prediction_fallback = True
            return self._fallback_predict(raw_dict, req)

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

        # Operational Circuit Breakers & Banking Policy Rules:
        # Rule 1: High transaction amount (> $5,000) overrides to at least REVIEW
        if req.amount >= 5000.0 and risk_level == "LOW":
            risk_level = "REVIEW"
            status = "SOFT_BLOCKED"
            requires_verification = True
            prediction = 1
            prob = max(prob, 0.45)

        # Rule 2: Rapid Velocity Anomaly (Burst within 3-6 mins or >= 4 txs/hr on unverified/low-trust device)
        vel_1h = raw_dict.get("velocity_1h", 1)
        time_d = raw_dict.get("time_delta", 12.0)
        dev_trust = raw_dict.get("device_trust", 0.95)
        if (vel_1h >= 4 or (time_d is not None and time_d <= 0.1)) and req.amount >= 300.0 and dev_trust <= 0.50:
            if risk_level == "LOW":
                risk_level = "REVIEW"
                status = "SOFT_BLOCKED"
                requires_verification = True
                prediction = 1
                prob = max(prob, 0.485)

        # Rule 3: Geographic Distance Anomaly (200+ km travel on high amount >= $1,000)
        dist = raw_dict.get("distance", 2.5)
        if dist >= 200.0 and req.amount >= 1000.0:
            if risk_level == "LOW":
                risk_level = "REVIEW"
                status = "SOFT_BLOCKED"
                requires_verification = True
                prediction = 1
                prob = max(prob, 0.425)

        return prob, prediction, risk_level, status, requires_verification, df, scaled_matrix

    def get_model_intelligence(self) -> Dict[str, Any]:
        return self.intelligence
