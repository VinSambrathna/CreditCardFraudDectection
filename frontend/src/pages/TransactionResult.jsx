import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  RotateCcw,
  Copy,
  Check,
  ArrowRight,
  KeyRound,
  CreditCard,
  Cpu,
} from "lucide-react";
import VerificationModal from "../components/VerificationModal";
import AnimatedNumber from "../components/AnimatedNumber";

export default function TransactionResult({
  transaction,
  onReset,
  onNavigateToIntelligence,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTx, setCurrentTx] = useState(transaction);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCurrentTx(transaction);
  }, [transaction]);

  if (!currentTx) {
    return (
      <div className="page-container" style={{ padding: "64px 24px", textAlign: "center" }}>
        <div className="bezel-shell" style={{ maxWidth: 440, margin: "0 auto" }}>
          <div className="bezel-core" style={{ padding: "40px 28px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "var(--shell-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-1)",
                marginBottom: 14,
              }}
            >
              <CreditCard style={{ width: 22, height: 22 }} />
            </div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>
              No Active Transaction
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 24, maxWidth: 280, lineHeight: 1.5 }}>
              Execute a simulated transaction to evaluate the risk score and see model outputs.
            </p>
            <button onClick={onReset} className="btn-island">
              <span>Return to Simulator</span>
              <div className="icon-nest">
                <RotateCcw style={{ width: 14, height: 14 }} />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isApproved =
    currentTx.status === "APPROVED" || currentTx.status === "VERIFIED";
  const isSoftBlocked = currentTx.status === "SOFT_BLOCKED";
  const probPercent = ((currentTx.fraud_probability || 0) * 100).toFixed(1);

  const handleVerificationComplete = (res) => {
    setCurrentTx((prev) => ({ ...prev, status: res.status }));
    setIsModalOpen(false);
  };

  const copyToken = () => {
    const t = currentTx.transaction_id || currentTx.transaction_token || "";
    if (t) {
      navigator.clipboard.writeText(t);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const StatusIcon = isApproved
    ? ShieldCheck
    : isSoftBlocked
    ? ShieldAlert
    : AlertOctagon;

  const statusTheme = isApproved
    ? {
        color: "var(--emerald)",
        statusClass: "status-approved",
        title: "Transaction Cleared for Settlement",
        description:
          "Calculated risk falls safely within the automated clearance envelope. Authorized without friction.",
      }
    : isSoftBlocked
    ? {
        color: "var(--amber)",
        statusClass: "status-review",
        title: "Step-Up Verification Challenge Triggered",
        description:
          "Risk exceeds automated clearance threshold due to anomalous telemetry signals. Payment held pending OTP.",
      }
    : {
        color: "var(--rose)",
        statusClass: "status-blocked",
        title: "Authorization Declined",
        description:
          "Risk exceeds the hard denial threshold (0.70). High-confidence fraud indicators detected. Transaction blocked.",
      };

  return (
    <div className="page-container">
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="section-kicker">Point of Sale</span>
            <span style={{ color: "var(--text-4)", fontSize: 11 }}>/</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-3)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Authorization Receipt
            </span>
            <span style={{ color: "var(--text-4)" }}>·</span>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>
              {currentTx.transaction_id || currentTx.transaction_token}
            </span>
          </div>
          <h1 className="page-title">Authorization Outcome</h1>
          <p className="page-subtitle">
            Real-time settlement decision issued by the SentinelPay risk evaluation engine.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={onNavigateToIntelligence}
            className="btn-island-secondary"
            style={{ fontSize: 12, padding: "7px 14px" }}
          >
            Audit in Fraud Forensics &rarr;
          </button>
          <button onClick={onReset} className="btn-island-primary" style={{ fontSize: 12, padding: "7px 16px" }}>
            <RotateCcw style={{ width: 13, height: 13 }} /> New Checkout
          </button>
        </div>
      </div>

      {/* Double-Bezel Verdict Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="bezel-shell"
        style={{ marginBottom: 20 }}
      >
        <div className="bezel-core" style={{ padding: "26px 30px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 24,
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, maxWidth: 620 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: "var(--shell-bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: statusTheme.color,
                  flexShrink: 0,
                }}
              >
                <StatusIcon style={{ width: 22, height: 22 }} strokeWidth={2.2} />
              </div>
              <div>
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "var(--text-1)",
                    marginBottom: 4,
                  }}
                >
                  {statusTheme.title}
                </h2>
                <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>
                  {statusTheme.description}
                </p>
              </div>
            </div>

            {/* Risk Probability Callout */}
            <div
              style={{
                background: "var(--shell-bg)",
                borderRadius: 14,
                padding: "12px 20px",
                minWidth: 140,
                textAlign: "right",
              }}
            >
              <span className="section-label" style={{ fontSize: 11 }}>
                Evaluated Risk
              </span>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-1)",
                  lineHeight: 1.1,
                  marginTop: 3,
                }}
              >
                <AnimatedNumber value={parseFloat(probPercent)} decimals={1} suffix="%" />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: statusTheme.color,
                  fontWeight: 700,
                }}
              >
                {currentTx.risk_level || (isApproved ? "LOW" : isSoftBlocked ? "REVIEW" : "HIGH")}
              </span>
            </div>
          </div>

          {/* 3DS2 Challenge Action inside Banner */}
          {isSoftBlocked && (
            <div
              style={{
                marginTop: 20,
                paddingTop: 18,
                borderTop: "1px solid var(--shell-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 14,
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 500 }}>
                Transaction is paused under 3DS2 step-up challenge. Provide SMS OTP to authorize.
              </span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-island"
              >
                <span>Open 3DS2 Challenge</span>
                <div className="icon-nest">
                  <KeyRound style={{ width: 14, height: 14 }} />
                </div>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Details Grid (Double-Bezel) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
          gap: 16,
        }}
      >
        {/* Card 1: Settlement Details */}
        <div className="bezel-shell">
          <div className="bezel-core">
            <div
              style={{
                paddingBottom: 14,
                borderBottom: "1px solid var(--shell-bg)",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                Settlement & Ledger Specifications
              </h3>
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-4)" }}>
                Audit Record
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 0, fontSize: 13 }}>
              {[
                {
                  label: "Transaction ID",
                  value: currentTx.transaction_id || currentTx.transaction_token,
                  copy: true,
                  mono: true,
                },
                {
                  label: "Settlement Amount",
                  value: `$${(currentTx.amount || 0).toFixed(2)} USD`,
                  mono: true,
                  bold: true,
                },
                {
                  label: "Payment Instrument",
                  value: currentTx.card_brand ? `${currentTx.card_brand} (•• ${currentTx.card_last4 || "8821"})` : "Visa Signature (•• 8821)",
                  mono: true,
                },
                {
                  label: "Cardholder Account",
                  value: `#${currentTx.user_id || 1001} (${
                    currentTx.cardholder_name || (currentTx.user_id === 1002 ? "Jonathan Vance" : "Alex Morgan")
                  })`,
                },
                {
                  label: "Model Architecture",
                  value: "XGBoost v1.0.0 (45 Trees)",
                  mono: true,
                },
                {
                  label: "Policy Decision",
                  value: currentTx.status,
                  badge: true,
                },
              ].map((row, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "11px 0",
                    borderBottom: "1px solid var(--shell-bg)",
                  }}
                >
                  <span style={{ color: "var(--text-3)" }}>{row.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {row.badge ? (
                      <span className={`status-tag ${statusTheme.statusClass}`}>
                        {row.value}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontFamily: row.mono ? "var(--font-mono)" : "inherit",
                          fontWeight: row.bold ? 700 : 500,
                          color: "var(--text-1)",
                          fontSize: row.mono ? 12 : 13,
                        }}
                      >
                        {row.value}
                      </span>
                    )}
                    {row.copy && (
                      <button
                        type="button"
                        onClick={copyToken}
                        aria-label={copied ? "Transaction token copied to clipboard" : "Copy transaction token"}
                        style={{
                          background: "var(--shell-bg)",
                          border: "none",
                          borderRadius: 6,
                          cursor: "pointer",
                          color: copied ? "var(--emerald)" : "var(--text-3)",
                          display: "flex",
                          alignItems: "center",
                          padding: "3px 6px",
                        }}
                        title="Copy Token"
                      >
                        {copied ? (
                          <Check style={{ width: 12, height: 12 }} />
                        ) : (
                          <Copy style={{ width: 12, height: 12 }} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 18,
                padding: "10px 14px",
                borderRadius: 12,
                background: "var(--shell-bg)",
                fontSize: 11,
                color: "var(--text-3)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Cpu style={{ width: 14, height: 14, color: "var(--cobalt)" }} />
              <span style={{ fontFamily: "var(--font-mono)" }}>
                Inference latency: {currentTx.latency_ms ? `${Number(currentTx.latency_ms).toFixed(1)}ms` : "8.1ms"} (real-time tree evaluation)
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: SHAP Local Attribution */}
        <div className="bezel-shell">
          <div className="bezel-core" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 14,
                  borderBottom: "1px solid var(--shell-bg)",
                  marginBottom: 16,
                }}
              >
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                  Key TreeSHAP Risk Drivers
                </h3>
                <div style={{ display: "flex", gap: 10, fontSize: 11, fontFamily: "var(--font-mono)" }}>
                  <span style={{ color: "var(--rose)", fontWeight: 600 }}>Risk +</span>
                  <span style={{ color: "var(--emerald)", fontWeight: 600 }}>Protective -</span>
                </div>
              </div>

              <motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
                }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {currentTx.explanation?.length > 0 ? (
                  currentTx.explanation.slice(0, 4).map((exp, i) => {
                    const isRisk = exp.direction === "RISK_INCREASING";
                    return (
                      <motion.div
                        key={i}
                        variants={{
                          hidden: { opacity: 0, x: -6 },
                          visible: { opacity: 1, x: 0, transition: { duration: 0.25 } },
                        }}
                        style={{
                          padding: "11px 14px",
                          borderRadius: 12,
                          background: isRisk ? "var(--rose-light)" : "var(--emerald-light)",
                          border: `1px solid ${isRisk ? "var(--rose-border)" : "var(--emerald-border)"}`,
                          borderLeft: isRisk ? "3.5px solid var(--rose)" : "3.5px solid var(--emerald)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>
                            {exp.label}
                          </div>
                          <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>
                            Observation: {exp.value}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontFamily: "var(--font-mono)",
                              fontWeight: 800,
                              color: isRisk ? "var(--rose)" : "var(--emerald)",
                            }}
                          >
                            {exp.contribution > 0
                              ? `+${exp.contribution.toFixed(3)}`
                              : exp.contribution.toFixed(3)}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                            {isRisk ? "Elevates risk" : "Protective factor"}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div style={{ padding: "32px 0", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>
                    Standard baseline parameters applied. No dominant risk flags.
                  </div>
                )}
              </motion.div>
            </div>

            <button
              onClick={onNavigateToIntelligence}
              className="btn-island-secondary"
              style={{ marginTop: 22, width: "100%", justifyContent: "center" }}
            >
              Inspect Attribution Waterfall in Explainability <ArrowRight style={{ width: 13, height: 13 }} />
            </button>
          </div>
        </div>
      </div>

      {/* 3DS2 Modal */}
      <VerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        transaction={currentTx}
        onVerificationComplete={handleVerificationComplete}
      />
    </div>
  );
}
