"""
SentinelPay - API Security & Multi-Tenant Authenticator
Validates X-API-KEY and Tenant Scope, preventing IDOR vulnerabilities
and logging immutable audit trails for every gateway invocation.
"""

from typing import Optional
from fastapi import Header, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database.models import Institution, ApiCredential
from backend.database import crud

class AuthenticatedTenant:
    def __init__(self, institution: Institution, credential: Optional[ApiCredential] = None):
        self.institution = institution
        self.credential = credential
        self.institution_id = institution.id
        self.institution_code = institution.institution_code
        self.institution_name = institution.name

async def verify_api_key(
    request: Request,
    x_api_key: Optional[str] = Header(None, alias="X-API-KEY", description="Institution Sandbox or Production API Key"),
    x_institution_code: Optional[str] = Header(None, alias="X-INSTITUTION-ID", description="Optional Institution Code identifier (e.g., ABA)"),
    db: Session = Depends(get_db)
) -> AuthenticatedTenant:
    client_ip = request.client.host if request.client else "127.0.0.1"

    if not x_api_key:
        crud.create_audit_log(
            db=db,
            action="GATEWAY_AUTH_FAILURE",
            institution_id=None,
            endpoint=request.url.path,
            ip_address=client_ip,
            status="UNAUTHORIZED",
            detail="Missing required X-API-KEY header"
        )
        raise HTTPException(
            status_code=401,
            detail="Missing required 'X-API-KEY' header for institution authentication."
        )

    # Lookup API Credential
    cred = db.query(ApiCredential).filter(
        ApiCredential.api_key == x_api_key,
        ApiCredential.is_active == True
    ).first()

    if not cred:
        crud.create_audit_log(
            db=db,
            action="GATEWAY_AUTH_FAILURE",
            institution_id=None,
            endpoint=request.url.path,
            ip_address=client_ip,
            status="INVALID_KEY",
            detail=f"Invalid or revoked API key attempted: {x_api_key[:8]}..."
        )
        raise HTTPException(
            status_code=401,
            detail="Invalid or revoked institution API Key."
        )

    institution = cred.institution
    if not institution or institution.status != "ACTIVE":
        crud.create_audit_log(
            db=db,
            action="GATEWAY_AUTH_SUSPENDED",
            institution_id=institution.id if institution else None,
            endpoint=request.url.path,
            ip_address=client_ip,
            status="INSTITUTION_INACTIVE",
            detail=f"Institution {institution.institution_code if institution else 'UNKNOWN'} is suspended"
        )
        raise HTTPException(
            status_code=403,
            detail="Institution account is suspended or pending approval."
        )

    # If X-INSTITUTION-ID header is provided, enforce strict match to prevent IDOR
    if x_institution_code and x_institution_code.upper() != institution.institution_code.upper():
        crud.create_audit_log(
            db=db,
            action="GATEWAY_AUTH_MISMATCH",
            institution_id=institution.id,
            endpoint=request.url.path,
            ip_address=client_ip,
            status="TENANT_MISMATCH",
            detail=f"Provided institution header '{x_institution_code}' does not match API key owner '{institution.institution_code}'"
        )
        raise HTTPException(
            status_code=403,
            detail=f"Tenant mismatch: API key belongs to '{institution.institution_code}', not '{x_institution_code}'."
        )

    return AuthenticatedTenant(institution=institution, credential=cred)
