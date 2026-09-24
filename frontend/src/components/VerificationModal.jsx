import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RotateCw,
  X,
  Clock,
} from "lucide-react";
import { verifyTransaction } from "../services/api";

export default function VerificationModal({
  isOpen,
  onClose,
  transaction,
  onVerificationComplete,
}) {
  const [otpCode] = useState("123456");
  const [timeLeft, setTimeLeft] = useState(300);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const authorizeButtonRef = useRef(null);

  // Focus management & keyboard trap
  useEffect(() => {
    if (!isOpen) return;
    setTimeLeft(300);
    setError(null);

    // Initial focus on authorize button for fast action
    const timerFocus = setTimeout(() => {
      authorizeButtonRef.current?.focus();
    }, 100);

    const timer = setInterval(() => {
      setTimeLeft((p) => (p > 0 ? p - 1 : 0));
    }, 1000);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timerFocus);
      clearInterval(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !transaction) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  const handleAction = async (action) => {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await verifyTransaction({
        transaction_token:
          transaction.transaction_id || transaction.transaction_token,
        otp_code: otpCode,
        action,
      });
      onVerificationComplete(res);
    } catch (err) {
      setError(err.message || "Verification challenge failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          background: "rgba(10, 15, 29, 0.45)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
        onClick={onClose}
      >
        <motion.div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-desc"
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 4 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bezel-shell"
          style={{
            width: "100%",
            maxWidth: 440,
            background: "#FFFFFF",
            boxShadow: "0 24px 60px -12px rgba(10, 15, 29, 0.3)",
          }}
        >
          <div className="bezel-core" style={{ padding: "24px 26px" }}>
          {/* Header */}
          <div
            style={{
              paddingBottom: 16,
              borderBottom: "1px solid var(--shell-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: "var(--amber-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--amber)",
                }}
              >
                <ShieldAlert style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <h3 id="modal-title" style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
                  3DS2 Step-Up Challenge
                </h3>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                  High-friction authentication hold
                </span>
              </div>
            </div>

            <button
              ref={closeButtonRef}
              onClick={onClose}
              type="button"
              aria-label="Close verification modal"
              style={{
                background: "var(--shell-bg)",
                border: "none",
                color: "var(--text-3)",
                cursor: "pointer",
                padding: 5,
                display: "flex",
                alignItems: "center",
                borderRadius: 8,
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          </div>

          {/* Context box */}
          <div
            id="modal-desc"
            style={{
              padding: "14px 16px",
              borderRadius: 14,
              background: "var(--amber-light)",
              border: "1px solid var(--amber-border)",
              fontSize: 12,
              color: "var(--amber)",
              lineHeight: 1.5,
              marginBottom: 18,
            }}
          >
            Transaction{" "}
            <strong style={{ fontFamily: "var(--font-mono)", color: "var(--text-1)" }}>
              {transaction.transaction_id || transaction.transaction_token}
            </strong>{" "}
            for{" "}
            <strong style={{ fontFamily: "var(--font-mono)", color: "var(--text-1)" }}>
              ${(transaction.amount || 1850).toFixed(2)}
            </strong>{" "}
            held on review (Risk: {((transaction.fraud_probability || 0.65) * 100).toFixed(1)}%).
          </div>

          {/* OTP Code Display */}
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 8,
                fontSize: 12,
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--text-1)" }}>One-Time Passcode</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--text-3)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                <Clock style={{ width: 11, height: 11 }} /> Expires {timeFormatted}
              </span>
            </div>

            {/* 6 digits */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 6 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height: 48,
                    borderRadius: 12,
                    background: "var(--shell-bg)",
                    border: "1px solid var(--shell-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 18,
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-1)",
                  }}
                >
                  {otpCode[i]}
                </div>
              ))}
            </div>

            <div style={{ textAlign: "center", fontSize: 11, color: "var(--text-4)", fontFamily: "var(--font-mono)" }}>
              Demo simulation code: <kbd>123456</kbd>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="error-message-enter"
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                background: "var(--rose-light)",
                border: "1px solid var(--rose-border)",
                color: "var(--rose)",
                fontSize: 12,
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              ref={authorizeButtonRef}
              type="button"
              onClick={() => handleAction("APPROVE")}
              disabled={isProcessing}
              aria-busy={isProcessing}
              className="btn-island"
              style={{ flex: 1 }}
            >
              <span>{isProcessing ? "Verifying..." : "Authorize"}</span>
              <div className="icon-nest">
                {isProcessing ? (
                  <RotateCw style={{ width: 13, height: 13, animation: "spin 1s linear infinite" }} />
                ) : (
                  <CheckCircle2 style={{ width: 14, height: 14 }} />
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleAction("DENY")}
              disabled={isProcessing}
              className="btn-island-secondary"
              style={{ flex: 1, justifyContent: "center", color: "var(--rose)", borderColor: "var(--rose-border)" }}
            >
              <XCircle style={{ width: 14, height: 14 }} />
              Decline & Block
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
  );
}
