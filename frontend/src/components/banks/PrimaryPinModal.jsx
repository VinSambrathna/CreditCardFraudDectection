import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Lock,
  Fingerprint
} from "lucide-react";
import MobileBankingKeypad from "./MobileBankingKeypad";

/**
 * PrimaryPinModal
 *
 * Simulates the primary 4-digit transaction PIN required for ALL banking transactions
 * (even routine $8.50 coffee).
 * Once verified, initiates the transaction into SentinelPay:
 * - Low Risk (Auto-Approve) -> Approves directly into Receipt.
 * - High Risk (Step-Up) -> Triggers Multi-Factor Step-Up Challenge (Biometric / Escrow / Anti-Scam).
 */
export default function PrimaryPinModal({
  isOpen,
  onClose,
  onPinSuccess,
  bankCode = "ABA",
  bankName = "ABA Mobile",
  amount = "8.50",
  currency = "USD",
  recipientName = "Merchant",
  accountNumber = "001 294 812",
  isSubmitting = false
}) {
  const [pin, setPin] = useState("");
  const [bioScanning, setBioScanning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setBioScanning(false);
    }
  }, [isOpen]);

  const bankTheme = {
    ABA: {
      accent: "#00A3E0",
      bgDark: "linear-gradient(180deg, #004B6E 0%, #002D42 28%, #001B29 100%)",
      cardBg: "rgba(0, 31, 48, 0.75)",
      cardBorder: "rgba(0, 163, 224, 0.22)",
      dotBorder: "#00A3E0",
      keypadTheme: "aba",
      isLight: false
    },
    ACLEDA: {
      accent: "#D4AF37",
      bgDark: "linear-gradient(180deg, #091F38 0%, #061527 40%, #030B14 100%)",
      cardBg: "rgba(10, 28, 51, 0.8)",
      cardBorder: "rgba(212, 175, 55, 0.25)",
      dotBorder: "#D4AF37",
      keypadTheme: "acleda",
      isLight: false
    },
    WING: {
      accent: "#77BC1F",
      bgDark: "#F4F7F6",
      cardBg: "#FFFFFF",
      cardBorder: "#E2E8F0",
      dotBorder: "#77BC1F",
      keypadTheme: "wing",
      isLight: true
    }
  }[bankCode] || {
    accent: "#00A3E0",
    bgDark: "linear-gradient(180deg, #004B6E 0%, #002D42 28%, #001B29 100%)",
    cardBg: "rgba(0, 31, 48, 0.75)",
    cardBorder: "rgba(0, 163, 224, 0.22)",
    dotBorder: "#00A3E0",
    keypadTheme: "aba",
    isLight: false
  };

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          onPinSuccess();
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
  };

  const handleBiometric = () => {
    setBioScanning(true);
    setTimeout(() => {
      setBioScanning(false);
      onPinSuccess();
    }, 700);
  };

  const handleQuickDemoPin = () => {
    setPin("1234");
    setTimeout(() => {
      onPinSuccess();
    }, 200);
  };

  if (!isOpen) return null;

  const textColor = bankTheme.isLight ? "#0F172A" : "#FFFFFF";
  const subTextColor = bankTheme.isLight ? "#64748B" : "#8A99AD";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 420, damping: 36 }}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 125,
          background: bankTheme.bgDark,
          display: "flex",
          flexDirection: "column",
          padding: "16px 16px 20px",
          color: textColor,
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          overflowY: "auto"
        }}
      >
        {/* Navigation Bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: textColor,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              padding: 0
            }}
          >
            <ChevronLeft style={{ width: 18, height: 18 }} />
            <span>Cancel</span>
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Lock style={{ width: 12, height: 12, color: bankTheme.accent }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "-0.01em" }}>
              Primary PIN Authorization
            </span>
          </div>

          <div style={{ width: 40 }} />
        </div>

        {/* Transaction Summary Card (Solid, Non-glassy) */}
        <div
          style={{
            background: bankTheme.cardBg,
            border: `1px solid ${bankTheme.cardBorder}`,
            borderRadius: 8,
            padding: "10px 14px",
            marginBottom: 16,
            textAlign: "center"
          }}
        >
          <div
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: subTextColor,
              fontWeight: 700,
              marginBottom: 2
            }}
          >
            Authorizing Transfer
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: textColor, letterSpacing: "-0.02em" }}>
            ${parseFloat(amount || 0).toFixed(2)}{" "}
            <span style={{ fontSize: 13, fontWeight: 700, color: bankTheme.accent }}>{currency}</span>
          </div>
          <div style={{ fontSize: 11, color: textColor, fontWeight: 600, marginTop: 2 }}>
            To: {recipientName}
          </div>
          <div style={{ fontSize: 9.5, color: subTextColor }}>
            Account: {accountNumber}
          </div>
        </div>

        {/* PIN Title & Subtitle */}
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: textColor, marginBottom: 2 }}>
            Enter 4-Digit Security PIN
          </div>
          <div style={{ fontSize: 11, color: subTextColor }}>
            Enter your registration PIN to authorize this payment
          </div>
        </div>

        {/* 4 Security Dots (Solid, No Neon Glow) */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 16 }}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <motion.div
                key={idx}
                animate={{ scale: isFilled ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 0.12 }}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: isFilled
                    ? bankTheme.accent
                    : bankTheme.isLight
                    ? "#E2E8F0"
                    : "rgba(255, 255, 255, 0.15)",
                  border: `1.5px solid ${
                    isFilled
                      ? bankTheme.dotBorder
                      : bankTheme.isLight
                      ? "#CBD5E1"
                      : "rgba(255, 255, 255, 0.28)"
                  }`
                }}
              />
            );
          })}
        </div>

        {/* Developer Auto-Fill Demo Tag (Clean, Non-AI-slop) */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
          <button
            type="button"
            onClick={handleQuickDemoPin}
            style={{
              background: bankTheme.isLight ? "#F1F5F9" : "rgba(0, 31, 48, 0.75)",
              border: `1px solid ${bankTheme.isLight ? "#E2E8F0" : bankTheme.cardBorder}`,
              padding: "4px 10px",
              borderRadius: 6,
              color: bankTheme.isLight ? "#475569" : "#94A3B8",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Auto-Fill Demo PIN (1234)
          </button>
        </div>

        {/* Numeric Keypad */}
        <div style={{ maxWidth: 280, margin: "0 auto", width: "100%", marginTop: "auto" }}>
          <MobileBankingKeypad
            onDigit={handleDigit}
            onDelete={handleDelete}
            onBiometric={handleBiometric}
            mode="pin"
            theme={bankTheme.keypadTheme}
          />
        </div>

        {/* Biometric Scan Overlay */}
        {bioScanning && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: bankTheme.isLight ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 27, 41, 0.94)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              zIndex: 140
            }}
          >
            <Fingerprint style={{ width: 40, height: 40, color: bankTheme.accent }} />
            <div style={{ fontSize: 12.5, fontWeight: 700, color: textColor }}>
              Verifying Biometrics...
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
