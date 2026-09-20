"""
SentinelPay - Realistic Benchmark Credit Card Fraud Dataset Generator
Generates a statistically rigorous dataset with realistic distributions,
complex non-linear interactions, and genuine class imbalance (~1% fraud).
"""

import os
import numpy as np
import pandas as pd

def generate_benchmark_fraud_data(
    n_samples: int = 60000,
    fraud_rate: float = 0.012,
    random_state: int = 42
) -> pd.DataFrame:
    """
    Generate synthetic transactions modeling real-world fraud patterns:
    - Log-normal amounts with anomalous high/micro fraud spikes
    - Impossible travel distances (distance_from_home)
    - Velocity surges (rapid-fire transactions)
    - Merchant risk categorization
    - Device fingerprint trust degradation
    """
    rng = np.random.default_rng(random_state)
    n_fraud = int(n_samples * fraud_rate)
    n_legit = n_samples - n_fraud

    categories = [
        "grocery", "online_retail", "electronics", 
        "travel_entertainment", "gas_transport", "dining", "crypto_financial"
    ]
    cat_risk_map = {
        "grocery": 0.08,
        "gas_transport": 0.15,
        "dining": 0.12,
        "online_retail": 0.35,
        "travel_entertainment": 0.65,
        "electronics": 0.75,
        "crypto_financial": 0.90
    }

    # ==========================================
    # 1. LEGITIMATE TRANSACTIONS
    # ==========================================
    legit_amount = rng.lognormal(mean=3.8, sigma=0.85, size=n_legit) # median ~$45
    # 5% of legitimate transactions are large purchases (travel, electronics, emergency)
    large_legit_idx = rng.choice(n_legit, size=int(n_legit * 0.05), replace=False)
    legit_amount[large_legit_idx] = rng.uniform(300.0, 1500.0, size=len(large_legit_idx))
    legit_amount = np.clip(legit_amount, 2.50, 2500.0)

    # Distance from home (km) - mostly local (< 25km), but 4% traveling legitimately
    legit_distance = rng.exponential(scale=8.0, size=n_legit) + rng.uniform(0.1, 2.0, size=n_legit)
    travel_legit_idx = rng.choice(n_legit, size=int(n_legit * 0.04), replace=False)
    legit_distance[travel_legit_idx] = rng.uniform(100.0, 800.0, size=len(travel_legit_idx))
    legit_distance = np.clip(legit_distance, 0.1, 1500.0)

    # Time delta since last transaction (hours)
    legit_time_delta = rng.exponential(scale=18.0, size=n_legit) + 0.2
    # 3% rapid succession legitimate shopping spree
    spree_idx = rng.choice(n_legit, size=int(n_legit * 0.03), replace=False)
    legit_time_delta[spree_idx] = rng.uniform(0.05, 0.3, size=len(spree_idx))
    legit_time_delta = np.clip(legit_time_delta, 0.05, 168.0)

    # Device trust score (0.0 - 1.0)
    legit_device_trust = rng.beta(a=7.0, b=1.8, size=n_legit)
    # 4% legitimate users using a new/guest browser or clearing cookies
    new_device_idx = rng.choice(n_legit, size=int(n_legit * 0.04), replace=False)
    legit_device_trust[new_device_idx] = rng.uniform(0.30, 0.60, size=len(new_device_idx))

    # Category choices
    legit_cat_probs = [0.28, 0.22, 0.08, 0.10, 0.18, 0.12, 0.02]
    legit_categories = rng.choice(categories, size=n_legit, p=legit_cat_probs)
    legit_merchant_risk = np.array([cat_risk_map[c] + rng.normal(0, 0.06) for c in legit_categories])
    legit_merchant_risk = np.clip(legit_merchant_risk, 0.01, 0.98)

    # Velocity
    legit_velocity_1h = rng.poisson(lam=0.4, size=n_legit) + 1
    legit_velocity_1h[spree_idx] += rng.integers(1, 4, size=len(spree_idx))
    legit_velocity_24h = legit_velocity_1h + rng.poisson(lam=2.0, size=n_legit)

    # Hour of day (circadian rhythm of normal spend)
    hour_probs = np.array([
        0.015, 0.012, 0.010, 0.010, 0.015, 0.025, # 00:00 - 05:00
        0.035, 0.050, 0.065, 0.070, 0.075, 0.080, # 06:00 - 11:00
        0.085, 0.080, 0.075, 0.070, 0.070, 0.075, # 12:00 - 17:00
        0.065, 0.050, 0.040, 0.030, 0.025, 0.018  # 18:00 - 23:00
    ])
    hour_probs = hour_probs / hour_probs.sum()
    legit_hours = rng.choice(np.arange(24), size=n_legit, p=hour_probs)
    legit_is_weekend = rng.choice([0, 1], size=n_legit, p=[0.71, 0.29])

    # ==========================================
    # 2. FRAUDULENT TRANSACTIONS
    # ==========================================
    fraud_type = rng.choice(["card_testing", "account_takeover", "synthetic_theft"], size=n_fraud, p=[0.25, 0.50, 0.25])
    
    fraud_amount = np.zeros(n_fraud)
    fraud_distance = np.zeros(n_fraud)
    fraud_time_delta = np.zeros(n_fraud)
    fraud_device_trust = np.zeros(n_fraud)
    fraud_categories = []
    fraud_velocity_1h = np.zeros(n_fraud, dtype=int)
    fraud_velocity_24h = np.zeros(n_fraud, dtype=int)

    fraud_cat_probs = [0.06, 0.28, 0.26, 0.16, 0.04, 0.06, 0.14]

    for i in range(n_fraud):
        ft = fraud_type[i]
        cat = rng.choice(categories, p=fraud_cat_probs)
        fraud_categories.append(cat)

        # 10% of fraudsters are stealthy (blending in)
        is_stealth = rng.random() < 0.10

        if is_stealth:
            # Stealthy fraud tries to mimic regular transactions
            fraud_amount[i] = rng.uniform(35.0, 180.0)
            fraud_distance[i] = rng.uniform(15.0, 85.0)
            fraud_time_delta[i] = rng.uniform(1.0, 8.0)
            fraud_device_trust[i] = rng.uniform(0.40, 0.65)
            fraud_velocity_1h[i] = rng.integers(1, 3)
            fraud_velocity_24h[i] = fraud_velocity_1h[i] + rng.integers(1, 4)
        elif ft == "card_testing":
            # Micro charges in rapid succession
            fraud_amount[i] = rng.uniform(1.20, 14.50)
            fraud_distance[i] = rng.uniform(40.0, 600.0)
            fraud_time_delta[i] = rng.uniform(0.01, 0.40)
            fraud_device_trust[i] = rng.beta(a=2.0, b=5.0)
            fraud_velocity_1h[i] = rng.integers(2, 6)
            fraud_velocity_24h[i] = fraud_velocity_1h[i] + rng.integers(3, 9)
        elif ft == "account_takeover":
            # High amount, untrusted device, foreign location
            fraud_amount[i] = rng.uniform(250.0, 2200.0)
            fraud_distance[i] = rng.uniform(120.0, 1800.0)
            fraud_time_delta[i] = rng.uniform(0.05, 3.0)
            fraud_device_trust[i] = rng.uniform(0.05, 0.45)
            fraud_velocity_1h[i] = rng.integers(1, 5)
            fraud_velocity_24h[i] = fraud_velocity_1h[i] + rng.integers(2, 7)
        else: # synthetic theft
            fraud_amount[i] = rng.uniform(180.0, 1600.0)
            fraud_distance[i] = rng.uniform(80.0, 1200.0)
            fraud_time_delta[i] = rng.uniform(0.1, 6.0)
            fraud_device_trust[i] = rng.uniform(0.15, 0.55)
            fraud_velocity_1h[i] = rng.integers(1, 4)
            fraud_velocity_24h[i] = fraud_velocity_1h[i] + rng.integers(1, 5)

    fraud_merchant_risk = np.array([cat_risk_map[c] + rng.normal(0, 0.07) for c in fraud_categories])
    fraud_merchant_risk = np.clip(fraud_merchant_risk, 0.10, 0.98)

    # Fraud hours often peak at night / off-hours
    fraud_hour_probs = np.array([
        0.08, 0.09, 0.09, 0.08, 0.07, 0.05, # Late night spike
        0.03, 0.03, 0.03, 0.03, 0.03, 0.04,
        0.04, 0.04, 0.04, 0.04, 0.04, 0.04,
        0.04, 0.04, 0.04, 0.04, 0.05, 0.07
    ])
    fraud_hour_probs = fraud_hour_probs / fraud_hour_probs.sum()
    fraud_hours = rng.choice(np.arange(24), size=n_fraud, p=fraud_hour_probs)
    fraud_is_weekend = rng.choice([0, 1], size=n_fraud, p=[0.55, 0.45])

    # ==========================================
    # 3. ASSEMBLE DATAFRAME
    # ==========================================
    df_legit = pd.DataFrame({
        "amount": np.round(legit_amount, 2),
        "distance": np.round(legit_distance, 2),
        "time_delta": np.round(legit_time_delta, 2),
        "merchant_risk": np.round(legit_merchant_risk, 3),
        "device_trust": np.round(legit_device_trust, 3),
        "velocity_1h": legit_velocity_1h,
        "velocity_24h": legit_velocity_24h,
        "hour_of_day": legit_hours,
        "is_weekend": legit_is_weekend,
        "is_fraud": 0
    })

    df_fraud = pd.DataFrame({
        "amount": np.round(fraud_amount, 2),
        "distance": np.round(fraud_distance, 2),
        "time_delta": np.round(fraud_time_delta, 2),
        "merchant_risk": np.round(fraud_merchant_risk, 3),
        "device_trust": np.round(fraud_device_trust, 3),
        "velocity_1h": fraud_velocity_1h,
        "velocity_24h": fraud_velocity_24h,
        "hour_of_day": fraud_hours,
        "is_weekend": fraud_is_weekend,
        "is_fraud": 1
    })

    df = pd.concat([df_legit, df_fraud], ignore_index=True)
    # Shuffle
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)

    # Assign synthetic user IDs and transaction tokens
    df["user_id"] = rng.integers(1001, 1080, size=len(df))
    df["transaction_token"] = [f"TX{i+10001}" for i in range(len(df))]

    return df

if __name__ == "__main__":
    output_dir = os.path.join(os.path.dirname(__file__), "..", "data", "raw")
    os.makedirs(output_dir, exist_ok=True)
    out_csv = os.path.join(output_dir, "sentinelpay_benchmark_transactions.csv")

    print(f"Generating benchmark fraud dataset (60,000 records)...")
    df = generate_benchmark_fraud_data(n_samples=60000, fraud_rate=0.012, random_state=42)
    df.to_csv(out_csv, index=False)

    print(f"[SUCCESS] Dataset saved to: {out_csv}")
    print(f"Total Rows: {len(df)}")
    fraud_count = df['is_fraud'].sum()
    print(f"Legitimate: {len(df) - fraud_count} ({(1 - fraud_count/len(df))*100:.2f}%)")
    print(f"Fraudulent: {fraud_count} ({(fraud_count/len(df))*100:.2f}%)")
    print("\nSample records:")
    print(df.head(4)[["transaction_token", "amount", "distance", "time_delta", "merchant_risk", "device_trust", "is_fraud"]])
