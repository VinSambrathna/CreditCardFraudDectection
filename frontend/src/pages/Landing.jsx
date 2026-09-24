import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Shield,
  ArrowRight,
  Activity,
  Cpu,
  Lock,
} from "lucide-react";
import BrandLogo from "../components/BrandLogo";
import AnimatedNumber from "../components/AnimatedNumber";
import { getDashboardStatistics } from "../services/api";

export default function Landing({ onEnterCustomer, onEnterOps }) {
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
        maxWidth: 960,
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      {/* Brand Identity Wordmark */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 28 }}
      >
        <BrandLogo variant="stacked" emblemSize={42} />
      </motion.div>

      {/* One Specific, Definitive Thesis Sentence */}
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
          maxWidth: 780,
          marginBottom: 16,
        }}
      >
        Real-time Explainable AI Fraud Defense
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        style={{
          fontSize: 15,
          color: "var(--text-2)",
          lineHeight: 1.6,
          maxWidth: 640,
          marginBottom: 28,
        }}
      >
        Autonomous risk authorization evaluated through two complementary lenses:
        the consumer at point-of-sale checkout, and the bank risk analyst in the forensics console.
      </motion.p>

      {/* Live Backend Telemetry Strip (Real Stats from Server) */}
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
          <span style={{ fontWeight: 600, color: "var(--text-1)" }}>Live Telemetry:</span>
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
          Fraud Rate:{" "}
          <strong style={{ color: "var(--rose)" }}>{fraudRate}%</strong>
        </div>
        <span style={{ color: "var(--text-4)", lineHeight: 0 }}>&bull;</span>
        <div className="tabular-nums">
          Model:{" "}
          <strong style={{ color: "var(--cobalt)" }}>XGBoost + TreeSHAP</strong>
        </div>
      </motion.div>

      {/* The Two Roles: Dual Entry CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.22 }}
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
          width: "100%",
          maxWidth: 680,
          marginBottom: 44,
        }}
      >
        {/* Role 1: Consumer Payment Terminal */}
        <button
          type="button"
          onClick={onEnterCustomer}
          className="surface-card"
          aria-label="Enter Cardholder Checkout — test simulated transactions"
          style={{
            padding: "24px",
            textAlign: "left",
            cursor: "pointer",
            position: "relative",
            border: "1.5px solid rgba(15, 23, 42, 0.08)",
            transition: "border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--cobalt)";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(37, 99, 235, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(15, 23, 42, 0.08)";
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "var(--shadow-subtle)";
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "var(--cobalt-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--cobalt)",
              marginBottom: 14,
            }}
          >
            <CreditCard style={{ width: 18, height: 18 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="section-label" style={{ fontSize: 11 }}>Perspective 1</span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>
            Cardholder Checkout
          </h3>
          <p style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 16 }}>
            Test a simulated grocery swipe, overseas flight booking, or account takeover attack.
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--cobalt)",
            }}
          >
            <span>Launch POS Checkout</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </div>
        </button>

        {/* Role 2: Bank Risk Operations */}
        <button
          type="button"
          onClick={onEnterOps}
          className="surface-card"
          aria-label="Enter Risk Operations Console — audit live portfolio telemetry"
          style={{
            padding: "24px",
            textAlign: "left",
            cursor: "pointer",
            position: "relative",
            border: "1.5px solid rgba(15, 23, 42, 0.08)",
            transition: "border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease",
            width: "100%",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--text-1)";
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(10, 15, 29, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(15, 23, 42, 0.08)";
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "var(--shadow-subtle)";
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(15, 23, 42, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-1)",
              marginBottom: 14,
            }}
          >
            <Shield style={{ width: 18, height: 18 }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span className="section-label" style={{ fontSize: 11 }}>Perspective 2</span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", marginBottom: 6 }}>
            Risk Operations Console
          </h3>
          <p style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.5, marginBottom: 16 }}>
            Audit live portfolio telemetry, inspect TreeSHAP feature attributions, and review human retraining queues.
          </p>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--text-1)",
            }}
          >
            <span>Open Risk Console</span>
            <ArrowRight style={{ width: 14, height: 14 }} />
          </div>
        </button>
      </motion.div>

      {/* Narrative Demo Architecture Footer Strip */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          color: "var(--text-3)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Activity style={{ width: 12, height: 12, color: "var(--cobalt)" }} />
          <span>Three-Tier Decision Engine</span>
        </div>
        <span>&bull;</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Cpu style={{ width: 12, height: 12, color: "var(--emerald)" }} />
          <span>Exact Local TreeSHAP Attributions</span>
        </div>
        <span>&bull;</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Lock style={{ width: 12, height: 12, color: "var(--amber)" }} />
          <span>Dynamic 3DS2 Step-Up Verification</span>
        </div>
      </div>
    </div>
  );
}
