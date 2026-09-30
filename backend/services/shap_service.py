"""
SentinelPay - Explainable AI (SHAP) Service
Provides real-time local feature attribution for transactions using TreeSHAP.
"""

from typing import List, Dict, Any
import numpy as np
import pandas as pd
import shap
from backend.services.prediction_service import PredictionService

class ShapService:
    _instance = None

    def __init__(self):
        pred_service = PredictionService.get_instance()
        self.model = pred_service.model
        self.features = pred_service.features
        self.feature_labels = pred_service.feature_labels

        # Initialize fast TreeExplainer safely
        self.explainer = None
        if self.model is not None:
            try:
                self.explainer = shap.TreeExplainer(
                    self.model,
                    feature_perturbation="tree_path_dependent"
                )
            except Exception:
                self.explainer = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def reload(cls):
        cls._instance = cls()
        return cls._instance

    def _fallback_explanations(self, raw_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """
        Graceful heuristic attribution fallback when TreeSHAP explainer is unavailable.
        Generates risk directional weights based on feature deviations from standard baselines.
        """
        explanations = []
        raw_row = raw_df.iloc[0]

        for feat in self.features:
            val = float(raw_row.get(feat, 0.0))
            contrib = 0.0

            if feat == "distance" and val > 50.0:
                contrib = round(min(val / 100.0, 5.0), 4)
            elif feat == "device_trust" and val < 0.60:
                contrib = round((0.60 - val) * 4.0, 4)
            elif feat == "amount" and val > 500.0:
                contrib = round(min(val / 1000.0, 4.0), 4)
            elif feat == "merchant_risk" and val > 0.50:
                contrib = round((val - 0.50) * 3.0, 4)
            elif feat == "velocity_1h" and val >= 3:
                contrib = round(val * 0.4, 4)
            elif feat == "time_delta" and val < 0.2:
                contrib = round((0.2 - val) * 4.0, 4)

            explanations.append({
                "feature": feat,
                "label": self.feature_labels.get(feat, feat),
                "contribution": contrib,
                "direction": "RISK_INCREASING" if contrib > 0 else "RISK_DECREASING",
                "value": round(val, 2)
            })

        explanations.sort(key=lambda x: abs(x["contribution"]), reverse=True)
        return explanations

    def explain_transaction(self, raw_df: pd.DataFrame, scaled_matrix: np.ndarray) -> List[Dict[str, Any]]:
        """
        Generates structured local SHAP explanations for a single transaction.
        Returns sorted list of contributing features.
        """
        if scaled_matrix is None or self.explainer is None:
            return self._fallback_explanations(raw_df)

        try:
            shap_vals = self.explainer.shap_values(scaled_matrix)

            if isinstance(shap_vals, list):
                instance_vals = shap_vals[1][0]
            else:
                instance_vals = shap_vals[0]

            explanations = []
            raw_row = raw_df.iloc[0]

            for feat, val in zip(self.features, instance_vals):
                explanations.append({
                    "feature": feat,
                    "label": self.feature_labels.get(feat, feat),
                    "contribution": round(float(val), 4),
                    "direction": "RISK_INCREASING" if val > 0 else "RISK_DECREASING",
                    "value": round(float(raw_row[feat]), 2)
                })

            # Sort by absolute impact
            explanations.sort(key=lambda x: abs(x["contribution"]), reverse=True)
            return explanations
        except Exception:
            return self._fallback_explanations(raw_df)
