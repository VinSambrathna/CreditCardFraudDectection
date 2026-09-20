"""
SentinelPay - Transactions Query API Router
Handles GET /transactions and GET /transactions/{token}
"""

import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database import crud
from backend.schemas.transaction import TransactionOut, ExplanationItem

router = APIRouter(prefix="", tags=["Transactions"])

@router.get("/transactions", response_model=List[TransactionOut])
def list_transactions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    txs = crud.get_transactions(db, skip=skip, limit=limit)
    results = []
    for tx in txs:
        expl = []
        if tx.explanation_json:
            try:
                expl = [ExplanationItem(**item) for item in json.loads(tx.explanation_json)]
            except Exception:
                expl = []

        results.append(TransactionOut(
            id=tx.id,
            transaction_token=tx.transaction_token,
            user_id=tx.user_id,
            amount=tx.amount,
            distance=tx.distance,
            time_delta=tx.time_delta,
            merchant_risk=tx.merchant_risk,
            device_trust=tx.device_trust,
            fraud_probability=tx.fraud_probability,
            prediction=tx.prediction,
            risk_level=tx.risk_level,
            status=tx.status,
            explanation=expl,
            created_at=tx.created_at
        ))
    return results

@router.get("/transactions/{token}", response_model=TransactionOut)
def get_transaction_detail(token: str, db: Session = Depends(get_db)):
    tx = crud.get_transaction_by_token(db, token)
    if not tx:
        raise HTTPException(status_code=404, detail=f"Transaction {token} not found")

    expl = []
    if tx.explanation_json:
        try:
            expl = [ExplanationItem(**item) for item in json.loads(tx.explanation_json)]
        except Exception:
            expl = []

    return TransactionOut(
        id=tx.id,
        transaction_token=tx.transaction_token,
        user_id=tx.user_id,
        amount=tx.amount,
        distance=tx.distance,
        time_delta=tx.time_delta,
        merchant_risk=tx.merchant_risk,
        device_trust=tx.device_trust,
        fraud_probability=tx.fraud_probability,
        prediction=tx.prediction,
        risk_level=tx.risk_level,
        status=tx.status,
        explanation=expl,
        created_at=tx.created_at
    )
