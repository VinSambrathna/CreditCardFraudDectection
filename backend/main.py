"""
SentinelPay - FastAPI Application Entrypoint
An End-to-End Credit Card Fraud Detection Web Application
featuring Explainable AI (SHAP) and Dynamic Verification Loops.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.database.connection import engine, Base, SessionLocal
from backend.database import crud
from backend.api import prediction, verification, transactions, dashboard
from backend.services.prediction_service import PredictionService
from backend.services.shap_service import ShapService

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database tables are created
    Base.metadata.create_all(bind=engine)

    # Seed demo baseline data if empty
    db = SessionLocal()
    try:
        crud.seed_demo_data_if_empty(db)
    finally:
        db.close()

    # Pre-warm ML and SHAP singletons
    pred_service = PredictionService.get_instance()
    shap_service = ShapService.get_instance()
    print("[INIT] SentinelPay Backend Services & SHAP Engine Initialized.")

    yield
    print("[SHUTDOWN] SentinelPay Backend Shutdown.")

app = FastAPI(
    title="SentinelPay AI Fraud Detection Engine",
    description="End-to-End Credit Card Fraud Detection API featuring TreeSHAP Explainability and Dynamic Verification Loops.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for dev and Docker environments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(prediction.router)
app.include_router(verification.router)
app.include_router(transactions.router)
app.include_router(dashboard.router)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "SentinelPay Fraud Detection API",
        "version": "1.0.0",
        "model_champion": "XGBoost v1.0 (PR-AUC 0.9990)"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
