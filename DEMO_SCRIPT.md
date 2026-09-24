# SentinelPay -- Capstone Demonstration Script

## Pre-Demonstration Setup

### Terminal 1: Start Backend
```bash
python -m uvicorn backend.main:app --reload --port 8000
```
Wait for `[INIT] SentinelPay Backend Services & SHAP Engine Initialized.` to appear.

### Terminal 2: Start Frontend
```bash
cd frontend
npm run dev
```
Wait for `Local: http://localhost:5173/` to appear.

### Browser
Open `http://localhost:5173` in Chrome or Edge. The SentinelPay institutional banking interface should load with a dark obsidian theme.

---

## Demonstration Flow (15-20 minutes)

### Act 1: System Overview (2 minutes)

**Navigate to:** Model Intelligence page (via sidebar).

**Talking Points:**
- "SentinelPay is an end-to-end AI credit card fraud detection system. It is not just a Jupyter notebook -- it is a fully integrated product with a machine learning backend, explainable AI, a dynamic verification state machine, and a production-ready React frontend."
- Point to the performance benchmarks: "Our champion XGBoost model achieves **97.93% precision** and **98.61% recall** on an untouched holdout test set of 12,000 transactions, with a PR-AUC of 0.999."
- Point to the confusion matrix: "On 12,000 test transactions, the model produced only **3 false positives** and missed only **2 fraud cases**."
- Point to the global SHAP rankings: "Using TreeSHAP, we can rank feature importance: distance from home, device trust, and time since last transaction are the top three drivers."
- Point to the threshold calibration table: "Instead of a fixed 0.50 cutoff, we calibrated three operational tiers mapped to real business actions."

---

### Act 2: Scenario A -- Legitimate Transaction (3 minutes)

**Navigate to:** Checkout Terminal page (via sidebar).

**Steps:**
1. Click the **"Routine Everyday Grocery"** preset button.
   - This loads: $38.50 amount, 4.2km distance, trusted device (0.98), low merchant risk (0.08).
2. Point out the virtual card preview with EMV chip and masked PAN.
3. Click **"Authorize Transaction"**.

**Expected Result:**
- Response code: `AUTH 00: APPROVED`
- Risk Level: `LOW`
- Fraud probability: near 0.00%
- Status: `APPROVED` (auto-cleared, no MFA required)

**Talking Points:**
- "The model correctly identifies this as a routine transaction. The customer experiences zero friction -- the payment clears instantly."
- Point to the SHAP explanation section: "The top negative contributors are high device trust and short distance, which push the probability away from fraud."

---

### Act 3: Scenario B -- Suspicious Purchase with MFA Resolution (5 minutes)

**Navigate to:** Checkout Terminal page.

**Steps:**
1. Click the **"High-Value Travel Spree"** preset button.
   - This loads: $1,850.00 amount, 890km distance, untrusted device (0.12), high merchant risk (0.85).
2. Click **"Authorize Transaction"**.

**Expected Result:**
- Response code: `AUTH 85: SOFT BLOCK / STRONG CUSTOMER AUTHENTICATION REQUIRED`
- Risk Level: `HIGH`
- Fraud probability: ~99.98%
- Status: `SOFT_BLOCKED`
- The **Step-Up MFA Challenge Modal** appears automatically.

**Talking Points:**
- "The model has flagged this as high risk. But instead of hard-blocking the customer, SentinelPay enters a dynamic verification loop."
- "This simulates PSD2 Strong Customer Authentication (3DS2). The cardholder receives a 6-digit OTP challenge."
- Point to the SHAP waterfall: "Distance from home contributes +5.4 to the risk score. The untrusted device adds +2.5. These are the top two reasons the model flagged this transaction."

3. In the MFA modal, the 6-digit code `123456` should already be pre-filled.
4. Click **"Authorize & Release Payment"**.

**Expected Result:**
- Status transitions: `SOFT_BLOCKED` -> `VERIFIED`
- Message: "Transaction successfully verified and payment released."
- A feedback record is written to the database with `final_label = 0` (legitimate).

**Talking Points:**
- "The customer has confirmed their identity. The payment is released, and a feedback record is logged. This feedback will be used in the next retraining cycle to teach the model that high-distance transactions from this cardholder may be legitimate travel."

---

### Act 4: Scenario C -- Account Takeover Attack (4 minutes)

**Navigate to:** Checkout Terminal page.

**Steps:**
1. Click the **"Account Takeover Attack"** preset button.
   - This loads: $2,650.00 amount, 2,100km distance, untrusted device (0.05), very high merchant risk (0.92).
2. Click **"Authorize Transaction"**.

**Expected Result:**
- Response code: `AUTH 85: SOFT BLOCK`
- Risk Level: `HIGH`
- Fraud probability: ~99.98%
- The MFA Challenge Modal appears.

3. In the MFA modal, click **"Deny & Confirm Fraud"** (the red button).

**Expected Result:**
- Status transitions: `SOFT_BLOCKED` -> `BLOCKED`
- Message: "Transaction blocked. Security feedback logged for future model retraining."
- A feedback record is written with `final_label = 1` (confirmed fraud).

**Talking Points:**
- "In this scenario, the real cardholder sees a transaction they did not initiate. By clicking Deny, they confirm it as fraud. The transaction is permanently blocked, and this confirmed-fraud label enters the retraining feedback pool."
- "This closes the human-in-the-loop. The model learns from every cardholder decision."

---

### Act 5: SHAP Intelligence Deep Dive (2 minutes)

**Navigate to:** Transaction Intelligence page.

**Talking Points:**
- "This page provides a full SHAP waterfall visualization for any past transaction."
- Select a transaction from the audit stream on the left.
- "Red bars push the probability toward fraud. Green bars push it toward legitimate. The model is fully transparent -- we can explain every single decision."

---

### Act 6: Admin Surveillance Dashboard (2 minutes)

**Navigate to:** Dashboard page.

**Talking Points:**
- Point to KPI cards: "Total volume processed, fraud interception rate, and the number of feedback records ready for retraining."
- Point to the risk distribution bar: "This shows the operational distribution across LOW, REVIEW, and HIGH tiers."
- Point to the audit table: "Every transaction is logged with its token, amount, risk level, and status. Analysts can search and filter in real time."

---

### Act 7: Human-in-the-Loop Retraining (2 minutes)

**In Terminal 3 (separate from running servers):**
```bash
python ml/scripts/retrain_feedback_loop.py
```

**Expected Output:**
- The script queries feedback records from the database.
- Augments the training set with verified cardholder labels.
- Retrains XGBoost with SMOTE on the augmented training split.
- Evaluates on the untouched holdout test set.
- If quality gate passes (PR-AUC >= 0.95, Recall >= 0.90), promotes the new model version.

**Talking Points:**
- "This is the complete human-in-the-loop feedback cycle. Every cardholder verification action feeds back into the model's training data. The model continuously improves from real-world decisions."

---

## Backup: Terminal-Only Demo

If the frontend is unavailable, run the complete 3-scenario demonstration in terminal:
```bash
python test_demo_flow.py
```
This executes all three scenarios through the FastAPI backend and prints results to stdout.

---

## Test Suite Verification

To demonstrate code quality and test coverage:
```bash
python -m pytest tests/ -v
```
Expected: **19/19 tests passing** (unit tests, integration tests, verification flow tests, and edge cases).

---

## Key Technical Details for Q&A

| Topic | Answer |
|:------|:-------|
| **Why XGBoost over Random Forest?** | XGBoost achieves 97.93% precision vs 94.67% for RF (62.5% fewer false positives) with identical recall. TreeSHAP provides exact polynomial-time explanations. |
| **How do you prevent data leakage?** | Stratified 80/20 split first. RobustScaler and SMOTE fitted strictly on the training fold. Test set is never seen during training or preprocessing. |
| **Why PR-AUC instead of accuracy?** | Under 1.2% fraud rate, a naive model achieves 98.8% accuracy by predicting all-legitimate. PR-AUC is the gold standard for imbalanced classification. |
| **Why not a fixed 0.50 threshold?** | Asymmetric costs (missed fraud >> false alarm) and tiered business logic require calibrated operational boundaries. Our three-tier system balances fraud interception with customer experience. |
| **How fast are SHAP explanations?** | TreeSHAP achieves sub-30ms P95 latency, well within the 100ms authorization window. |
| **What is the feedback loop?** | Cardholder APPROVE/DENY actions during MFA create ground-truth labels stored in the feedback table. The retraining script ingests these labels, augments the training set, retrains the model, and validates against quality gates before promotion. |
| **What database do you use?** | SQLite for zero-friction local development, MySQL for Docker/production. SQLAlchemy ORM supports both transparently. |
| **How is the frontend styled?** | Institutional banking design system: dark obsidian palette, Inter + JetBrains Mono typography, Lucide icons, zero emojis. Modeled after Stripe Radar and Goldman Sachs Marquee. |
