-- SentinelPay MySQL Schema Initialization
-- Defines tables for users, risk profiles, transactions, MFA verification events, feedback, and model versions.

CREATE DATABASE IF NOT EXISTS sentinelpay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sentinelpay;

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(25) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. User Profiles (Behavioral Baseline)
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    home_location VARCHAR(150) NOT NULL DEFAULT '40.7128,-74.0060', -- New York coordinates
    average_spend DECIMAL(10, 2) NOT NULL DEFAULT 65.00,
    usual_transaction_velocity INT NOT NULL DEFAULT 2,
    device_trust_score DECIMAL(4, 3) NOT NULL DEFAULT 0.950,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Transactions
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_token VARCHAR(64) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    distance DECIMAL(8, 2) NOT NULL,
    time_delta DECIMAL(8, 2) NOT NULL,
    merchant_risk DECIMAL(4, 3) NOT NULL,
    device_trust DECIMAL(4, 3) NOT NULL,
    fraud_probability DECIMAL(5, 4) NOT NULL,
    prediction TINYINT NOT NULL, -- 0 = Legit, 1 = Fraud
    risk_level ENUM('LOW', 'REVIEW', 'HIGH') NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'SOFT_BLOCKED', 'VERIFIED', 'BLOCKED') NOT NULL,
    explanation_json TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Verification Events (Simulated Step-Up MFA)
CREATE TABLE IF NOT EXISTS verification_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    verification_type VARCHAR(50) NOT NULL DEFAULT 'SIMULATED_MFA_OTP',
    status ENUM('PENDING', 'APPROVED', 'DENIED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    otp_code VARCHAR(10) NOT NULL DEFAULT '123456',
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- 5. Human-in-the-Loop Feedback for Future Batch Retraining
CREATE TABLE IF NOT EXISTS feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    original_prediction TINYINT NOT NULL,
    user_decision ENUM('APPROVED', 'DENIED') NOT NULL,
    final_label TINYINT NOT NULL, -- 0 = Legitimate, 1 = Fraud
    added_to_training TINYINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- 6. Model Versions
CREATE TABLE IF NOT EXISTS model_versions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    model_name VARCHAR(100) NOT NULL,
    version VARCHAR(20) NOT NULL,
    `precision` DECIMAL(6, 4) NOT NULL,
    `recall` DECIMAL(6, 4) NOT NULL,
    f1_score DECIMAL(6, 4) NOT NULL,
    pr_auc DECIMAL(6, 4) NOT NULL,
    trained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT NOT NULL DEFAULT 1
);

-- -------------------------------------------------------------
-- Seed Initial Demo Users
-- -------------------------------------------------------------
INSERT INTO users (id, name, email, phone) VALUES
(1001, 'Alex Morgan', 'alex.morgan@fintech-demo.com', '+1-555-0192'),
(1002, 'Sarah Chen', 'sarah.chen@fintech-demo.com', '+1-555-0184'),
(1003, 'David Miller', 'david.miller@fintech-demo.com', '+1-555-0171')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO user_profiles (id, user_id, home_location, average_spend, usual_transaction_velocity, device_trust_score) VALUES
(1, 1001, '40.7128,-74.0060', 58.50, 2, 0.965),
(2, 1002, '37.7749,-122.4194', 120.00, 3, 0.940),
(3, 1003, '51.5074,-0.1278', 85.00, 1, 0.910)
ON DUPLICATE KEY UPDATE average_spend=VALUES(average_spend);

INSERT INTO model_versions (model_name, version, `precision`, `recall`, f1_score, pr_auc, is_active) VALUES
('SentinelPay XGBoost Classifier', '1.0.0', 0.9793, 0.9861, 0.9827, 0.9990, 1)
ON DUPLICATE KEY UPDATE is_active=1;
