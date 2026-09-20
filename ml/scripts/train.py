"""
SentinelPay - ML Training Pipeline
Handles stratified splitting, scaler fitting, SMOTE oversampling (train only),
model training (Logistic Regression, Random Forest, XGBoost),
and cross-model evaluation on untouched test data.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from imblearn.over_sampling import SMOTE
from sklearn.metrics import (
    precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, confusion_matrix
)

FEATURES = [
    "amount",
    "distance",
    "time_delta",
    "merchant_risk",
    "device_trust",
    "velocity_1h",
    "velocity_24h",
    "hour_of_day",
    "is_weekend"
]

TARGET = "is_fraud"

def run_training_pipeline():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_path = os.path.join(base_dir, "data", "raw", "sentinelpay_benchmark_transactions.csv")
    models_dir = os.path.join(base_dir, "models")
    processed_dir = os.path.join(base_dir, "data", "processed")
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(processed_dir, exist_ok=True)

    print(f"[1/6] Loading benchmark dataset from {data_path}...")
    df = pd.read_csv(data_path)
    X = df[FEATURES]
    y = df[TARGET]

    print(f"Total instances: {len(df)} | Features: {len(FEATURES)} | Fraud cases: {y.sum()} ({y.mean()*100:.2f}%)")

    # Step 2: Stratified Train/Test Split (80/20)
    print(f"[2/6] Performing 80/20 Stratified Train/Test split...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    print(f"Train instances: {len(X_train)} (Fraud: {y_train.sum()})")
    print(f"Test instances:  {len(X_test)}  (Fraud: {y_test.sum()})")

    # Save test set for downstream evaluation
    test_df = X_test.copy()
    test_df[TARGET] = y_test
    test_df.to_csv(os.path.join(processed_dir, "test_split.csv"), index=False)

    # Step 3: Fit Preprocessor on Train set ONLY (No Data Leakage)
    print(f"[3/6] Fitting RobustScaler on training split only...")
    scaler = RobustScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Save preprocessor
    scaler_path = os.path.join(models_dir, "preprocessor.pkl")
    joblib.dump(scaler, scaler_path)
    print(f"Saved preprocessor to: {scaler_path}")

    # Step 4: Apply SMOTE on Training split ONLY
    print(f"[4/6] Applying SMOTE oversampling to training data...")
    smote = SMOTE(sampling_strategy=0.25, random_state=42) # Bring fraud to 25% of majority for balanced learning
    X_train_resampled, y_train_resampled = smote.fit_resample(X_train_scaled, y_train)
    print(f"Resampled Train Shape: {X_train_resampled.shape} (Fraud cases: {y_train_resampled.sum()})")
    print(f"Test set remains untouched: {X_test_scaled.shape} (Fraud cases: {y_test.sum()})")

    # Step 5: Model Training & Competition
    print(f"[5/6] Training Candidate Models...")
    models = {
        "Logistic Regression (Baseline)": LogisticRegression(max_iter=1000, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=120, max_depth=10, min_samples_leaf=2, random_state=42, n_jobs=-1),
        "XGBoost": XGBClassifier(n_estimators=150, max_depth=5, learning_rate=0.07, subsample=0.8, colsample_bytree=0.8, random_state=42, eval_metric="logloss")
    }

    results = {}
    fitted_models = {}

    for name, model in models.items():
        print(f"  Training {name}...")
        model.fit(X_train_resampled, y_train_resampled)
        fitted_models[name] = model

        # Predict probabilities on untouched test split
        y_prob = model.predict_proba(X_test_scaled)[:, 1]
        y_pred = (y_prob >= 0.50).astype(int)

        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred)
        f1 = f1_score(y_test, y_pred)
        roc_auc = roc_auc_score(y_test, y_prob)
        pr_auc = average_precision_score(y_test, y_prob)
        cm = confusion_matrix(y_test, y_pred).tolist()

        results[name] = {
            "precision": round(float(precision), 4),
            "recall": round(float(recall), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(roc_auc), 4),
            "pr_auc": round(float(pr_auc), 4),
            "confusion_matrix": cm
        }
        # Save individual model
        slug = name.lower().replace(" ", "_").replace("(", "").replace(")", "")
        joblib.dump(model, os.path.join(models_dir, f"{slug}.pkl"))

    # Step 6: Print Comparison Table & Select Champion
    print("\n" + "="*80)
    print("MODEL COMPETITION RESULTS ON UNTOUCHED TEST SET")
    print("="*80)
    print(f"{'Model':<32} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'ROC-AUC':<10} | {'PR-AUC':<10}")
    print("-" * 80)
    for name, metrics in results.items():
        print(f"{name:<32} | {metrics['precision']:<10.4f} | {metrics['recall']:<10.4f} | {metrics['f1_score']:<10.4f} | {metrics['roc_auc']:<10.4f} | {metrics['pr_auc']:<10.4f}")
    print("="*80)

    # Select champion by PR-AUC and F1
    champion_name = "XGBoost" if results["XGBoost"]["pr_auc"] >= results["Random Forest"]["pr_auc"] else "Random Forest"
    champion_model = fitted_models[champion_name]
    print(f"\n[CHAMPION SELECTED]: {champion_name} (PR-AUC: {results[champion_name]['pr_auc']})")

    # Save champion model as default fraud_model.pkl
    champion_path = os.path.join(models_dir, "fraud_model.pkl")
    joblib.dump(champion_model, champion_path)
    print(f"Saved champion model to: {champion_path}")

    # Save metrics JSON
    metrics_summary = {
        "candidate_models": results,
        "champion": {
            "model_name": champion_name,
            "metrics": results[champion_name]
        },
        "features": FEATURES,
        "target": TARGET
    }
    metrics_path = os.path.join(models_dir, "model_comparison_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics_summary, f, indent=2)
    print(f"Saved evaluation metrics to: {metrics_path}")

if __name__ == "__main__":
    run_training_pipeline()
