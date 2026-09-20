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
def get_model_info(db: Session = Depends(get_db)):
    pred_service = PredictionService.get_instance()
    intel = dict(pred_service.get_model_intelligence())
    active_mv = crud.get_active_model_version(db)
    if active_mv:
        meta = dict(intel.get("model_metadata", {}))
        meta["version"] = active_mv.version
        if active_mv.trained_at:
            meta["last_retrained"] = active_mv.trained_at.isoformat()
        intel["model_metadata"] = meta

        perf = dict(intel.get("performance_metrics", {}))
        perf["precision"] = active_mv.precision
        perf["recall"] = active_mv.recall
        perf["f1_score"] = active_mv.f1_score
        perf["pr_auc"] = active_mv.pr_auc
        intel["performance_metrics"] = perf
    return intel
