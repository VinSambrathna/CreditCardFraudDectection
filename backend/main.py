"""
SentinelPay - FastAPI Application Entrypoint
A Multi-Tenant AI-Powered Fraud Intelligence Platform
featuring Exact TreeSHAP Explainability, Bank Step-Up Verification,
and Enterprise Integration Gateway.
"""

import os
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from backend.database.connection import engine, Base, SessionLocal
from backend.database import crud
from backend.api import prediction, verification, transactions, dashboard, gateway
from backend.services.prediction_service import PredictionService
from backend.services.shap_service import ShapService
from backend.services.websocket_hub import AlertHub

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

    # Start live out-of-band Telegram interactive listener (if configured)
    from backend.services.telegram_bot_service import TelegramBotService
    tg_service = TelegramBotService.get_instance()
    tg_service.start_polling()

    print("[INIT] SentinelPay Backend Services, Gateway, SHAP Engine & Telegram Bot Initialized.")

    yield

    await tg_service.stop_polling()
    print("[SHUTDOWN] SentinelPay Backend Shutdown.")

app = FastAPI(
    title="SentinelPay Multi-Tenant AI Fraud Intelligence Platform",
    description="Enterprise API Gateway, Bank Integration Contracts, TreeSHAP Explainability, and Bank-Controlled Step-Up Verification.",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for React Frontend and external integration partners
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(gateway.router)        # /api/v1/fraud/check, /api/v1/verification/result, etc.
app.include_router(prediction.router)     # /predict (backward compatibility)
app.include_router(verification.router)   # /verify, /feedback
app.include_router(transactions.router)   # /transactions
app.include_router(dashboard.router)      # /dashboard/statistics, /model/info

# -------------------------------------------------------------
# Real-Time WebSocket Push Hub for Fraud Forensics Stream
# -------------------------------------------------------------
@app.websocket("/ws/alerts")
async def websocket_alerts(
    websocket: WebSocket,
    institution_id: Optional[int] = Query(None, description="Optional tenant scoping")
):
    hub = AlertHub.get_instance()
    await hub.connect(websocket, institution_id=institution_id)
    try:
        while True:
            # Keep connection open; receive ping or heartbeats from client
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        hub.disconnect(websocket)
    except Exception:
        hub.disconnect(websocket)

@app.get("/health", tags=["Health"])
def health_check():
    db = SessionLocal()
    institutions_count = 0
    try:
        institutions_count = len(crud.get_institutions(db))
    finally:
        db.close()

    return {
        "status": "healthy",
        "service": "SentinelPay Multi-Tenant Fraud Intelligence Platform",
        "version": "2.0.0",
        "model_champion": "XGBoost v1.0 (PR-AUC 0.9990, Recall 98.61%)",
        "active_tenants": institutions_count,
        "supported_currencies": ["USD", "KHR"],
        "payment_methods": ["KHQR", "CARD", "BANK_TRANSFER", "MOBILE"]
    }

@app.get("/api/v1/system/network-info", tags=["System"])
def get_network_info():
    import socket
    lan_ip = "192.168.1.22"
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        lan_ip = s.getsockname()[0]
        s.close()
    except Exception:
        pass
    return {
        "lan_ip": lan_ip,
        "frontend_port": 5173,
        "backend_port": 8000,
        "mobile_url": f"http://{lan_ip}:5173/#/mobile"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
