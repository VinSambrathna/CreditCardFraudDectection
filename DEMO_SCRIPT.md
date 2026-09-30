# SentinelPay — Capstone Live Demonstration Script
## Multi-Tenant AI Fraud Intelligence Platform

---

## 1. Pre-Demonstration Setup

### Terminal 1: FastAPI Backend
```bash
python -m uvicorn backend.main:app --reload --port 8000
```
*Expected log:* `[INIT] SentinelPay Backend Services, Gateway & SHAP Engine Initialized.`

### Terminal 2: React Vite Frontend
```bash
cd frontend
npm run dev
```
*Expected log:* `Local: http://localhost:5173/`

### Browser Access
Open `http://localhost:5173` in Google Chrome or Microsoft Edge.

---

## 2. Live Demonstration Flow (15 Minutes)

### Act 1: The B2B Architecture Pitch (2 Minutes)
**Navigate to:** `#/overview` (Landing Page)

**Talking Points for Examiners:**
1. *"SentinelPay is not just a standalone payment demo. It is a multi-tenant AI fraud intelligence platform that commercial banks (like ABA Bank, ACLEDA Bank, and Wing Bank) integrate into their existing core banking switches."*
2. *"Our system operates across 3 interconnected layers:*
   * **Part A:** The external Bank & Customer Simulator.
   * **Part B:** The SentinelPay Integration Gateway, ML Classifier (XGBoost) & TreeSHAP Engine.
   * **Part C:** The Fraud Analyst Operations & Forensics Portal.*"

---

### Act 2: Demo 1 — Routine KHQR Payment Auto-Cleared (2 Minutes)
**Navigate to:** `#/simulator` (Bank Simulator)

**Actions:**
1. Verify the selected institution is **ABA Bank (Simulated)**.
2. Click **Scenario A: Normal KHQR**.
   * Merchant: *Phnom Penh Coffee (BKK1)*
   * Amount: *$8.50 USD* via *KHQR*
   * Geolocation: *1.2 km from home* | Device Trust: *98%*
3. Click **"Pay $8.50 via KHQR"**.

**Expected Result:**
* The phone displays the authentic **In-App Native Push Notification**: `ABA Mobile • Transfer Successful (SentinelPay Shield: Cleared 3.4%)`.
* The phone renders the **Official ABA Transfer Slip**:
  * Clean authentic receipt design with reference token, settled amount, and Bakong KHQR network tags.
  * **🔥 Embedded SentinelPay Trust & Safety Badge**: Shows risk probability (<4% Low Risk), latency (~18ms), device trust (98%), and radial distance (1.2 km).
  * **Interactive TreeSHAP feature contributions** can be expanded directly on the customer's mobile receipt slip.
* Balance decreases smoothly with zero customer friction.

**Talking Points for Lecturer / Examiners:**
* *"Notice how practical this is: Rather than only showing an alert on an administrative back-office dashboard, the real-world bank mobile app itself receives and renders the SentinelPay AI clearance audit directly inside the customer's transfer slip."*
* *"The customer sees transparent, explainable proof of trust while experiencing seamless sub-20ms clearing."*

---

### Act 3: Demo 2 & 3 — Suspicious Attack & Step-Up Verification (4 Minutes)
**Navigate to:** `#/simulator` (Bank Simulator)

**Actions:**
1. Click **Scenario C: Confirmed Fraud**.
   * Merchant: *Poipet Border Duty Free*
   * Amount: *$1,800.00 USD*
   * Distance: *850 km* | Device Trust: *10% (Unrecognized foreign proxy)*
2. Click **"Pay $1,800.00 via KHQR"**.

**Expected Result:**
* Gateway evaluates risk at **87%+ (HIGH Risk)** and triggers **STEP_UP_REQUIRED**.
* Payment is paused in `SOFT_BLOCKED`.
* The phone displays the **Bank-Controlled Step-Up Security Screen**:
  * An urgent in-app alert banner: `⚠️ SentinelPay Risk Advisory: Unusual Activity Detected`.
  * Rationale displayed: `Poipet Border Duty Free ($1,800.00) flagged for travel anomaly (850 km) & 10% device trust`.
  * Realistic customer authentication options: 4-digit Bank PIN or Biometric FaceID scan.

**Talking Points:**
* *"Notice that SentinelPay does NOT authenticate the customer directly. SentinelPay advises the bank: 'This transaction is high risk; execute step-up authentication.'"*
* *"The bank challenges the customer via SMS OTP or FaceID."*

3. In the modal, explain: *"The cardholder realizes they did not make this purchase at the border."*
4. Click **"I Did Not Authorize This (Block & Report)"**.

**Expected Result:**
* Bank sends callback to `POST /api/v1/verification/result`.
* State machine mutates transaction from `SOFT_BLOCKED` directly to **`BLOCKED`**.
* The mobile phone renders the **Authentic Bank Fraud Interception & Defense Screen**:
  * Pulsing red security shield: `Transaction Blocked by SentinelPay Fraud Engine`.
  * Prominent reassurance: `No Money Was Deducted ($0.00 Debited)`.
  * Full breakdown of hostile indicators (850 km border anomaly, 10% device trust, TreeSHAP attributions).
  * Direct customer action: **"Freeze Visa Card & Account"** button inside the app.
* Feedback is tagged with `final_label = 1` for governed offline retraining.

---

### Act 4: Demo 4 & 5 — Real-Time Alert Stream & TreeSHAP Forensics (3 Minutes)
**Navigate to:** `#/alerts` (Live Alerts Feed)

**Actions:**
1. Observe the top row: The `$1,800.00` intercepted transaction appears in the live feed.
2. Note the **WebSocket live stream badge** (`ws://localhost:8000/ws/alerts`).
3. Click **"SHAP Waterfall"** on that transaction (navigates to Forensics).

**Talking Points on Forensics Page:**
* *"Explainable AI is central to banking compliance. We compute exact Shapley values using TreeSHAP in under 10 milliseconds."*
* Point to the waterfall bars:
  * Distance (+5.4 log-odds) pushes the score toward fraud.
  * Device trust (+2.3 log-odds) pushes the score toward fraud.
  * Time delta (+0.9 log-odds) confirms velocity anomaly.
* *"The bank fraud analyst can justify the block to regulators and customers with mathematical certainty."*

---

### Act 5: Demo 6 — Privacy by Design (2 Minutes)
**Navigate to:** `#/privacy` (Data Privacy Screen)

**Talking Points for Examiners:**
1. *"One of the greatest obstacles to deploying AI in banking is customer privacy and bank secrecy."*
2. Point to the matrix:
   * **What SentinelPay Receives:** Only mathematical behavioral metrics (amount, radial distance, device confidence score, MCC risk).
   * **What SentinelPay NEVER Receives:** Passwords, card PINs, raw 16-digit PANs, CVV, OTP codes, KYC national IDs, or customer bank balances.
3. *"Identity and authentication remain inside the bank. SentinelPay is a pure risk intelligence layer."*

---

### Act 6: Demo 7 — Developer API & Multi-Tenancy (2 Minutes)
**Navigate to:** `#/docs` (API Specification) or `#/integration` (Institutions)

**Actions:**
1. Show the standardized `POST /api/v1/fraud/check` specification.
2. Select **ACLEDA Bank** and copy the cURL command.
3. Open `http://localhost:8000/docs` in a new tab to show the live FastAPI OpenAPI documentation.
4. Execute `POST /api/v1/fraud/check` directly in Swagger with header `X-API-KEY: aba_sandbox_live_key_9f83a`.

**Talking Points:**
* *"The platform is completely production-ready with OpenAPI 3.0 specs, tenant-scoped API authentication, anti-IDOR authorization checks, and multi-tenant database isolation."*

---

## 3. Summary of Key Achievements for Examination Defense
* **Predictive Accuracy:** XGBoost model with `PR-AUC 0.9990`, `Recall 98.61%`, `Precision 97.93%` on an untouched 12,000-sample test set.
* **Explainability:** Exact local TreeSHAP feature attributions on every screened transaction.
* **Architecture:** 3-tier enterprise integration decoupling bank authentication from AI inference.
* **Cambodian Relevance:** Support for Bakong KHQR, KHR/USD currency normalization, and realistic merchant geographies.
* **Compliance & Security:** Multi-tenant anti-IDOR isolation, immutable audit logging, and zero-PII data minimization.
