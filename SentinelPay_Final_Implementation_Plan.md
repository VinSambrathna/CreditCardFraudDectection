# SentinelPay — Final AI Capstone Implementation Plan

## 1. Project Overview

**Project Title:**  
SentinelPay: An End-to-End Credit Card Fraud Detection Web Application featuring Explainable AI (XAI) and Dynamic Verification Loops

**Goal:**  
Build a complete AI-powered fraud detection product that combines:

- Machine learning fraud detection
- Imbalanced-data handling
- Explainable AI using SHAP
- FastAPI backend
- MySQL database
- Modern React frontend
- Dynamic step-up authentication / simulated MFA
- Feedback collection for future retraining
- Docker-based deployment

The final product should demonstrate that SentinelPay is not only an ML model, but an end-to-end AI application.

---

# 2. Final Technology Stack

## Frontend

- React
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Recharts
- Lucide React

## Backend

- Python
- FastAPI
- Pydantic
- SQLAlchemy

## Machine Learning

- Python
- Pandas
- NumPy
- Scikit-learn
- XGBoost
- imbalanced-learn / SMOTE
- SHAP

## Database

- MySQL

## Deployment

- Docker
- Docker Compose

## Development / Research

- Jupyter Notebook
- VS Code
- Git / GitHub

---

# 3. Final System Architecture

```text
                         SENTINELPAY
                              │
                              ▼
                 ┌─────────────────────────┐
                 │     React Frontend      │
                 │                         │
                 │ Tailwind + shadcn/ui    │
                 │ Framer Motion            │
                 │ Recharts                 │
                 └────────────┬────────────┘
                              │
                         REST / JSON
                              │
                              ▼
                 ┌─────────────────────────┐
                 │      FastAPI Backend    │
                 │                         │
                 │ Prediction API          │
                 │ Verification API        │
                 │ Transaction API          │
                 │ Dashboard API            │
                 └────────────┬────────────┘
                              │
               ┌──────────────┼──────────────┐
               │              │              │
               ▼              ▼              ▼
        ┌────────────┐ ┌────────────┐ ┌────────────┐
        │ ML Engine  │ │ SHAP XAI   │ │   MySQL    │
        │            │ │            │ │            │
        │ XGBoost    │ │ Local      │ │ Users      │
        │ Random     │ │ Global     │ │ Transactions│
        │ Forest     │ │ Explain.   │ │ MFA Events │
        │ SMOTE      │ │            │ │ Feedback   │
        └────────────┘ └────────────┘ └────────────┘
                              │
                              ▼
                     Docker / Compose
```

---

# 4. Core User Flow

The main demonstration flow should be:

```text
Customer
   │
   ▼
Makes Payment
   │
   ▼
React Checkout
   │
   ▼
POST /predict
   │
   ▼
FastAPI
   │
   ▼
ML Model
   │
   ▼
Fraud Probability
   │
   ├───────────────┐
   │               │
 Low Risk       High Risk
   │               │
   ▼               ▼
Approved       Soft Block
                   │
                   ▼
                  SHAP
                   │
                   ▼
             Explain Risk
                   │
                   ▼
             Simulated MFA
              ┌────┴────┐
              │         │
           Approve     Deny
              │         │
              ▼         ▼
           Release    Block
              │         │
              └────┬────┘
                   ▼
              Store Feedback
                   │
                   ▼
             Future Retraining
```

---

# 5. Project Structure

```text
sentinelpay/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── RiskCard.jsx
│   │   │   ├── TransactionTable.jsx
│   │   │   ├── ShapChart.jsx
│   │   │   ├── RiskBadge.jsx
│   │   │   └── Navbar.jsx
│   │   │
│   │   ├── pages/
│   │   │   ├── Checkout.jsx
│   │   │   ├── TransactionResult.jsx
│   │   │   ├── Verification.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── TransactionDetails.jsx
│   │   │   └── ModelIntelligence.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   └── App.jsx
│   │
│   ├── package.json
│   └── Dockerfile
│
├── backend/
│   ├── main.py
│   │
│   ├── api/
│   │   ├── prediction.py
│   │   ├── verification.py
│   │   ├── transactions.py
│   │   └── dashboard.py
│   │
│   ├── schemas/
│   │   ├── transaction.py
│   │   ├── prediction.py
│   │   └── verification.py
│   │
│   ├── services/
│   │   ├── prediction_service.py
│   │   ├── shap_service.py
│   │   └── verification_service.py
│   │
│   ├── database/
│   │   ├── connection.py
│   │   ├── models.py
│   │   └── crud.py
│   │
│   ├── ml/
│   │   ├── fraud_model.pkl
│   │   ├── preprocessor.pkl
│   │   └── feature_config.json
│   │
│   ├── requirements.txt
│   └── Dockerfile
│
├── ml/
│   ├── notebooks/
│   │   ├── 01_eda.ipynb
│   │   ├── 02_preprocessing.ipynb
│   │   ├── 03_baseline.ipynb
│   │   ├── 04_model_training.ipynb
│   │   ├── 05_model_tuning.ipynb
│   │   └── 06_shap_analysis.ipynb
│   │
│   ├── data/
│   │   ├── raw/
│   │   ├── processed/
│   │   └── README.md
│   │
│   ├── models/
│   └── scripts/
│       ├── train.py
│       ├── evaluate.py
│       └── export_model.py
│
├── database/
│   └── init.sql
│
├── tests/
│   ├── test_model.py
│   ├── test_api.py
│   └── test_verification.py
│
├── docker/
│   └── README.md
│
├── docker-compose.yml
├── .env
├── .env.example
├── .gitignore
└── README.md
```

---

# 6. Dataset Strategy

## Primary ML Dataset

Use a public credit-card fraud dataset as the primary source for model development.

The actual dataset and its available features must be documented before implementation.

Do not artificially modify the test set to achieve a target score.

## Application Simulation Data

Use synthetic user profiles and transaction scenarios for the web application.

Example simulated attributes:

- User ID
- Home location
- Typical spending range
- Transaction velocity
- Device trust
- Merchant risk
- Transaction amount

## Important Principle

Keep the distinction between:

1. **Real/public benchmark data used for ML evaluation**
2. **Synthetic application data used to demonstrate realistic workflows**

If the final model requires features that are not present in the selected public dataset, document and implement a justified feature-engineering strategy rather than silently mixing incompatible datasets.

---

# 7. Machine Learning Pipeline

```text
Raw Dataset
    ↓
Data Cleaning
    ↓
EDA
    ↓
Feature Engineering
    ↓
Train/Test Split
    ↓
Preprocessing
    ↓
SMOTE on Training Data Only
    ↓
Model Training
    ↓
Hyperparameter Tuning
    ↓
Threshold Analysis
    ↓
Evaluation
    ↓
Final Model
    ↓
SHAP
    ↓
Model Export
```

---

# 8. Notebook 01 — EDA

File:

```text
ml/notebooks/01_eda.ipynb
```

Tasks:

- Load dataset
- Inspect shape
- Inspect data types
- Check missing values
- Check duplicates
- Analyze outliers
- Analyze class distribution
- Analyze feature distributions
- Analyze correlations
- Compare legitimate vs fraudulent transactions

Required outputs:

- Dataset summary
- Class imbalance visualization
- Feature distribution plots
- Correlation analysis
- Initial observations

---

# 9. Notebook 02 — Preprocessing

File:

```text
ml/notebooks/02_preprocessing.ipynb
```

Tasks:

- Clean invalid records
- Select features
- Encode categorical features if required
- Scale features if required
- Split train/test data
- Apply SMOTE only to training data
- Save preprocessing pipeline

Correct sequence:

```text
Dataset
   ↓
Train/Test Split
   ↓
Training Data → SMOTE
Testing Data  → Untouched
```

Avoid data leakage.

---

# 10. Notebook 03 — Baseline Model

File:

```text
ml/notebooks/03_baseline.ipynb
```

Train a simple Logistic Regression model first.

Purpose:

- Establish a baseline
- Provide a reference point
- Compare later models objectively

Record:

- Precision
- Recall
- F1-score
- ROC-AUC
- PR-AUC
- Confusion matrix

Accuracy can be reported, but it should not be the primary optimization metric because of class imbalance.

---

# 11. Notebook 04 — Model Training

File:

```text
ml/notebooks/04_model_training.ipynb
```

Train:

### Model 1
Logistic Regression

### Model 2
Random Forest / Balanced Random Forest

### Model 3
XGBoost

Create a comparison table:

| Model | Precision | Recall | F1 | ROC-AUC | PR-AUC |
|---|---:|---:|---:|---:|---:|
| Logistic Regression | TBD | TBD | TBD | TBD | TBD |
| Random Forest | TBD | TBD | TBD | TBD | TBD |
| XGBoost | TBD | TBD | TBD | TBD | TBD |

Do not decide the winner before running the experiments.

---

# 12. Notebook 05 — Hyperparameter Tuning

File:

```text
ml/notebooks/05_model_tuning.ipynb
```

Tune the selected candidate models.

Possible parameters include:

### Random Forest

- n_estimators
- max_depth
- min_samples_split
- min_samples_leaf

### XGBoost

- n_estimators
- max_depth
- learning_rate
- subsample
- min_child_weight

Use cross-validation.

Optimize according to the project's fraud-detection objective rather than accuracy alone.

---

# 13. Fraud Threshold Analysis

Do not automatically assume:

```text
probability >= 0.50 → fraud
```

Evaluate multiple thresholds.

Example:

```text
0.30
0.40
0.50
0.60
0.70
0.75
0.80
```

For each threshold calculate:

- Precision
- Recall
- F1
- False Positive Rate
- False Negative Rate

The initial application design may use:

```text
LOW       < 40%
REVIEW    40%–74.99%
HIGH      >= 75%
```

However, the final threshold must be justified using experimental results.

---

# 14. Required ML Evaluation

The final evaluation should contain:

- Confusion Matrix
- Precision
- Recall
- F1-score
- ROC-AUC
- PR-AUC
- False Positive Rate
- False Negative Rate

Primary considerations:

### Recall

How many actual fraudulent transactions were detected?

### Precision

How many flagged transactions were actually fraudulent?

### F1-score

How well are precision and recall balanced?

### PR-AUC

How well does the model distinguish the minority fraud class across thresholds?

---

# 15. Model Selection

Select the final model based on documented experimental results.

Do not select a model simply because it has the highest recall.

The final decision should consider:

```text
Fraud Detection
        +
False Positive Control
        +
Overall F1
        +
PR-AUC
        +
Operational threshold
```

Save the final model.

```text
backend/ml/fraud_model.pkl
backend/ml/preprocessor.pkl
backend/ml/feature_config.json
```

---

# 16. Notebook 06 — SHAP

File:

```text
ml/notebooks/06_shap_analysis.ipynb
```

Implement two explanation levels.

## Global Explanation

Answer:

> Which features generally influence fraud predictions?

Display feature importance.

## Local Explanation

Answer:

> Why was this specific transaction flagged?

Example output:

```text
Fraud Probability: 87%

Distance             +0.32
Time Delta           +0.21
Amount               +0.15
Merchant Risk        +0.08
Device Trust         -0.04
```

SHAP output should be converted into a format that FastAPI can return to the frontend.

---

# 17. Database Design

Use MySQL.

## users

```text
id
name
email
phone
created_at
```

## user_profiles

```text
id
user_id
home_location
average_spend
usual_transaction_velocity
device_trust_score
```

## transactions

```text
id
transaction_token
user_id
amount
distance
time_delta
merchant_risk
device_trust
fraud_probability
prediction
risk_level
status
created_at
```

## verification_events

```text
id
transaction_id
verification_type
status
attempted_at
completed_at
```

## feedback

```text
id
transaction_id
original_prediction
user_decision
final_label
added_to_training
created_at
```

## model_versions

```text
id
model_name
version
precision
recall
f1_score
pr_auc
trained_at
is_active
```

---

# 18. FastAPI Backend

## Required endpoints

```text
GET  /health

POST /predict

POST /verify

GET  /transactions

GET  /transactions/{id}

GET  /dashboard/statistics

GET  /model/info
```

---

# 19. POST /predict

Input:

```json
{
  "user_id": 1,
  "amount": 850.00,
  "distance": 420.5,
  "time_delta": 2.0,
  "merchant_risk": 0.82,
  "device_trust": 0.31
}
```

Processing:

```text
Request
   ↓
Pydantic validation
   ↓
Preprocessing
   ↓
ML prediction
   ↓
Fraud probability
   ↓
Risk classification
   ↓
SHAP explanation
   ↓
Save transaction
   ↓
Return response
```

Example response:

```json
{
  "transaction_id": "TX1007",
  "fraud_probability": 0.87,
  "risk_level": "HIGH",
  "status": "SOFT_BLOCKED",
  "requires_verification": true,
  "explanation": [
    {
      "feature": "distance",
      "contribution": 0.32
    }
  ]
}
```

---

# 20. Risk Decision Engine

Initial application logic:

```text
Probability
     │
     ├── Low
     │    ↓
     │  APPROVED
     │
     ├── Medium
     │    ↓
     │  REVIEW
     │
     └── High
          ↓
      SOFT BLOCK
          ↓
         MFA
```

The final thresholds should be supported by model evaluation.

---

# 21. MFA / Step-Up Verification

This is a simulated authentication process for the capstone.

## Approval

```text
Soft Block
    ↓
MFA
    ↓
User Approves
    ↓
Transaction Released
    ↓
Feedback Stored as Legitimate
```

## Denial

```text
Soft Block
    ↓
MFA
    ↓
User Denies / Timeout
    ↓
Transaction Blocked
    ↓
Feedback Stored as Fraud
```

The system should not claim to implement real banking authentication.

---

# 22. Feedback / Future Retraining

When a user resolves a soft block:

```text
Transaction
     ↓
MFA Result
     ↓
Feedback
     ↓
Database
     ↓
Future Training Dataset
```

Use wording such as:

> Feedback is collected for a future batch retraining cycle.

Do not claim real-time online learning unless it is actually implemented.

---

# 23. Final React UI

Streamlit should not be the final product interface.

Use:

- React
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Recharts
- Lucide React

The goal is a modern fintech/security product rather than a notebook-style dashboard.

---

# 24. React Page Structure

## Page 1 — Merchant Checkout

Purpose:

Simulate a customer making a payment.

Display:

- Product
- Amount
- Tokenized payment identifier
- Merchant information
- Pay button

Never store real card numbers.

---

## Page 2 — Transaction Result

### Low Risk

```text
✓ PAYMENT APPROVED

Risk Score
12%

Transaction ID
TX1001
```

### High Risk

```text
⚠ TRANSACTION FLAGGED

Risk Score
87%

Unusual transaction detected.

[ Verify Transaction ]
```

---

# 25. Page 3 — MFA Verification

Display:

```text
VERIFY YOUR TRANSACTION

Amount: $1,999.00

A suspicious transaction was detected.

Verification Code

[ • • • • • • ]

[ VERIFY ]
```

Success:

```text
✓ VERIFIED

Transaction approved.
```

---

# 26. Page 4 — Admin Dashboard

Include:

### Summary cards

- Total transactions
- Fraud detected
- Current fraud rate
- Detection recall
- Model version

### Charts

- Transaction volume
- Fraud trend
- Risk distribution
- Model performance

### Transaction table

Columns:

```text
Transaction ID
Amount
Risk
Probability
Status
Timestamp
```

---

# 27. Page 5 — Transaction Intelligence

When an administrator selects a transaction:

```text
Transaction TX1007

Fraud Probability
87%

Risk Level
HIGH

Status
SOFT BLOCKED
```

Then show:

### SHAP explanation

```text
WHY WAS THIS TRANSACTION FLAGGED?

Distance
████████████████  +0.32

Time Delta
███████████       +0.21

Amount
████████           +0.15

Merchant Risk
████               +0.08

Device Trust
██                 -0.04
```

This should be one of the project's major presentation screens.

---

# 28. Page 6 — Model Intelligence

Show:

- Current model
- Model version
- Precision
- Recall
- F1-score
- PR-AUC
- Training dataset size
- Fraud samples
- Last training date
- Feature importance

Example:

```text
MODEL INTELLIGENCE

XGBoost v1.0

Precision       TBD
Recall          TBD
F1 Score        TBD
PR-AUC          TBD

Feature Importance
Amount          ███████████
Distance        █████████
Time Delta      ███████
Device Trust    █████
Merchant Risk   ████
```

All metrics must come from the actual experiment.

---

# 29. UI Design Direction

The final visual direction should be:

**Modern • Premium • Clean • Trustworthy • Fintech • AI-focused**

Avoid:

- Excessive gradients
- Too many colors
- Dense tables
- Generic dashboard templates
- Excessive animations
- Fake AI terminology

Use:

- Clear hierarchy
- Spacious layouts
- Strong typography
- Subtle motion
- Professional data visualization
- Consistent status colors
- Clear risk indicators
- Smooth transaction-state transitions

Animations should communicate state changes rather than exist only for decoration.

---

# 30. Testing

## ML Tests

- Model loads successfully
- Preprocessor loads successfully
- Prediction returns probability
- Probability is between 0 and 1
- Feature order is correct

## API Tests

- GET /health
- POST /predict
- POST /verify
- GET /transactions
- GET /transactions/{id}
- GET /dashboard/statistics

## Verification Tests

- Low-risk transaction → approved
- High-risk transaction → soft block
- MFA approval → approved
- MFA denial → blocked
- Invalid verification → rejected

## Edge Cases

Test:

- Missing fields
- Invalid user
- Invalid transaction ID
- Negative amount
- Zero amount
- Extremely large amount
- Invalid verification code
- Malformed request
- Model unavailable
- Database unavailable

---

# 31. Docker Architecture

```text
                    Docker Compose
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
      Frontend        Backend          MySQL
       React          FastAPI           DB
          │              │
          │              ├── ML Model
          │              └── SHAP
          │
          └──────── REST API ────────→
```

Containers:

```text
sentinelpay-frontend
sentinelpay-backend
sentinelpay-mysql
```

Use environment variables for:

- Database credentials
- Database host
- API URL
- Application secrets

Do not commit `.env`.

Commit:

```text
.env.example
```

---

# 32. 12-Week Implementation Schedule

## Week 1 — Project Foundation

Tasks:

- Create Git repository
- Create folder structure
- Set up Python environment
- Install ML dependencies
- Install FastAPI dependencies
- Initialize React
- Initialize Tailwind
- Create initial README

Deliverable:

> Working project skeleton.

---

## Week 2 — Dataset & EDA

Tasks:

- Select public fraud dataset
- Download raw data
- Inspect dataset
- Analyze class imbalance
- Analyze missing values
- Analyze distributions
- Analyze correlations

Deliverable:

> `01_eda.ipynb`

---

## Week 3 — Preprocessing

Tasks:

- Data cleaning
- Feature engineering
- Train/test split
- Preprocessing pipeline
- SMOTE on training data only

Deliverable:

> `02_preprocessing.ipynb`

---

## Week 4 — Baseline

Tasks:

- Logistic Regression
- Evaluation
- Confusion matrix
- Precision
- Recall
- F1
- ROC-AUC
- PR-AUC

Deliverable:

> Baseline results.

---

## Week 5 — Main Models

Tasks:

- Random Forest
- XGBoost
- Compare models
- Generate evaluation tables

Deliverable:

> `04_model_training.ipynb`

---

## Week 6 — Optimization

Tasks:

- Hyperparameter tuning
- Threshold analysis
- Model selection
- Final evaluation

Deliverable:

> Final ML model.

---

## Week 7 — SHAP

Tasks:

- Global SHAP
- Local SHAP
- Validate explanations
- Export explanation format

Deliverable:

> `06_shap_analysis.ipynb`

---

## Week 8 — Model Packaging

Tasks:

- Export model
- Export preprocessor
- Create inference pipeline
- Test model outside notebook

Deliverable:

```text
fraud_model.pkl
preprocessor.pkl
feature_config.json
```

---

## Week 9 — FastAPI + Database

Tasks:

- Create MySQL database
- Create tables
- SQLAlchemy models
- Create FastAPI application
- Implement `/predict`
- Implement `/transactions`
- Implement `/health`

Deliverable:

> Working ML API.

---

## Week 10 — Verification System

Tasks:

- Implement risk engine
- Implement soft block
- Implement MFA
- Implement verification result
- Implement feedback storage

Deliverable:

> Complete transaction state machine.

---

## Week 11 — React Frontend

Tasks:

- Checkout
- Transaction result
- MFA
- Admin dashboard
- Transaction details
- SHAP visualization
- Model intelligence page
- Animations and responsive design

Deliverable:

> Complete user interface.

---

## Week 12 — Integration + Docker + Presentation

Tasks:

- Connect React → FastAPI
- Connect FastAPI → MySQL
- End-to-end testing
- Dockerize frontend
- Dockerize backend
- Docker Compose
- Final bug fixing
- Prepare presentation
- Prepare demo scenarios

Deliverable:

> Complete deployable SentinelPay system.

---

# 33. Final Demonstration Scenario

Prepare at least three transactions before the presentation.

## Scenario 1 — Legitimate Payment

```text
Customer pays
      ↓
Low risk
      ↓
Approved
```

Demonstrates:

- Frontend
- API
- ML prediction
- Normal transaction flow

---

## Scenario 2 — Suspicious Payment + MFA Approval

```text
Customer pays
      ↓
87% fraud probability
      ↓
Soft block
      ↓
SHAP explanation
      ↓
MFA
      ↓
User approves
      ↓
Payment released
```

Demonstrates:

- Fraud detection
- Risk threshold
- SHAP
- Dynamic verification
- False-positive resolution
- Feedback

This should be your main demo scenario.

---

## Scenario 3 — Suspicious Payment + MFA Denial

```text
Customer pays
      ↓
High risk
      ↓
Soft block
      ↓
MFA
      ↓
User denies
      ↓
Transaction blocked
      ↓
Feedback recorded
```

Demonstrates:

- Fraud prevention
- Account/transaction protection
- Verification failure handling
- Feedback logging

---

# 34. Final Capstone Deliverables

By the end, you should have:

## AI

- [ ] Public fraud dataset
- [ ] EDA notebook
- [ ] Preprocessing pipeline
- [ ] SMOTE
- [ ] Logistic Regression baseline
- [ ] Random Forest
- [ ] XGBoost
- [ ] Hyperparameter tuning
- [ ] Threshold analysis
- [ ] Precision
- [ ] Recall
- [ ] F1
- [ ] ROC-AUC
- [ ] PR-AUC
- [ ] Confusion matrix
- [ ] Final exported model

## XAI

- [ ] Global SHAP
- [ ] Local SHAP
- [ ] API SHAP response
- [ ] Frontend SHAP visualization

## Backend

- [ ] FastAPI
- [ ] Pydantic
- [ ] Prediction API
- [ ] Verification API
- [ ] Transaction API
- [ ] Dashboard API
- [ ] Model information API

## Database

- [ ] Users
- [ ] User profiles
- [ ] Transactions
- [ ] Verification events
- [ ] Feedback
- [ ] Model versions

## Frontend

- [ ] Checkout
- [ ] Transaction result
- [ ] MFA
- [ ] Admin dashboard
- [ ] Transaction intelligence
- [ ] Model intelligence
- [ ] Responsive design
- [ ] Professional animations

## Security / Privacy

- [ ] Do not store raw card numbers
- [ ] Use tokenized identifiers
- [ ] Validate API inputs
- [ ] Store secrets in environment variables
- [ ] Restrict database credentials
- [ ] Use HTTPS in deployment
- [ ] Implement appropriate authentication for protected admin functionality

Do not claim full PCI-DSS or regulatory compliance unless the project has actually undergone the relevant compliance process.

## Deployment

- [ ] Backend Dockerfile
- [ ] Frontend Dockerfile
- [ ] MySQL container
- [ ] Docker Compose
- [ ] Environment configuration
- [ ] End-to-end deployment test

---

# 35. Final Architecture Summary

The final SentinelPay system should be:

```text
                    SENTINELPAY
                         │
                         ▼
               ┌─────────────────┐
               │  React + UI     │
               │                 │
               │ Checkout        │
               │ MFA             │
               │ Dashboard       │
               │ SHAP            │
               └────────┬────────┘
                        │
                        ▼
                 ┌──────────────┐
                 │   FastAPI    │
                 └──────┬───────┘
                        │
           ┌────────────┼────────────┐
           ▼            ▼            ▼
       XGBoost/RF     SHAP         MySQL
           │            │            │
           └────────────┼────────────┘
                        │
                        ▼
                  Risk Decision
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
           Approved            Soft Block
                                    │
                                    ▼
                                   MFA
                              ┌─────┴─────┐
                              ▼           ▼
                           Approve       Deny
                              │           │
                              └─────┬─────┘
                                    ▼
                                 Feedback
                                    │
                                    ▼
                            Future Retraining
```

# 36. Definition of Done

The project is complete when a user can:

1. Open the SentinelPay React application.
2. Submit a simulated payment.
3. Send the transaction to FastAPI.
4. Have the ML model generate a fraud probability.
5. Receive a low/medium/high risk decision.
6. Automatically soft-block a high-risk transaction.
7. View a human-readable SHAP explanation.
8. Complete simulated MFA.
9. Approve or deny the transaction.
10. Store the result in MySQL.
11. View the transaction in the admin dashboard.
12. View model metrics and explanations.
13. Run the entire system through Docker Compose.

The final presentation should demonstrate the complete path rather than presenting the technologies as isolated components.

---

# 37. Final Development Priority

Build in this order:

```text
1. Dataset
       ↓
2. ML
       ↓
3. SHAP
       ↓
4. Model packaging
       ↓
5. Database
       ↓
6. FastAPI
       ↓
7. Verification workflow
       ↓
8. React UI
       ↓
9. Integration
       ↓
10. Docker
       ↓
11. Testing
       ↓
12. Presentation
```

**Do not start by building the UI.**

The AI model and evaluation are the foundation of the capstone. Once the model, SHAP, and API work correctly, the React frontend becomes the polished product layer around an already-working AI system.
