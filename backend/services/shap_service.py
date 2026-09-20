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

        # Initialize fast TreeExplainer
        self.explainer = shap.TreeExplainer(
            self.model,
            feature_perturbation="tree_path_dependent"
        )

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def explain_transaction(self, raw_df: pd.DataFrame, scaled_matrix: np.ndarray) -> List[Dict[str, Any]]:
        """
        Generates structured local SHAP explanations for a single transaction.
        Returns sorted list of contributing features.
        """
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
