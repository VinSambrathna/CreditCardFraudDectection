import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Camera,
  RotateCw,
  Check,
  X,
  Lock,
  Send
} from "lucide-react";
import MobileBankingKeypad from "./MobileBankingKeypad";
import BrandLogo from "../BrandLogo";

/**
 * Apple Face ID Official Vector Glyph
 * Mathematically balanced line vector of the Apple Face ID icon (4 corner framing brackets + smiling face).
 */
function AppleFaceIdGlyph({ size = 64, color = "#38BDF8", strokeWidth = 2.2 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block" }}
    >
      {/* 4 Corner Framing Brackets */}
      <path d="M 14 23 V 17 C 14 15.34 15.34 14 17 14 H 23" />
      <path d="M 41 14 H 47 C 48.66 14 50 15.34 50 17 V 23" />
      <path d="M 14 41 V 47 C 14 48.66 15.34 50 17 50 H 23" />
      <path d="M 41 50 H 47 C 48.66 50 50 48.66 50 47 V 41" />

      {/* Eyes */}
      <line x1="25" y1="26" x2="25" y2="30" strokeWidth={strokeWidth + 0.6} />
      <line x1="39" y1="26" x2="39" y2="30" strokeWidth={strokeWidth + 0.6} />

      {/* Nose */}
      <path d="M 32 27 V 34 H 36" strokeWidth={strokeWidth} />

      {/* Smile */}
      <path d="M 23 41 C 26 45 38 45 41 41" strokeWidth={strokeWidth} />
    </svg>
  );
}

/**
 * BankStepUpChallenge
 *
 * Professional, authentic mobile banking multi-factor verification:
 * - Pure human-designed banking aesthetic (Apple Pay, Revolut, ABA Mobile).
 * - Zero AI-slop: No colored alert boxes, no green shield / red alert icons, no "SCORE 0.94" or "RISK SCORE: 43%" tags.
 * - Solid, architectural surfaces (#080E18, #0D1726, #1E2D42).
 * - Authentic Apple Face ID vector glyph.
 * - 3 Orthogonal verification flows:
 *   1. Face ID Liveness (defeats phone theft & shoulder-surfed PINs).
 *   2. Scheduled Security Hold / Escrow (defeats velocity bursts).
 *   3. Anti-Scam Advisory (defeats social engineering / APP scams).
 */
export default function BankStepUpChallenge({
  bankName = "ABA Bank",
  bankCode = "ABA",
  activeGatewayResult,
  paymentDetails = {},
  onResolveStepUp,
  isVerifying = false,
  onClose
}) {
  // Select initial defense mode based on incoming transaction telemetry
  const determineInitialMode = () => {
    // If external Telegram notification was dispatched or alert delivered, default to OTP mode!
    const notifStatus = activeGatewayResult?.notification_status;
    if (notifStatus?.sent || notifStatus?.service === "TELEGRAM_BOT_API") {
      return "OTP";
    }
    const merchant = (paymentDetails?.merchant || "").toLowerCase();
    const isGamingOrFX =
      merchant.includes("gaming") ||
      merchant.includes("fx") ||
      merchant.includes("crypto") ||
      merchant.includes("liquidity");
    const isDeviceOrLocationAnomaly =
      (paymentDetails?.distance || 0) >= 100 || (paymentDetails?.deviceTrust || 1) <= 0.3;
    const isVelocitySpike =
      (paymentDetails?.velocity_1h || 1) >= 4 || (paymentDetails?.timeDelta || 1) <= 0.1;

    if (isDeviceOrLocationAnomaly) return "OTP";
    if (isGamingOrFX || (paymentDetails?.merchantRisk || 0) >= 0.75) return "SCAM_ADVISORY";
    if (isVelocitySpike) return "COOLING_OFF";
    return "OTP";
  };

  const [activeMode, setActiveMode] = useState(determineInitialMode);

  useEffect(() => {
    setActiveMode(determineInitialMode());
  }, [activeGatewayResult?.transaction_token, paymentDetails?.merchant]);

  // ── Mode D: Telegram / SMS OTP Verification States ────────────────────────
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);

  useEffect(() => {
    setOtpCode("");
    setOtpError(false);
    setOtpSuccess(false);
  }, [activeGatewayResult?.transaction_token, activeMode]);

  const verifyOtpCode = (code) => {
    // Expected OTP from backend Telegram dispatch is 849201, accept demo 123456 as well
    if (code === "849201" || code === "123456") {
      setOtpSuccess(true);
      setOtpError(false);
      setTimeout(() => {
        onResolveStepUp(
          "APPROVED",
          "BANK_OTP",
          "Cardholder verified out-of-band Telegram OTP challenge code."
        );
      }, 700);
    } else {
      setOtpError(true);
      setTimeout(() => {
        setOtpCode("");
      }, 900);
    }
  };

  const handleOtpDigit = (digit) => {
    if (otpCode.length < 6 && !otpSuccess) {
      const next = otpCode + String(digit);
      setOtpCode(next);
      setOtpError(false);
      if (next.length === 6) {
        verifyOtpCode(next);
      }
    }
  };

  const handleOtpDelete = () => {
    if (!otpSuccess) {
      setOtpCode((p) => p.slice(0, -1));
      setOtpError(false);
    }
  };

  const handleQuickDemoOtp = () => {
    setOtpCode("849201");
    verifyOtpCode("849201");
  };

  // ── Mode A: Biometric Liveness States ─────────────────────────────────────
  const [bioStep, setBioStep] = useState("ready"); // "ready" | "scanning" | "blinking" | "matching" | "success" | "failed"
  const [bioConfidence, setBioConfidence] = useState(0);
  const [useRealCamera, setUseRealCamera] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (useRealCamera && activeMode === "BIOMETRIC") {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "user" } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) videoRef.current.srcObject = stream;
        })
        .catch(() => {
          setUseRealCamera(false);
        });
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [useRealCamera, activeMode]);

  const handleStartLivenessScan = () => {
    setBioStep("scanning");
    setBioConfidence(32);

    setTimeout(() => {
      setBioStep("blinking");
      setBioConfidence(74);
    }, 1000);

    setTimeout(() => {
      setBioStep("matching");
      setBioConfidence(96);
    }, 2000);

    setTimeout(() => {
      setBioStep("success");
      setBioConfidence(99.8);
      setTimeout(() => {
        onResolveStepUp(
          "APPROVED",
          "BIOMETRIC_LIVENESS",
          "Cardholder Face ID verified against registered identity."
        );
      }, 700);
    }, 2800);
  };

  const handleSimulateImpostor = () => {
    setBioStep("scanning");
    setBioConfidence(20);

    setTimeout(() => {
      setBioStep("failed");
      setBioConfidence(0);
      setTimeout(() => {
        onResolveStepUp(
          "DENIED",
          "BIOMETRIC_FAILED",
          "Biometric mismatch: Unrecognized face detected. Transaction cancelled."
        );
      }, 900);
    }, 1300);
  };

  // ── Mode B: Cooling-off Escrow States ─────────────────────────────────────
  const [secondsRemaining, setSecondsRemaining] = useState(7184); // ~2 hours

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((p) => (p > 0 ? p - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hrs = String(Math.floor(secondsRemaining / 3600)).padStart(2, "0");
  const mins = String(Math.floor((secondsRemaining % 3600) / 60)).padStart(2, "0");
  const secs = String(secondsRemaining % 60).padStart(2, "0");

  // ── Mode C: Anti-Scam Advisory States ─────────────────────────────────────
  const [scamChoice, setScamChoice] = useState(null); // null | "YES_COACHED" | "NO_GENUINE"
  const [acknowledgedLegal, setAcknowledgedLegal] = useState(false);

  // Bank Theme Tokens: Authentic Bank Visual Foundations
  const bankTheme = {
    ABA: {
      accent: "#00A3E0",
      accentSolid: "#00A3E0",
      bgSubstrate: "linear-gradient(180deg, #004B6E 0%, #002D42 28%, #001B29 100%)",
      cardBg: "rgba(0, 31, 48, 0.75)",
      cardBorder: "rgba(0, 163, 224, 0.22)",
      segmentBg: "rgba(0, 20, 32, 0.65)",
      segmentBorder: "rgba(0, 163, 224, 0.2)",
      apertureBg: "rgba(0, 18, 29, 0.85)",
      btnSecondaryBg: "rgba(0, 31, 48, 0.8)",
      btnSecondaryBorder: "rgba(0, 163, 224, 0.25)",
      btnSecondaryColor: "#BAE6FD",
      dotBorder: "#00A3E0",
      keypadTheme: "aba",
      isLight: false
    },
    ACLEDA: {
      accent: "#D4AF37",
      accentSolid: "#B45309",
      bgSubstrate: "linear-gradient(180deg, #091F38 0%, #061527 40%, #030B14 100%)",
      cardBg: "rgba(10, 28, 51, 0.78)",
      cardBorder: "rgba(212, 175, 55, 0.25)",
      segmentBg: "rgba(6, 21, 39, 0.7)",
      segmentBorder: "rgba(212, 175, 55, 0.2)",
      apertureBg: "rgba(4, 13, 24, 0.85)",
      btnSecondaryBg: "rgba(10, 28, 51, 0.8)",
      btnSecondaryBorder: "rgba(212, 175, 55, 0.25)",
      btnSecondaryColor: "#FDE68A",
      dotBorder: "#D4AF37",
      keypadTheme: "acleda",
      isLight: false
    },
    WING: {
      accent: "#77BC1F",
      accentSolid: "#5D9616",
      bgSubstrate: "#F4F7F6",
      cardBg: "#FFFFFF",
      cardBorder: "#E2E8F0",
      segmentBg: "#E2E8F0",
      segmentBorder: "#CBD5E1",
      apertureBg: "#FFFFFF",
      btnSecondaryBg: "#FFFFFF",
      btnSecondaryBorder: "#CBD5E1",
      btnSecondaryColor: "#334155",
      dotBorder: "#77BC1F",
      keypadTheme: "wing",
      isLight: true
    }
  }[bankCode] || {
    accent: "#00A3E0",
    accentSolid: "#00A3E0",
    bgSubstrate: "linear-gradient(180deg, #004B6E 0%, #002D42 28%, #001B29 100%)",
    cardBg: "rgba(0, 31, 48, 0.75)",
    cardBorder: "rgba(0, 163, 224, 0.22)",
    segmentBg: "rgba(0, 20, 32, 0.65)",
    segmentBorder: "rgba(0, 163, 224, 0.2)",
    apertureBg: "rgba(0, 18, 29, 0.85)",
    btnSecondaryBg: "rgba(0, 31, 48, 0.8)",
    btnSecondaryBorder: "rgba(0, 163, 224, 0.25)",
    btnSecondaryColor: "#BAE6FD",
    dotBorder: "#00A3E0",
    keypadTheme: "aba",
    isLight: false
  };

  const rawAmount = parseFloat(
    activeGatewayResult?.amount || paymentDetails?.amount || 0
  ).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const currency = activeGatewayResult?.currency || paymentDetails?.currency || "USD";
  const merchantName = paymentDetails?.merchant || "Merchant";

  const textColor = bankTheme.isLight ? "#0F172A" : "#FFFFFF";
  const subTextColor = bankTheme.isLight ? "#64748B" : "#94A3B8";

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", stiffness: 420, damping: 36 }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 130,
        background: bankTheme.bgSubstrate,
        display: "flex",
        flexDirection: "column",
        padding: "16px 14px 18px",
        overflowY: "auto",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        color: textColor,
        boxSizing: "border-box"
      }}
    >
      {/* ── Top Bar: Authentic Mobile Banking Navigation Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          flexShrink: 0
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            else onResolveStepUp("DENIED", "CUSTOMER_ABORTED", "Cardholder cancelled verification.");
          }}
          style={{
            background: "none",
            border: "none",
            color: subTextColor,
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

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Lock style={{ width: 13, height: 13, color: bankTheme.accent }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: textColor, letterSpacing: "-0.01em" }}>
            Security Verification
          </span>
        </div>

        <div style={{ width: 44 }} />
      </div>

      {/* ── Transaction Preview Card (Clean, Authentic, Bank Surface) ── */}
      <div
        style={{
          background: bankTheme.cardBg,
          border: `1px solid ${bankTheme.cardBorder}`,
          borderRadius: 10,
          padding: "10px 14px",
          marginBottom: 12,
          textAlign: "center",
          flexShrink: 0
        }}
      >
        <div style={{ fontSize: 9.5, color: subTextColor, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700, marginBottom: 2 }}>
          Authorizing Transfer
        </div>
        <div style={{ fontSize: 21, fontWeight: 800, color: textColor, letterSpacing: "-0.02em" }}>
          ${rawAmount} <span style={{ fontSize: 13, fontWeight: 700, color: bankTheme.accent }}>{currency}</span>
        </div>
        <div style={{ fontSize: 11, color: subTextColor, marginTop: 2 }}>
          To: <strong style={{ color: textColor }}>{merchantName}</strong>
        </div>
      </div>

      {/* ── Segmented Control (Apple-Style, Typography-Led) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 3,
          background: bankTheme.segmentBg,
          padding: 3,
          borderRadius: 8,
          border: `1px solid ${bankTheme.segmentBorder}`,
          marginBottom: 12,
          flexShrink: 0
        }}
      >
        {[
          { id: "OTP", label: "OTP Code" },
          { id: "BIOMETRIC", label: "Face ID" },
          { id: "COOLING_OFF", label: "Escrow" },
          { id: "SCAM_ADVISORY", label: "Scam" }
        ].map((tab) => {
          const isActive = activeMode === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveMode(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "7px 2px",
                borderRadius: 6,
                border: isActive
                  ? bankTheme.isLight
                    ? "1px solid #CBD5E1"
                    : `1px solid ${bankTheme.accent}`
                  : "1px solid transparent",
                background: isActive
                  ? bankTheme.isLight
                    ? "#FFFFFF"
                    : bankTheme.accent
                  : "transparent",
                color: isActive
                  ? bankTheme.isLight
                    ? "#0F172A"
                    : "#FFFFFF"
                  : subTextColor,
                fontSize: 10,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                transition: "background 80ms ease, color 80ms ease"
              }}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* MODE D: OUT-OF-BAND TELEGRAM / SMS OTP CHALLENGE                      */}
      {/* ===================================================================== */}
      {activeMode === "OTP" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: textColor, letterSpacing: "-0.01em" }}>
              One-Time Password (OTP)
            </div>
            <div style={{ fontSize: 10, color: subTextColor, marginTop: 2 }}>
              Enter 6-digit challenge code sent to Telegram / Phone
            </div>
          </div>

          {/* Telegram Push Badge */}
          <div
            style={{
              background: bankTheme.isLight ? "#EFF6FF" : "rgba(0, 163, 224, 0.12)",
              border: `1px solid ${bankTheme.isLight ? "#BFDBFE" : "rgba(0, 163, 224, 0.28)"}`,
              borderRadius: 8,
              padding: "7px 10px",
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#0088cc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}
              >
                <Send style={{ width: 10, height: 10, color: "#FFFFFF" }} />
              </div>
              <div style={{ fontSize: 9.5, color: bankTheme.isLight ? "#1E40AF" : "#BAE6FD", lineHeight: 1.25 }}>
                <strong style={{ fontWeight: 700 }}>Telegram Bot Alert Sent</strong>
                <br />
                <span>@sentinelpay_guard_bot &bull; Expires 5m</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoOtp}
              style={{
                background: bankTheme.isLight ? "#DBEAFE" : "rgba(0, 163, 224, 0.25)",
                border: "none",
                borderRadius: 5,
                padding: "3px 7px",
                fontSize: 9.5,
                fontWeight: 700,
                color: bankTheme.isLight ? "#1D4ED8" : "#38BDF8",
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              Fill 849201
            </button>
          </div>

          {/* 6 Digit Input Cells */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 8 }}>
            {[0, 1, 2, 3, 4, 5].map((idx) => {
              const char = otpCode[idx] || "";
              const isCurrent = otpCode.length === idx;
              return (
                <div
                  key={idx}
                  style={{
                    width: 36,
                    height: 42,
                    borderRadius: 8,
                    background: bankTheme.cardBg,
                    border: `1.5px solid ${
                      otpSuccess
                        ? "#10B981"
                        : otpError
                        ? "#EF4444"
                        : isCurrent
                        ? bankTheme.accent
                        : char
                        ? bankTheme.dotBorder || bankTheme.accent
                        : bankTheme.cardBorder
                    }`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 19,
                    fontWeight: 800,
                    fontFamily: "monospace",
                    color: otpSuccess ? "#10B981" : otpError ? "#EF4444" : textColor,
                    boxShadow: isCurrent ? `0 0 0 2px ${bankTheme.accent}33` : "none"
                  }}
                >
                  {char}
                </div>
              );
            })}
          </div>

          {/* Feedback message */}
          <div style={{ textAlign: "center", minHeight: 18, marginBottom: 6 }}>
            {otpSuccess && (
              <span style={{ fontSize: 10.5, color: "#10B981", fontWeight: 700 }}>
                ✓ OTP Verified &bull; Releasing Settlement
              </span>
            )}
            {otpError && (
              <span style={{ fontSize: 10.5, color: "#EF4444", fontWeight: 600 }}>
                Invalid OTP code. Please enter the code sent to your Telegram.
              </span>
            )}
            {!otpSuccess && !otpError && (
              <span style={{ fontSize: 9.5, color: subTextColor }}>
                Check Telegram chat &bull; Enter code 849201
              </span>
            )}
          </div>

          {/* Keypad */}
          <div style={{ maxWidth: 280, margin: "0 auto", width: "100%", marginTop: "auto" }}>
            <MobileBankingKeypad
              onDigit={handleOtpDigit}
              onDelete={handleOtpDelete}
              mode="pin"
              theme={bankTheme.keypadTheme || "aba"}
              compact={true}
            />
          </div>

          {/* Bottom Security Cancellation Action */}
          <div style={{ marginTop: 8, textAlign: "center" }}>
            <button
              type="button"
              disabled={isVerifying}
              onClick={() =>
                onResolveStepUp(
                  "DENIED",
                  "FRAUD_REPORTED",
                  "Cardholder rejected Step-Up challenge. Transaction blocked and card frozen."
                )
              }
              style={{
                background: "none",
                border: "none",
                color: "#EF4444",
                fontSize: 10,
                fontWeight: 600,
                cursor: "pointer",
                padding: "3px 6px"
              }}
            >
              I did not request this &bull; Freeze Card &amp; Block
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODE A: APPLE FACE ID BIOMETRIC VERIFICATION                         */}
      {/* ===================================================================== */}
      {activeMode === "BIOMETRIC" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: textColor, letterSpacing: "-0.01em" }}>
              Face ID Verification
            </div>
            <div style={{ fontSize: 10.5, color: subTextColor, marginTop: 2 }}>
              Confirm your identity to authorize this transfer.
            </div>
          </div>

          {/* Apple Face ID Aperture */}
          <div
            style={{
              position: "relative",
              width: 150,
              height: 150,
              margin: "0 auto 10px",
              borderRadius: 22,
              overflow: "hidden",
              border: `1.5px solid ${
                bioStep === "success"
                  ? "#059669"
                  : bioStep === "failed"
                  ? "#DC2626"
                  : bioStep !== "ready"
                  ? bankTheme.accent
                  : bankTheme.cardBorder
              }`,
              background: bankTheme.apertureBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {useRealCamera ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <AppleFaceIdGlyph
                  size={60}
                  color={
                    bioStep === "success"
                      ? "#10B981"
                      : bioStep === "failed"
                      ? "#EF4444"
                      : bioStep !== "ready"
                      ? "#38BDF8"
                      : "#64748B"
                  }
                  strokeWidth={2.2}
                />

                {(bioStep === "scanning" || bioStep === "blinking" || bioStep === "matching") && (
                  <motion.div
                    animate={{ y: [-40, 40, -40] }}
                    transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                      position: "absolute",
                      left: 18,
                      right: 18,
                      height: 1.5,
                      background: "#38BDF8"
                    }}
                  />
                )}
              </div>
            )}

            {/* Success Overlay */}
            {bioStep === "success" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#032313",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "#059669",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Check style={{ width: 20, height: 20, color: "#FFFFFF", strokeWidth: 2.5 }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#A7F3D0", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Verified
                </span>
              </motion.div>
            )}

            {/* Failure Overlay */}
            {bioStep === "failed" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "#280A10",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: "50%",
                    background: "#DC2626",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <X style={{ width: 20, height: 20, color: "#FFFFFF", strokeWidth: 2.5 }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#FDA4AF", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Face Mismatch
                </span>
              </motion.div>
            )}
          </div>

          {/* Status Text */}
          <div style={{ textAlign: "center", minHeight: 22, marginBottom: 8 }}>
            {bioStep === "ready" && (
              <span style={{ fontSize: 10.5, color: subTextColor }}>
                Center face inside aperture and glance at camera.
              </span>
            )}
            {bioStep === "scanning" && (
              <span style={{ fontSize: 10.5, color: bankTheme.accent, fontWeight: 600 }}>
                Scanning TrueDepth landmarks...
              </span>
            )}
            {bioStep === "blinking" && (
              <span style={{ fontSize: 10.5, color: "#FCD34D", fontWeight: 600 }}>
                Blink twice to confirm optical presence...
              </span>
            )}
            {bioStep === "matching" && (
              <span style={{ fontSize: 10.5, color: "#34D399", fontWeight: 600 }}>
                Confirming registered identity...
              </span>
            )}
            {bioStep === "success" && (
              <span style={{ fontSize: 10.5, color: "#34D399", fontWeight: 700 }}>
                Identity Verified &middot; Releasing Transfer
              </span>
            )}
            {bioStep === "failed" && (
              <span style={{ fontSize: 10.5, color: "#FDA4AF", fontWeight: 700 }}>
                Biometric Mismatch &middot; Transfer Cancelled
              </span>
            )}
          </div>

          {/* Camera Feed Toggle */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setUseRealCamera((p) => !p)}
              style={{
                background: bankTheme.btnSecondaryBg,
                border: `1px solid ${bankTheme.btnSecondaryBorder}`,
                padding: "4px 10px",
                borderRadius: 6,
                color: subTextColor,
                fontSize: 10,
                fontWeight: 600,
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                cursor: "pointer"
              }}
            >
              <Camera style={{ width: 11, height: 11 }} strokeWidth={2} />
              <span>{useRealCamera ? "Switch to Vector Glyph" : "Use Real Camera"}</span>
            </button>
          </div>

          {/* Action CTAs */}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 7 }}>
            <button
              type="button"
              disabled={isVerifying || bioStep !== "ready"}
              onClick={handleStartLivenessScan}
              style={{
                padding: "11px 16px",
                borderRadius: 8,
                background: bankTheme.accentSolid,
                color: "#FFFFFF",
                border: "none",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: isVerifying || bioStep !== "ready" ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7
              }}
            >
              {bioStep === "scanning" || bioStep === "blinking" || bioStep === "matching" ? (
                <>
                  <RotateCw style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
                  <span>Verifying Face ID ({bioConfidence}%)...</span>
                </>
              ) : (
                <span>Verify with Face ID</span>
              )}
            </button>

            <button
              type="button"
              disabled={isVerifying || bioStep !== "ready"}
              onClick={handleSimulateImpostor}
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                background: bankTheme.btnSecondaryBg,
                border: `1px solid ${bankTheme.btnSecondaryBorder}`,
                color: bankTheme.btnSecondaryColor,
                fontSize: 11,
                fontWeight: 500,
                cursor: isVerifying || bioStep !== "ready" ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <span>Simulate Impostor (Test Failure)</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODE B: SCHEDULED SECURITY HOLD (ESCROW)                              */}
      {/* ===================================================================== */}
      {activeMode === "COOLING_OFF" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: textColor, letterSpacing: "-0.01em" }}>
              Scheduled Security Hold
            </div>
            <div style={{ fontSize: 10.5, color: subTextColor, marginTop: 2 }}>
              High-value transfer scheduled to release in 2 hours.
            </div>
          </div>

          {/* Vault Display Container */}
          <div
            style={{
              background: bankTheme.cardBg,
              border: `1px solid ${bankTheme.cardBorder}`,
              borderRadius: 8,
              padding: "12px",
              textAlign: "center",
              marginBottom: 10
            }}
          >
            {/* Split-Flap Digit Capsules */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                margin: "4px 0 8px"
              }}
            >
              <div
                style={{
                  background: bankTheme.apertureBg,
                  border: `1px solid ${bankTheme.cardBorder}`,
                  borderRadius: 6,
                  padding: "7px 10px",
                  minWidth: 44
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: textColor, lineHeight: 1 }}>
                  {hrs}
                </div>
                <div style={{ fontSize: 8, color: subTextColor, fontWeight: 700, marginTop: 4 }}>
                  HRS
                </div>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: subTextColor }}>:</span>
              <div
                style={{
                  background: bankTheme.apertureBg,
                  border: `1px solid ${bankTheme.cardBorder}`,
                  borderRadius: 6,
                  padding: "7px 10px",
                  minWidth: 44
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: textColor, lineHeight: 1 }}>
                  {mins}
                </div>
                <div style={{ fontSize: 8, color: subTextColor, fontWeight: 700, marginTop: 4 }}>
                  MIN
                </div>
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: subTextColor }}>:</span>
              <div
                style={{
                  background: bankTheme.apertureBg,
                  border: `1px solid ${bankTheme.cardBorder}`,
                  borderRadius: 6,
                  padding: "7px 10px",
                  minWidth: 44
                }}
              >
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "monospace", color: bankTheme.accent, lineHeight: 1 }}>
                  {secs}
                </div>
                <div style={{ fontSize: 8, color: bankTheme.accent, fontWeight: 700, marginTop: 4 }}>
                  SEC
                </div>
              </div>
            </div>

            <div style={{ fontSize: 10, color: subTextColor }}>
              ${rawAmount} {currency} held in Bank Settlement Reserve.
            </div>
          </div>

          {/* Calm, Professional Explanation */}
          <div
            style={{
              background: bankTheme.cardBg,
              border: `1px solid ${bankTheme.cardBorder}`,
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 12,
              fontSize: 10.5,
              color: subTextColor,
              lineHeight: 1.45
            }}
          >
            Your funds remain protected in your account during this holding period. If you did not initiate this transaction, cancel immediately to secure your account.
          </div>

          {/* Action CTAs */}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 7 }}>
            <button
              type="button"
              disabled={isVerifying}
              onClick={() =>
                onResolveStepUp(
                  "DENIED",
                  "COOLING_OFF_RECALL",
                  "Cardholder recalled transaction during cooling-off window."
                )
              }
              style={{
                padding: "11px 16px",
                borderRadius: 8,
                background: "#991B1B",
                color: "#FFFFFF",
                border: "1px solid #B91C1C",
                fontSize: 12.5,
                fontWeight: 600,
                cursor: isVerifying ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <span>Cancel Transfer &amp; Freeze Card</span>
            </button>

            <button
              type="button"
              disabled={isVerifying}
              onClick={() =>
                onResolveStepUp(
                  "APPROVED",
                  "COOLING_OFF_OVERRIDE",
                  "Cardholder expedited escrow release via verified banking channel."
                )
              }
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                background: bankTheme.btnSecondaryBg,
                border: `1px solid ${bankTheme.btnSecondaryBorder}`,
                color: bankTheme.btnSecondaryColor,
                fontSize: 11,
                fontWeight: 500,
                cursor: isVerifying ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <span>I Authorized This Transfer</span>
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODE C: ANTI-SCAM DIRECTIVE                                           */}
      {/* ===================================================================== */}
      {activeMode === "SCAM_ADVISORY" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: textColor, letterSpacing: "-0.01em" }}>
              Security Notice
            </div>
            <div style={{ fontSize: 10.5, color: subTextColor, marginTop: 2 }}>
              Please review before completing this transfer.
            </div>
          </div>

          {/* Clean Security Advisory Card (Neutral, Institutional, Bank Surface) */}
          <div
            style={{
              background: bankTheme.cardBg,
              border: `1px solid ${bankTheme.cardBorder}`,
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 10
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: textColor, marginBottom: 3 }}>
              Protect Yourself Against Scams
            </div>
            <div style={{ fontSize: 10, color: subTextColor, lineHeight: 1.4 }}>
              Fraudsters frequently instruct victims on Telegram or phone to transfer funds for investment returns, parcel deliveries, or police bail. Banks never ask for transfers to private accounts.
            </div>
          </div>

          {/* Assessment Options */}
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: subTextColor,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.04em"
              }}
            >
              Please Confirm:
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Option A: Coached */}
              <div
                onClick={() => setScamChoice("YES_COACHED")}
                style={{
                  background: scamChoice === "YES_COACHED"
                    ? "rgba(220, 38, 38, 0.16)"
                    : bankTheme.isLight
                    ? "#FFFFFF"
                    : bankTheme.cardBg,
                  border: `1.5px solid ${scamChoice === "YES_COACHED" ? "#DC2626" : bankTheme.cardBorder}`,
                  borderRadius: 8,
                  padding: "9px 11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: `1.5px solid ${scamChoice === "YES_COACHED" ? "#DC2626" : "#64748B"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 2,
                    flexShrink: 0
                  }}
                >
                  {scamChoice === "YES_COACHED" && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#DC2626" }} />
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: scamChoice === "YES_COACHED" ? "#FDA4AF" : textColor
                    }}
                  >
                    I was instructed to send this on a call or chat
                  </div>
                  <div style={{ fontSize: 9.5, color: subTextColor, lineHeight: 1.3, marginTop: 1 }}>
                    Someone on Telegram, WhatsApp, or phone asked me to transfer money.
                  </div>
                </div>
              </div>

              {/* Option B: Genuine Personal */}
              <div
                onClick={() => setScamChoice("NO_GENUINE")}
                style={{
                  background: scamChoice === "NO_GENUINE"
                    ? bankTheme.isLight
                      ? "rgba(2, 132, 199, 0.12)"
                      : "rgba(0, 163, 224, 0.2)"
                    : bankTheme.isLight
                    ? "#FFFFFF"
                    : bankTheme.cardBg,
                  border: `1.5px solid ${scamChoice === "NO_GENUINE" ? bankTheme.accent : bankTheme.cardBorder}`,
                  borderRadius: 8,
                  padding: "9px 11px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: `1.5px solid ${scamChoice === "NO_GENUINE" ? bankTheme.accent : "#64748B"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 2,
                    flexShrink: 0
                  }}
                >
                  {scamChoice === "NO_GENUINE" && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: bankTheme.accent }} />
                  )}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: scamChoice === "NO_GENUINE"
                        ? bankTheme.isLight
                          ? "#0284C7"
                          : "#BAE6FD"
                        : textColor
                    }}
                  >
                    I personally know this recipient
                  </div>
                  <div style={{ fontSize: 9.5, color: subTextColor, lineHeight: 1.3, marginTop: 1 }}>
                    I know this person or business and am making this payment willingly.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Interception Warning */}
          {scamChoice === "YES_COACHED" && (
            <motion.div
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: bankTheme.isLight ? "#FEF2F2" : "rgba(220, 38, 38, 0.16)",
                border: `1px solid ${bankTheme.isLight ? "#FECACA" : "rgba(220, 38, 38, 0.35)"}`,
                borderRadius: 8,
                padding: "9px 11px",
                marginBottom: 10
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: bankTheme.isLight ? "#991B1B" : "#FFFFFF", marginBottom: 2 }}>
                High-Risk Warning
              </div>
              <div style={{ fontSize: 9.5, color: bankTheme.isLight ? "#B91C1C" : "#FDA4AF", lineHeight: 1.35 }}>
                This matches active scam patterns. We strongly recommend cancelling this transfer immediately to protect your funds.
              </div>
            </motion.div>
          )}

          {scamChoice === "NO_GENUINE" && (
            <motion.div
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: bankTheme.isLight ? "#F8FAFC" : "rgba(0, 31, 48, 0.7)",
                border: `1px solid ${bankTheme.isLight ? "#E2E8F0" : bankTheme.cardBorder}`,
                borderRadius: 8,
                padding: "8px 10px",
                marginBottom: 10
              }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 7,
                  cursor: "pointer",
                  fontSize: 9.5,
                  color: subTextColor,
                  lineHeight: 1.35
                }}
              >
                <input
                  type="checkbox"
                  checked={acknowledgedLegal}
                  onChange={(e) => setAcknowledgedLegal(e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <span style={{ color: textColor }}>I confirm that I know this recipient and accept full responsibility for this transfer.</span>
              </label>
            </motion.div>
          )}

          {/* Action CTAs */}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 7 }}>
            {scamChoice === "YES_COACHED" ? (
              <button
                type="button"
                disabled={isVerifying}
                onClick={() =>
                  onResolveStepUp(
                    "DENIED",
                    "APP_SCAM_HALTED",
                    "Customer acknowledged scam coaching. Transaction prevented."
                  )
                }
                style={{
                  padding: "11px 16px",
                  borderRadius: 8,
                  background: "#991B1B",
                  color: "#FFFFFF",
                  border: "1px solid #B91C1C",
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <span>Cancel &amp; Protect Account</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={isVerifying || scamChoice !== "NO_GENUINE" || !acknowledgedLegal}
                onClick={() =>
                  onResolveStepUp(
                    "APPROVED",
                    "SCAM_ACKNOWLEDGED_RELEASE",
                    "Customer completed mandatory anti-scam assessment and confirmed acquaintance."
                  )
                }
                style={{
                  padding: "11px 16px",
                  borderRadius: 8,
                  background: acknowledgedLegal ? bankTheme.accentSolid : bankTheme.btnSecondaryBg,
                  color: acknowledgedLegal ? "#FFFFFF" : subTextColor,
                  border: acknowledgedLegal ? "none" : `1px solid ${bankTheme.btnSecondaryBorder}`,
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: acknowledgedLegal ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <span>Authorize &amp; Send</span>
              </button>
            )}

            <button
              type="button"
              disabled={isVerifying}
              onClick={() =>
                onResolveStepUp(
                  "DENIED",
                  "CUSTOMER_ABORTED",
                  "Cardholder opted to abort transfer following fraud advisory."
                )
              }
              style={{
                padding: "8px",
                borderRadius: 8,
                background: "transparent",
                border: `1px solid ${bankTheme.cardBorder}`,
                color: subTextColor,
                fontSize: 10.5,
                fontWeight: 500,
                cursor: "pointer"
              }}
            >
              Cancel Transfer
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
