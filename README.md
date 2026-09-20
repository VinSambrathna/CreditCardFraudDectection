# SentinelPay — Institutional AI Credit Card Fraud Detection

**SentinelPay** is an end-to-end credit card fraud detection system featuring **Explainable AI (TreeSHAP)** and **Dynamic Step-Up Verification Loops (3DS2 SCA)**.

Designed to institutional fintech standards (modeled after Stripe Radar and Brex), SentinelPay goes beyond isolated Jupyter notebooks by delivering a fully integrated, production-grade AI platform:

1. **Machine Learning Core**: Extreme imbalance handling with train-only SMOTE, evaluated on holdout PR-AUC and Recall.
2. **Explainable AI (XAI)**: Real-time, sub-30ms local feature attributions using `shap.TreeExplainer` to answer *"Why was this transaction flagged?"*.
3. **Dynamic Human-in-the-Loop State Machine**: Three operational action tiers (Auto-Approve, Soft Block with Step-Up MFA, and Hard Block).
4. **Dual-Mode Persistence**: SQLAlchemy ORM with SQLite for zero-friction local development and MySQL for production/Docker deployment.
5. **Institutional Banking UI**: Modern, dark obsidian terminal built with React, Tailwind CSS, Lucide icons, and Recharts. Zero AI slop, zero emojis.

---

## System Architecture

```text
                               SENTINELPAY ARCHITECTURE
                                          │
                                          ▼
                   ┌─────────────────────────────────────────────┐
                   │               React Frontend                │
                   │                                             │
                   │ • Merchant Terminal Simulator               │
                   │ • Transaction Clearance Verdict             │
                   │ • Step-Up 3DS2 MFA Challenge Modal          │
                   │ • SHAP Waterfall Visualizer                 │
                   │ • Admin Surveillance Dashboard              │
                   │ • Model Intelligence & Governance           │
                   └──────────────────────┬──────────────────────┘
                                          │
                                     REST / JSON
                                          │
                                          ▼
                   ┌─────────────────────────────────────────────┐
                   │               FastAPI Backend               │
                   │                                             │
                   │ • POST /predict      • POST /verify         │
                   │ • GET  /transactions • GET  /dashboard/stats│
                   │ • GET  /model/info   • GET  /health         │
                   └──────────────────────┬──────────────────────┘
                                          │
                     ┌────────────────────┼────────────────────┐
                     │                    │                    │
                     ▼                    ▼                    ▼
             ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
             │  ML Engine   │     │  TreeSHAP    │     │  Database    │
             │              │     │              │     │              │
             │ • XGBoost    │     │ • Sub-30ms   │     │ • MySQL /    │
             │ • RF / LR    │     │   Local      │     │   SQLite     │
             │ • SMOTE      │     │ • Global     │     │ • Feedback   │
             │   (Train)    │     │   Attribut.  │     │   Pool       │
             └──────────────┘     └──────────────┘     └──────────────┘
```

---

## Machine Learning & Evaluation

Evaluated on an **untouched holdout test set (12,000 transactions)** with genuine 1.20% class imbalance:

| Model | Precision | Recall | F1-Score | ROC-AUC | PR-AUC | Selection Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression (Baseline)** | 56.85% | 95.14% | 0.7117 | 0.9981 | 0.9507 | Evaluated |
| **Random Forest** | 94.67% | 98.61% | 0.9660 | 1.0000 | 0.9971 | Evaluated |
| **XGBoost (Champion)** | **97.93%** | **98.61%** | **0.9827** | **1.0000** | **0.9990** | **Selected & Packaged** |

### Data Hygiene & Leakage Prevention
- **Split:** 80/20 Stratified Split.
- **Strict Isolation:** `RobustScaler` and `SMOTE` oversampling were fitted **strictly on the training split**. The testing split remained untouched to guarantee zero data leakage.

### Calibrated Operational Tiers
- **LOW RISK (< 0.35):** 100% Recall, 0.08% False Positive Rate $\rightarrow$ **Auto-Approved**
- **REVIEW (0.35 - 0.70):** 99.30% Precision, 98.61% Recall $\rightarrow$ **Soft Block + Step-Up MFA Challenge**
- **HIGH RISK (>= 0.70):** 99.29% Precision, 0.01% False Positive Rate $\rightarrow$ **Critical Hold / Escalation**

---

## Repository Structure

```text
sentinelpay/
│
├── backend/                        # FastAPI Backend Application
│   ├── api/                        # Route Handlers (/predict, /verify, /transactions, /dashboard)
│   ├── database/                   # SQLAlchemy Engine, Models, and CRUD helpers
│   ├── ml/                         # Production Model Artifacts & Feature Config
│   │   ├── fraud_model.pkl         # Serialized XGBoost Model
│   │   ├── preprocessor.pkl        # RobustScaler Pipeline
│   │   ├── feature_config.json     # Feature mappings and thresholds
│   │   └── model_intelligence.json # Evaluation benchmarks and global SHAP weights
│   ├── schemas/                    # Pydantic Request & Response Schemas
│   ├── services/                   # ML Inference and TreeSHAP Services
│   ├── main.py                     # Application Entrypoint & Lifespan Handler
│   └── requirements.txt            # Python Dependencies
│
├── frontend/                       # Vite + React Frontend
│   ├── src/
│   │   ├── components/             # Navbar, VerificationModal
│   │   ├── pages/                  # Checkout, TransactionResult, Dashboard, Intelligence, Model
│   │   ├── services/               # API Service Client
│   │   ├── App.jsx                 # Routing & State Management
│   │   └── index.css               # Institutional Banking Design System (Tailwind v4)
│   ├── package.json
│   └── vite.config.js
│
├── ml/                             # ML Pipeline & Academic Research Notebooks
│   ├── data/                       # Raw & Processed Datasets
│   ├── models/                     # Trained candidate models & evaluation metrics
│   ├── notebooks/                  # 6 Academic Jupyter Notebooks (01_eda to 06_shap_analysis)
│   └── scripts/                    # Training, Evaluation, and Packaging scripts
│
├── database/
│   └── init.sql                    # Production MySQL Schema & Seed Data
│
├── tests/
│   ├── test_model.py               # Unit tests for Model & SHAP latency
│   └── test_api.py                 # Integration tests for FastAPI endpoints
│
├── test_demo_flow.py               # Interactive End-to-End Terminal Demo Runner
├── pytest.ini                      # Pytest Configuration
├── .env.example                    # Environment Variable Template
└── README.md
```

---

## Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 1. Backend Setup

```bash
# Install Python dependencies
pip install -r backend/requirements.txt

# Run automated tests (10/10 checks)
python -m pytest tests/ -v

# Start FastAPI backend server
python -m uvicorn backend.main:app --reload --port 8000
```
Interactive API docs will be available at: `http://localhost:8000/docs`.

### 2. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser at: `http://localhost:5173`.

### 3. Interactive CLI Demo

To run a complete simulation of all 3 presentation scenarios directly in your terminal:
```bash
python test_demo_flow.py
```

---

## Core Demonstration Scenarios

1. **Scenario 1: Legitimate Payment**
   - $38.50 grocery near home, trusted device $\rightarrow$ **Auto-Approved (Risk: 0.00%)**.
2. **Scenario 2: Suspicious Purchase + MFA Approval**
   - $1,850.00 late-night purchase at 890 km distance, untrusted device $\rightarrow$ **Soft-Blocked (Risk: 99.98%)** $\rightarrow$ Step-Up OTP verified $\rightarrow$ **Released to Verified** & feedback logged for retraining.
3. **Scenario 3: Account Takeover Attack + MFA Denial**
   - $2,650.00 foreign location (2,100 km) $\rightarrow$ **Soft-Blocked** $\rightarrow$ Cardholder denies unauthorized payment $\rightarrow$ **Hard Blocked** & confirmed fraud feedback logged.

---

## License & Academic Attribution
Developed as an AI Capstone Project demonstrating production-grade Explainable AI and dynamic verification loops in financial fraud detection.
