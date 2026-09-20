# SentinelPay — Docker Deployment Guide

This directory documents the containerized deployment of SentinelPay using Docker and Docker Compose.

## Container Architecture

SentinelPay comprises three isolated services connected through an internal bridge network:

| Container Name | Technology | Internal Port | Host Port | Role |
| :--- | :--- | :---: | :---: | :--- |
| **`sentinelpay-mysql`** | MySQL 8.0 | `3306` | `3306` | Relational storage for users, transactions, MFA challenges, feedback, and model registry. Auto-initializes schema via `database/init.sql`. |
| **`sentinelpay-backend`** | Python 3.12 / FastAPI | `8000` | `8000` | Real-time prediction engine, TreeSHAP explainer, verification state machine, and REST endpoints. |
| **`sentinelpay-frontend`** | Nginx / React (Vite) | `80` | `5173` | Production-compiled institutional banking UI with client-side SPA routing. |

---

## Launch Instructions

### 1. Build and Start All Services

From the project root:

```bash
docker compose up --build -d
```

### 2. Verify Container Health

```bash
docker compose ps
```

All three services should report `healthy` or `running`:
- `sentinelpay-mysql` (healthy)
- `sentinelpay-backend` (healthy)
- `sentinelpay-frontend` (running)

### 3. Access Services

- **Web Application:** `http://localhost:5173`
- **FastAPI Documentation:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

### 4. Stop Services

```bash
# Stop containers while preserving database volume
docker compose down

# Stop containers and wipe database volume
docker compose down -v
```

---

## Environment Variables

| Variable | Default (Docker) | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `mysql+pymysql://sentinel_user:sentinel_secure_pass@sentinelpay-mysql:3306/sentinelpay` | Connection string |
| `RISK_THRESHOLD_LOW` | `0.35` | Automatic approval ceiling |
| `RISK_THRESHOLD_HIGH` | `0.70` | Step-Up MFA challenge floor |
| `APP_ENV` | `production` | Environment mode |
