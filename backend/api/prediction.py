"""
SentinelPay - Prediction API Router
Handles POST /predict
"""

import time
import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database import crud
from backend.schemas.transaction import PredictRequest, PredictResponse, ExplanationItem
from backend.services.prediction_service import PredictionService
from backend.services.shap_service import ShapService

router = APIRouter(prefix="", tags=["Prediction"])

@router.post("/predict", response_model=PredictResponse)
def predict_transaction(req: PredictRequest, db: Session = Depends(get_db)):
    pred_service = PredictionService.get_instance()
    shap_service = ShapService.get_instance()

    # Generate unique transaction token
    token = f"TX{int(time.time() * 1000) % 10000000:07d}"

    # ML Inference
    prob, prediction, risk_level, status, requires_verification, raw_df, scaled_matrix = pred_service.predict(req)

    # Fast TreeSHAP Explanation
    explanations = shap_service.explain_transaction(raw_df, scaled_matrix)

    # Persist to Database
    crud.create_transaction(
        db=db,
        transaction_token=token,
        user_id=req.user_id,
        amount=req.amount,
        distance=req.distance,
        time_delta=req.time_delta,
        merchant_risk=req.merchant_risk,
        device_trust=req.device_trust,
        fraud_probability=prob,
        prediction=prediction,
        risk_level=risk_level,
        status=status,
        explanation=explanations
    )

    return PredictResponse(
        transaction_id=token,
        fraud_probability=round(prob, 4),
        risk_level=risk_level,
        status=status,
        requires_verification=requires_verification,
        explanation=[ExplanationItem(**item) for item in explanations]
    )
