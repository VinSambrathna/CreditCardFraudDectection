import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Shield,
  ArrowRight,
  Activity,
  Cpu,
  Lock,
  Building2,
  QrCode,
  Bell,
  Code2
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import AnimatedNumber from "../components/AnimatedNumber";
import { getDashboardStatistics } from "../services/api";

export default function Landing({
  onEnterCustomer,
  onEnterOps,
  onEnterIntegration,
  onEnterPrivacy
}) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardStatistics();
        setStats(data);
      } catch (err) {
        console.error("Landing stats fetch error:", err);
      }
    }
    loadStats();
  }, []);

  const totalVol = stats?.summary?.total_volume_usd || 18450.0;
  const totalTx = stats?.summary?.total_transactions || 48;
  const fraudRate = stats?.summary?.fraud_rate_pct || 4.2;

  return (
    <div
      style={{
        minHeight: "calc(100dvh - 140px)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "32px 20px 60px",
        maxWidth: 980,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      {/* Brand Identity Wordmark */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 24 }}
      >
        <BrandLogo variant="stacked" emblemSize={42} />
      </motion.div>

      {/* Hero Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontSize: "clamp(28px, 4.5vw, 44px)",
          fontWeight: 800,
          color: "var(--text-1)",
          letterSpacing: "-0.035em",
          lineHeight: 1.15,
          maxWidth: 820,
          marginBottom: 16,
        }}
      >
        Multi-Tenant AI Fraud Intelligence Platform
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontSize: 15,
          color: "var(--text-2)",
          lineHeight: 1.6,
          maxWidth: 680,
          marginBottom: 28,
        }}
      >
        Enterprise fraud prevention that financial institutions integrate into their existing payment flows. Screen KHQR and card transactions, explain decisions using exact TreeSHAP, and trigger bank-controlled step-up challenges.
      </motion.p>

      {/* Live Backend Telemetry Strip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, delay: 0.18 }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 16,
          padding: "8px 18px",
          borderRadius: "var(--radius-pill)",
          background: "#FFFFFF",
          border: "1px solid rgba(15, 23, 42, 0.08)",
          boxShadow: "0 2px 8px rgba(15, 23, 42, 0.04)",
          fontSize: 12,
          fontFamily: "var(--font-mono)",
          color: "var(--text-2)",
          marginBottom: 36,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="live-pulse-dot" />
          <span style={{ fontWeight: 600, color: "var(--text-1)" }}>Gateway Active:</span>
        </div>
        <div className="tabular-nums">
          Volume:{" "}
          <strong style={{ color: "var(--text-1)" }}>
            <AnimatedNumber value={totalVol} prefix="$" decimals={2} />
          </strong>
        </div>
        <span style={{ color: "var(--text-4)", lineHeight: 0 }}>&bull;</span>
        <div className="tabular-nums">
          Operations:{" "}
          <strong style={{ color: "var(--text-1)" }}>{totalTx}</strong>
        </div>
        <span style={{ color: "var(--text-4)", lineHeight: 0 }}>&bull;</span>
        <div className="tabular-nums">
          Fraud Flagged:{" "}
          <strong style={{ color: "var(--rose)" }}>{fraudRate}%</strong>
        </div>
        <span style={{ color: "var(--text-4)", lineHeight: 0 }}>&bull;</span>
        <div className="tabular-nums">
          Model:{" "}
          <strong style={{ color: "var(--cobalt)" }}>XGBoost + TreeSHAP</strong>
        </div>
      </motion.div>

      {/* Four Core Entry Doors (Pillars) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 14,
          width: "100%",
          maxWidth: 940,
          marginBottom: 40,
        }}
      >
        {/* Door 1: External Bank Simulator */}
        <button
          type="button"
          onClick={onEnterCustomer}
          className="surface-card"
          style={{
            padding: "20px",
            textAlign: "left",
            cursor: "pointer",
            border: "1.5px solid rgba(15, 23, 42, 0.08)",
            transition: "all 180ms ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--cobalt)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(15, 23, 42, 0.08)";
            e.currentTarget.style.transform = "none";
          }}
        >
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--cobalt-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--cobalt)", marginBottom: 12 }}>
            <QrCode style={{ width: 18, height: 18 }} />
          </div>
          <span className="section-label" style={{ fontSize: 10 }}>Pillar 1 &bull; Part A</span>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginTop: 2, marginBottom: 4 }}>
            Bank Simulator
          </h3>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.45, marginBottom: 12 }}>
            Test KHQR and card payments across 5 Cambodian scenarios with step-up OTP challenges.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "var(--cobalt)" }}>
            <span>Open Simulator</span>
            <ArrowRight style={{ width: 12, height: 12 }} />
          </div>
        </button>

        {/* Door 2: Fraud Operations Console */}
        <button
          type="button"
          onClick={onEnterOps}
          className="surface-card"
          style={{
            padding: "20px",
            textAlign: "left",
            cursor: "pointer",
            border: "1.5px solid rgba(15, 23, 42, 0.08)",
            transition: "all 180ms ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--text-1)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(15, 23, 42, 0.08)";
            e.currentTarget.style.transform = "none";
          }}
        >
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(15, 23, 42, 0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-1)", marginBottom: 12 }}>
            <Bell style={{ width: 18, height: 18 }} />
          </div>
          <span className="section-label" style={{ fontSize: 10 }}>Pillar 2 &bull; Part C</span>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginTop: 2, marginBottom: 4 }}>
            Live Fraud Alerts
          </h3>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.45, marginBottom: 12 }}>
            Real-time WebSocket alerts stream, portfolio surveillance, and interactive SHAP forensics.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "var(--text-1)" }}>
            <span>Open Alert Feed</span>
            <ArrowRight style={{ width: 12, height: 12 }} />
          </div>
        </button>

        {/* Door 3: B2B Institution Integration */}
        <button
          type="button"
          onClick={onEnterIntegration}
          className="surface-card"
          style={{
            padding: "20px",
            textAlign: "left",
            cursor: "pointer",
            border: "1.5px solid rgba(15, 23, 42, 0.08)",
            transition: "all 180ms ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--emerald)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(15, 23, 42, 0.08)";
            e.currentTarget.style.transform = "none";
          }}
        >
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--emerald-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--emerald)", marginBottom: 12 }}>
            <Building2 style={{ width: 18, height: 18 }} />
          </div>
          <span className="section-label" style={{ fontSize: 10 }}>Pillar 3 &bull; Integration</span>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginTop: 2, marginBottom: 4 }}>
            Bank Onboarding
          </h3>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.45, marginBottom: 12 }}>
            Configure ABA, ACLEDA, Wing, issue API keys, and map bank fields to ML inputs.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "var(--emerald)" }}>
            <span>Manage Banks</span>
            <ArrowRight style={{ width: 12, height: 12 }} />
          </div>
        </button>

        {/* Door 4: Data Privacy & Minimization */}
        <button
          type="button"
          onClick={onEnterPrivacy}
          className="surface-card"
          style={{
            padding: "20px",
            textAlign: "left",
            cursor: "pointer",
            border: "1.5px solid rgba(15, 23, 42, 0.08)",
            transition: "all 180ms ease"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--amber)";
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(15, 23, 42, 0.08)";
            e.currentTarget.style.transform = "none";
          }}
        >
          <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--amber-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--amber)", marginBottom: 12 }}>
            <Lock style={{ width: 18, height: 18 }} />
          </div>
          <span className="section-label" style={{ fontSize: 10 }}>Pillar 4 &bull; Security</span>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginTop: 2, marginBottom: 4 }}>
            Data Privacy
          </h3>
          <p style={{ fontSize: 11.5, color: "var(--text-3)", lineHeight: 1.45, marginBottom: 12 }}>
            Audit what SentinelPay receives versus what stays in the bank (Zero-PII guarantee).
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700, color: "var(--amber)" }}>
            <span>Inspect Privacy Matrix</span>
            <ArrowRight style={{ width: 12, height: 12 }} />
          </div>
        </button>
      </motion.div>

      {/* Feature Bullet Badges */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          color: "var(--text-3)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Activity style={{ width: 12, height: 12, color: "var(--cobalt)" }} />
          <span>Multi-Tenant Architecture</span>
        </div>
        <span>&bull;</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Cpu style={{ width: 12, height: 12, color: "var(--emerald)" }} />
          <span>Exact Local TreeSHAP Attributions</span>
        </div>
        <span>&bull;</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Lock style={{ width: 12, height: 12, color: "var(--amber)" }} />
          <span>Bank-Controlled Step-Up Verification</span>
        </div>
      </div>
    </div>
  );
}
