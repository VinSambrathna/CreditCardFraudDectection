"""
SentinelPay - Dashboard Statistics & Model Information Router
Handles GET /dashboard/statistics and GET /model/info
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database import crud
from backend.services.prediction_service import PredictionService

router = APIRouter(prefix="", tags=["Dashboard & Model Intelligence"])

@router.get("/dashboard/statistics")
def get_dashboard_statistics(db: Session = Depends(get_db)):
    return crud.get_dashboard_statistics(db)

@router.get("/model/info")
def get_model_info():
    pred_service = PredictionService.get_instance()
    return pred_service.get_model_intelligence()
