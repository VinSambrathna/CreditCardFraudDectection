"""
SentinelPay - Database Connection Engine
Supports both SQLite (for zero-friction local development)
and MySQL (for Docker Compose and production deployments).
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sentinelpay.db")

# Handle connect_args for SQLite
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    """Initializes all database tables."""
    # Import models to ensure they are registered with Base metadata
    from backend.database import models # noqa: F401
    Base.metadata.create_all(bind=engine)

def get_db():
    """Dependency generator for FastAPI route handlers."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
