# SentinelPay — Multi-Tenant AI Fraud Intelligence Platform
## FESE307 Practical AI for Software Engineering • Final Capstone Project
**Student:** Vin Sambrathna  
**Repository:** `VinSambrathna/CreditCardFraudDectection`  
**License:** MIT  

---

## 1. Project Overview & Problem Statement

Modern financial switches and digital payment rails—such as **Bakong KHQR**, EMV card processing, and real-time bank transfers—process transactions in milliseconds. In this environment:
* **Static Rule Engines Fail:** Simple thresholds (e.g. "decline if amount > $500") either generate excessive false positives that frustrate legitimate customers or are easily evaded by fraudsters who split charges into micro-transactions.
* **Why AI is Appropriate:** Payment fraud involves complex, nonlinear interactions across multi-dimensional feature spaces (e.g., travel distance is benign if device trust is 98%, but dangerous if device trust is 10% and velocity spiked). A gradient-boosted decision tree evaluates these continuous probabilities in **sub-3ms**.
* **What Remains Deterministic:** Currency conversion, bank safety circuit breakers, operational risk thresholds, step-up verification state machines, and customer OTP challenges remain strictly deterministic.

**SentinelPay** is an enterprise-grade multi-tenant AI fraud intelligence gateway that commercial banks (such as ABA Bank, ACLEDA Bank, and Wing Bank) integrate into their existing core banking switches to detect fraud, provide sub-15ms **TreeSHAP explainability**, and orchestrate bank-controlled **step-up verification loops**.

---

## 2. System Architecture

```text
  [ USER / CARDHOLDER ] ──────── (Initiates Bakong KHQR / Card Payment)
          │
          ▼
  [ PART A: EXTERNAL BANK APPLICATION ] (ABA Bank / ACLEDA / Wing Simulator)
          │  REST Ingestion (X-API-KEY, X-INSTITUTION-ID, Amount, Telemetry)
          ▼
  [ PART B: SENTINELPAY INTEGRATION GATEWAY ] (FastAPI Enterprise Gateway)
     ├── Pydantic Input Validation & Sanitization (gt=0, bounds checking)
     ├── Dynamic Field Mapping & Currency Normalization (KHR -> USD at 4,050:1)
     ├── Tenant Scoping & Anti-IDOR Authorization Check
     │
     ├──► [ AI LAYER: PREDICTION & XAI ENGINE ]
     │      ├── RobustScaler Preprocessor
     │      ├── XGBoost 45-Tree Champion Classifier (< 3ms inference)
     │      ├── Fast TreeSHAP Explainer (< 4ms local attribution)
     │      └── Graceful Heuristic Fallback Engine (Fail-safe degradation)
     │
     ├──► [ PERSISTENCE & COMPLIANCE ]
     │      ├── Multi-Tenant Storage (MySQL / SQLite via SQLAlchemy)
     │      └── Immutable Audit Trail (Tamper-evident log of all evaluations)
     │
     └──► [ REAL-TIME PUSH HUB ]
            └── FastAPI WebSockets (/ws/alerts) broadcast to Operations
          │
          ▼
  [ PART C: SENTINELPAY ANALYST OPERATIONS PORTAL ]
     ├── Real-Time Alert Stream & Drill-Down Forensics
     ├── Interactive TreeSHAP Waterfall Chart Visualizer
     ├── Model Governance & Confusion Matrix Calibrator
     └── Tenant Management & Zero-PII Data Matrix
```

### The Three Operational Pillars:
1. **Part A — External Bank & Customer Simulator:**
   * Simulates commercial mobile banking interfaces (ABA Bank, ACLEDA Bank, Wing Bank).
   * Supports **Bakong KHQR**, Visa/Mastercard swipe, and Direct Bank Transfer in **USD & KHR**.
   * Integrates authentic transfer receipts with embedded **SentinelPay Trust & Safety Badges**.
2. **Part B — SentinelPay Fraud Gateway:**
   * Enterprise REST API (`/api/v1/fraud/check`) with API Key authentication and anti-IDOR tenant scoping.
   * XGBoost 45-Tree Classifier (`PR-AUC 0.9990`, `Recall 98.61%`, `Precision 97.93%`).
   * Fast TreeSHAP explainer generating sub-15ms local marginal Shapley feature attributions.
   * State Machine callback (`/api/v1/verification/result`) mutating transaction status to `RELEASED` or `BLOCKED`.
   * Real-Time Push Hub via FastAPI WebSockets (`/ws/alerts`).
   * Multi-tenant MySQL / SQLite persistence with schema field mapping and immutable audit trails.
3. **Part C — SentinelPay Analyst Portal:**
   * Live real-time WebSocket alert stream table with instant drill-down.
   * Portfolio surveillance dashboard scoped by financial institution.
   * Interactive TreeSHAP waterfall forensics visualizer.
   * Model governance, threshold calibration tables, and confusion matrix.
   * Institution onboarding, API credentials manager, and schema field normalization builder.
   * Data Privacy & Minimization visual matrix (Zero-PII guarantee).

---

## 3. Deterministic vs. Probabilistic Separation

| System Component | Nature | Implementation | Rationale |
| :--- | :---: | :--- | :--- |
| **Multivariate Risk Scoring** | **Probabilistic** | XGBoost Classifier ($P(\text{fraud} \mid x) \in [0, 1]$) | Handles nonlinear feature interactions across 9 dimensions in sub-3ms. |
| **Feature Attribution** | **Probabilistic** | Exact TreeSHAP (`tree_path_dependent`) | Computes exact marginal Shapley values for human-in-the-loop auditability. |
| **Currency Conversion** | **Deterministic** | 4,050 KHR = $1 USD fixed rate normalization | Payment amounts must be standardized precisely before model ingestion. |
| **Operational Tier Routing** | **Deterministic** | Threshold cutoffs ($<0.35$, $0.35–0.70$, $\ge0.70$) | Translates continuous probability into discrete banking actions. |
| **Safety Circuit Breakers** | **Deterministic** | Hard rules (amount $\ge \$5,000$, velocity bursts) | Protects against model blindspots or extreme outlier transactions. |
| **Verification State Machine** | **Deterministic** | `PENDING` $\to$ `SOFT_BLOCKED` $\to$ `RELEASED`/`BLOCKED` | Financial state transitions must be mathematically strictly verifiable. |
| **Customer Authentication** | **Deterministic** | Bank OTP / Biometric FaceID challenge | Cardholder identity verification is executed exclusively by the bank switch. |

---

## 4. Machine Learning & Benchmarks

Evaluated on an **untouched holdout test set of 12,000 transactions** with genuine 1.20% class imbalance:

| Model | Precision | Recall | F1-Score | ROC-AUC | PR-AUC | Selection Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression (Baseline)** | 56.85% | 95.14% | 0.7117 | 0.9981 | 0.9507 | Baseline |
| **Random Forest** | 94.67% | 98.61% | 0.9660 | 1.0000 | 0.9971 | Candidate |
| **XGBoost (Champion)** | **97.93%** | **98.61%** | **0.9827** | **1.0000** | **0.9990** | **Active Production Weights** |

### Calibrated Operational Tiers
* **LOW RISK (< 0.35):** 100% Recall, 0.08% FPR $\rightarrow$ **Auto-Approved (Clearance)**
* **REVIEW (0.35 - 0.70):** 99.30% Precision, 98.61% Recall $\rightarrow$ **Step-Up Verification Required**
* **HIGH RISK (>= 0.70):** 99.29% Precision, 0.01% FPR $\rightarrow$ **Critical Hold / Denial**

---

## 5. Standardized Gateway API Contracts

### A. Fraud Risk Evaluation
```http
POST /api/v1/fraud/check
Headers:
  X-API-KEY: aba_sandbox_live_key_9f83a
  X-INSTITUTION-ID: ABA
Content-Type: application/json

{
  "transaction_token": "ABA-TX-10029",
  "amount": 1800.00,
  "currency": "USD",
  "payment_method": "KHQR",
  "distance": 850.0,
  "time_delta": 0.15,
  "merchant_risk": 0.85,
  "device_trust": 0.21
}
```

**Response (Synchronous < 15ms):**
```json
{
  "transaction_token": "ABA-TX-10029",
  "institution_code": "ABA",
  "fraud_probability": 0.8742,
  "risk_level": "HIGH",
  "action": "STEP_UP_REQUIRED",
  "requires_verification": true,
  "status": "SOFT_BLOCKED",
  "is_fallback": false,
  "explanation": [
    { "feature": "distance", "label": "Distance from Home (km)", "contribution": 5.4021, "direction": "RISK_INCREASING" },
    { "feature": "device_trust", "label": "Device Trust Score", "contribution": 2.4812, "direction": "RISK_INCREASING" }
  ],
  "processed_at": "2026-09-29T08:15:30Z"
}
```

### B. Step-Up Verification State Machine Callback
```http
POST /api/v1/verification/result
Headers:
  X-API-KEY: aba_sandbox_live_key_9f83a
  X-INSTITUTION-ID: ABA
Content-Type: application/json

{
  "transaction_token": "ABA-TX-10029",
  "verification": "APPROVED",
  "auth_method": "BANK_OTP",
  "reason": "Customer confirmed 6-digit challenge in ABA Mobile"
}
```

---

## 6. Reliability, Safety & Failure Handling

SentinelPay is engineered for mission-critical payment rails where service downtime is unacceptable:

1. **Graceful Heuristic Fallback Engine:**
   * If the XGBoost model or preprocessor encounters a runtime failure or missing weight files, `PredictionService` and `ShapService` gracefully degrade to a deterministic heuristic scoring engine without throwing HTTP 500 errors.
   * Responses flag `is_fallback: true` and record `FALLBACK_HEURISTIC_EVALUATED` in the audit log.
2. **Fail-Safe Security Posture:**
   * During degraded fallback, transactions with high amounts or anomalous signals are safely routed to `REVIEW` (`SOFT_BLOCKED`) rather than being blindly auto-approved.
3. **Pydantic Contract Validation:**
   * Requests are validated for negative amounts ($gt=0$), invalid risk bounds ($0.0 \le r \le 1.0$), and data types before reaching the AI engine.
4. **Automated Reliability Verification:**
   * Unit test `test_model_failure_graceful_fallback` explicitly verifies system survivability during simulated model outages.

---

## 7. Security & Responsible AI

1. **Zero-PII Data Minimization:**
   * SentinelPay operates entirely on **contextual and behavioural vectors**.
   * The AI engine **never** receives, stores, or processes cardholder names, PANs (credit card numbers), CVVs, phone numbers, or account balances.
2. **Anti-IDOR Multi-Tenant Authorization:**
   * SHA-256 hashed API keys (`X-API-KEY`) verified against tenant identity (`X-INSTITUTION-ID`).
   * Database queries strictly enforce tenant scoping: Institution A can never access Institution B's transactions (HTTP 404 / 403 returned).
3. **AI Risks & Implemented Mitigations:**
   * **Adversarial Evasion:** Fraudsters splitting charges are caught by trailing 1-hour and 24-hour velocity counters and burst time-delta heuristics.
   * **False Positive Customer Friction:** 3-tier step-up architecture provides soft-blocking with instant 1-tap OTP self-clearance.
   * **Concept Drift:** Cardholder verification outcomes (`final_label = 0` or `1`) are logged for governed offline model retraining.

---

## 8. Quick Start & Execution

### 1. Backend Server
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run automated test suite (31/31 tests passing)
python -m pytest tests/ -v

# Start FastAPI backend with Gateway and WebSockets
python -m uvicorn backend.main:app --reload --port 8000
```
* Interactive OpenAPI Swagger: `http://localhost:8000/docs`

### 2. Frontend Interface
```bash
cd frontend
npm install
npm run dev
```
* Web Portal: `http://localhost:5173`

### 3. Automated End-to-End Capstone Demonstration Script
Run the automated multi-tenant demonstration runner directly in your terminal:
```bash
python test_demo_flow.py
```

### 4. Containerized Multi-Service Deployment (Docker Compose)
```bash
docker compose up --build -d
```

---

## 9. Capstone Submission Deliverables

| Deliverable | File Link | Description |
| :--- | :--- | :--- |
| **System Architecture Diagrams** | [ARCHITECTURE_DIAGRAMS.md](file:///c:/aiFinalYEAR3/creditCardFraudDetection/ARCHITECTURE_DIAGRAMS.md) | 12 full-system Mermaid diagrams (Architecture, ERD, Sequences, Retraining, Security, Tests). |
| **AI Evaluation Report** | [EVALUATION_REPORT.md](file:///c:/aiFinalYEAR3/creditCardFraudDetection/EVALUATION_REPORT.md) | Full evaluation evidence, holdout test metrics, PR-AUC analysis, and failure cases. |
| **Presentation Slide Deck** | [SLIDE_DECK.md](file:///c:/aiFinalYEAR3/creditCardFraudDetection/SLIDE_DECK.md) | 15-slide capstone presentation + 6 technical defense backup slides. |
| **Individual Contribution** | [INDIVIDUAL_CONTRIBUTION.md](file:///c:/aiFinalYEAR3/creditCardFraudDetection/INDIVIDUAL_CONTRIBUTION.md) | One-page statement detailing "What I Did" and "What I Learnt". |
| **Technical Defense Guide** | [TECHNICAL_DEFENSE_GUIDE.md](file:///c:/aiFinalYEAR3/creditCardFraudDetection/TECHNICAL_DEFENSE_GUIDE.md) | Comprehensive examiner Q&A covering every defense expectation. |
| **Demo Script & Guide** | [DEMO_SCRIPT.md](file:///c:/aiFinalYEAR3/creditCardFraudDetection/DEMO_SCRIPT.md) | 15-minute live presentation walkthrough across 5 core real-world scenarios. |

---

## 10. Known Limitations & Future Work

1. **Transaction-Level vs. Graph-Level Modeling:**
   * *Limitation:* Features are currently evaluated per transaction vector.
   * *Future Work:* Incorporate Graph Neural Networks (GNNs) using PyTorch Geometric to detect multi-hop mule account rings across institutions.
2. **Offline vs. Online Continuous Learning (MLOps):**
   * *Limitation:* Feedback is stored in database for scheduled batch retraining.
   * *Future Work:* Implement automated continuous drift detection (Population Stability Index) with blue-green canary model deployments.
3. **Hardware Security Module (HSM) Integration:**
   * *Limitation:* Software-level SHA-256 API key hashing.
   * *Future Work:* Hardware-backed cryptographic signing (Ed25519) for enterprise PCI-DSS Level 1 bank switch integration.
