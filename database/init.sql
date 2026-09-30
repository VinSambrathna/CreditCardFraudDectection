-- SentinelPay MySQL Schema Initialization
-- Defines tables for institutions, API credentials, field mappings, audit logs,
-- users, user profiles, transactions, verification events, feedback, and model versions.

CREATE DATABASE IF NOT EXISTS sentinelpay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sentinelpay;

-- 1. Institutions (Multi-Tenancy Foundation)
CREATE TABLE IF NOT EXISTS institutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    institution_code VARCHAR(50) NOT NULL UNIQUE,
    institution_type ENUM('BANK', 'FINTECH', 'PAYMENT_PROCESSOR') NOT NULL DEFAULT 'BANK',
    environment ENUM('SANDBOX', 'PRODUCTION') NOT NULL DEFAULT 'SANDBOX',
    status ENUM('ACTIVE', 'SUSPENDED', 'PENDING_APPROVAL') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. API Credentials (Per-Institution Authentication)
CREATE TABLE IF NOT EXISTS api_credentials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    client_id VARCHAR(100) NOT NULL UNIQUE,
    api_key VARCHAR(128) NOT NULL UNIQUE,
    is_active TINYINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE
);

-- 3. Institution Field Mappings (Payload Normalization)
CREATE TABLE IF NOT EXISTS field_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NOT NULL,
    source_field VARCHAR(100) NOT NULL,
    sentinelpay_field VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE CASCADE,
    UNIQUE KEY uq_inst_source (institution_id, source_field)
);

-- 4. Users (Cardholders / Customers)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(25) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. User Profiles (Behavioral Baseline)
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    home_location VARCHAR(150) NOT NULL DEFAULT '11.5564,104.9282', -- Phnom Penh coordinates
    average_spend DECIMAL(10, 2) NOT NULL DEFAULT 65.00,
    usual_transaction_velocity INT NOT NULL DEFAULT 2,
    device_trust_score DECIMAL(4, 3) NOT NULL DEFAULT 0.950,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Transactions (Institution-Aware Ledger)
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NULL,
    transaction_token VARCHAR(64) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(30) NOT NULL DEFAULT 'KHQR',
    distance DECIMAL(8, 2) NOT NULL,
    time_delta DECIMAL(8, 2) NOT NULL,
    merchant_risk DECIMAL(4, 3) NOT NULL,
    device_trust DECIMAL(4, 3) NOT NULL,
    fraud_probability DECIMAL(5, 4) NOT NULL,
    prediction TINYINT NOT NULL, -- 0 = Legit, 1 = Fraud
    risk_level ENUM('LOW', 'REVIEW', 'HIGH') NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'SOFT_BLOCKED', 'VERIFIED', 'BLOCKED', 'RELEASED') NOT NULL,
    explanation_json TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
);

-- 7. Verification Events (Step-Up Verification Callback Log)
CREATE TABLE IF NOT EXISTS verification_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id INT NOT NULL,
    verification_type VARCHAR(50) NOT NULL DEFAULT 'BANK_STEP_UP_OTP',
    status ENUM('PENDING', 'APPROVED', 'DENIED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    otp_code VARCHAR(10) NOT NULL DEFAULT '123456',
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- 8. Human-in-the-Loop Feedback for Future Batch Retraining
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

-- 9. Model Versions
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

-- 10. Immutable Audit Trail (Compliance & Gateway Events)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution_id INT NULL,
    action VARCHAR(100) NOT NULL,
    transaction_token VARCHAR(64) NULL,
    endpoint VARCHAR(150) NULL,
    ip_address VARCHAR(50) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    detail TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (institution_id) REFERENCES institutions(id) ON DELETE SET NULL
);

-- -------------------------------------------------------------
-- Seed Simulated Financial Institutions
-- -------------------------------------------------------------
INSERT INTO institutions (id, name, institution_code, institution_type, environment, status) VALUES
(1, 'ABA Bank (Simulated)', 'ABA', 'BANK', 'SANDBOX', 'ACTIVE'),
(2, 'ACLEDA Bank (Simulated)', 'ACLEDA', 'BANK', 'SANDBOX', 'ACTIVE'),
(3, 'Wing Bank (Simulated)', 'WING', 'BANK', 'SANDBOX', 'ACTIVE'),
(4, 'Canadia Bank (Simulated)', 'CANADIA', 'BANK', 'SANDBOX', 'ACTIVE'),
(5, 'Demo Fintech (Simulated)', 'FINTECH01', 'FINTECH', 'SANDBOX', 'ACTIVE')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- -------------------------------------------------------------
-- Seed API Credentials for External Integration
-- -------------------------------------------------------------
INSERT INTO api_credentials (institution_id, client_id, api_key, is_active) VALUES
(1, 'sp_aba_demo_001', 'aba_sandbox_live_key_9f83a', 1),
(2, 'sp_acleda_demo_002', 'acleda_sandbox_live_key_7c41b', 1),
(3, 'sp_wing_demo_003', 'wing_sandbox_live_key_2e19d', 1),
(4, 'sp_canadia_demo_004', 'canadia_sandbox_live_key_5a38f', 1),
(5, 'sp_fintech_demo_005', 'fintech_sandbox_live_key_8d24e', 1)
ON DUPLICATE KEY UPDATE is_active=1;

-- -------------------------------------------------------------
-- Seed Standard Field Mappings for Banks
-- -------------------------------------------------------------
INSERT INTO field_mappings (institution_id, source_field, sentinelpay_field) VALUES
-- ABA Bank Mapping
(1, 'transactionAmount', 'amount'),
(1, 'currencyCode', 'currency'),
(1, 'paymentType', 'payment_method'),
(1, 'deviceTrustScore', 'device_trust'),
(1, 'merchantRiskScore', 'merchant_risk'),
-- ACLEDA Bank Mapping
(2, 'tx_amount', 'amount'),
(2, 'cur', 'currency'),
(2, 'device_score', 'device_trust'),
(2, 'merchant_score', 'merchant_risk'),
-- Wing Bank Mapping
(3, 'payment_value', 'amount'),
(3, 'curr', 'currency'),
(3, 'trust_score', 'device_trust'),
(3, 'm_risk', 'merchant_risk')
ON DUPLICATE KEY UPDATE sentinelpay_field=VALUES(sentinelpay_field);

-- -------------------------------------------------------------
-- Seed Initial Demo Users
-- -------------------------------------------------------------
INSERT INTO users (id, name, email, phone) VALUES
(1001, 'Sophea Sok (Customer)', 'sophea.sok@demo-bank.kh', '+855-12-889901'),
(1002, 'Vannak Chan (Customer)', 'vannak.chan@demo-bank.kh', '+855-15-776655'),
(1003, 'Bopha Rath (Customer)', 'bopha.rath@demo-bank.kh', '+855-17-443322')
ON DUPLICATE KEY UPDATE name=VALUES(name);

INSERT INTO user_profiles (id, user_id, home_location, average_spend, usual_transaction_velocity, device_trust_score) VALUES
(1, 1001, '11.5564,104.9282', 45.00, 2, 0.965),
(2, 1002, '13.3671,103.8448', 120.00, 3, 0.940),
(3, 1003, '13.0957,103.2022', 75.00, 1, 0.910)
ON DUPLICATE KEY UPDATE average_spend=VALUES(average_spend);

INSERT INTO model_versions (model_name, version, `precision`, `recall`, f1_score, pr_auc, is_active) VALUES
('SentinelPay XGBoost Classifier', '1.0.0', 0.9793, 0.9861, 0.9827, 0.9990, 1)
ON DUPLICATE KEY UPDATE is_active=1;
