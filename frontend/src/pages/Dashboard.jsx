import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  RotateCw,
  Search,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Database,
  Inbox,
} from "lucide-react";
import { getDashboardStatistics, getTransactions } from "../services/api";
import AnimatedNumber from "../components/AnimatedNumber";

export default function Dashboard({ onSelectTransaction }) {
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const refreshData = async () => {
    setLoading(true);
    try {
      const [s, t] = await Promise.all([
        getDashboardStatistics(),
        getTransactions(50),
      ]);
      setStats(s);
      setTransactions(t);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const summary = stats?.summary || {
    total_transactions: 0,
    total_volume_usd: 0,
    fraud_flagged: 0,
    fraud_rate_pct: 0,
    approved: 0,
    soft_blocked_pending: 0,
    blocked: 0,
    feedback_records_ready_for_retraining: 0,
  };

  const riskDist = stats?.risk_distribution || { low: 0, review: 0, high: 0 };
  const totalRisk = riskDist.low + riskDist.review + riskDist.high || 1;
  const pctLow = Math.round((riskDist.low / totalRisk) * 100);
  const pctReview = Math.round((riskDist.review / totalRisk) * 100);
  const pctHigh = 100 - pctLow - pctReview;

  const filtered = transactions.filter((tx) => {
    const mf =
      filter === "ALL" ||
      (filter === "APPROVED" &&
        (tx.status === "APPROVED" || tx.status === "VERIFIED")) ||
      (filter === "SOFT_BLOCKED" && tx.status === "SOFT_BLOCKED") ||
      (filter === "BLOCKED" && tx.status === "BLOCKED");
    const ms =
      (tx.transaction_token || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      String(tx.user_id || "").includes(searchTerm);
    return mf && ms;
  });

  return (
    <div className="page-container">
      {/* Header */}
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
            <span className="section-label">Risk Surveillance</span>
          </div>
          <h1 className="page-title">Operations &amp; Risk Telemetry</h1>
          <p className="page-subtitle">
            Portfolio-wide settlement surveillance, population risk stratification, and human retraining queues.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            className="tabular-nums"
            style={{
              fontSize: 11,
              color: "var(--text-3)",
              fontFamily: "var(--font-mono)",
            }}
          >
            Sync {lastRefreshed.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          <button
            onClick={refreshData}
            disabled={loading}
            className="btn-island-secondary"
            style={{ fontSize: 12, padding: "7px 14px" }}
          >
            <RotateCw
              style={{
                width: 13,
                height: 13,
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />
            {loading ? "Polling..." : "Refresh Feed"}
          </button>
        </div>
      </div>

      {/* Asymmetrical KPI Layout: 2x Hero KPI Spotlight + 3 Calibrated Companions */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: 14,
          }}
        >
          {/* Hero Spotlight KPI: Processed Volume (6 columns on desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="bezel-shell card-kpi-hero col-span-12 lg:col-span-6"
          >
            <div className="bezel-core" style={{ padding: "22px 26px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="section-label" style={{ fontSize: 11 }}>
                    Portfolio Settled Volume
                  </span>
                  <span
                    className="status-tag status-tag-cobalt"
                    style={{ fontSize: 11, padding: "1px 6px" }}
                  >
                    Hero Metric
                  </span>
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: "var(--cobalt-light)",
                    border: "1px solid var(--cobalt-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--cobalt)",
                  }}
                >
                  <TrendingUp style={{ width: 16, height: 16 }} />
                </div>
              </div>
              <div className="kpi-numeral-hero" style={{ marginBottom: 6 }}>
                <AnimatedNumber
                  value={summary.total_volume_usd || 0}
                  prefix="$"
                  decimals={2}
                />
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: "var(--text-3)",
                  paddingTop: 8,
                  borderTop: "1px solid rgba(15, 23, 42, 0.05)",
                }}
              >
                <span>{summary.total_transactions} operations evaluated</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--emerald)", fontWeight: 600 }}>
                  100% TreeSHAP screened
                </span>
              </div>
            </div>
          </motion.div>

          {/* Companion 1: Fraud Rate (2 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.06 }}
            className="surface-card col-span-12 sm:col-span-4 lg:col-span-2"
            style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span className="section-label" style={{ fontSize: 11 }}>Fraud Rate</span>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--rose-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--rose)" }}>
                  <ShieldAlert style={{ width: 13, height: 13 }} />
                </div>
              </div>
              <div className="kpi-numeral-standard" style={{ color: "var(--rose)", marginBottom: 4 }}>
                <AnimatedNumber value={summary.fraud_rate_pct || 0} suffix="%" decimals={1} />
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 500 }}>
              {summary.fraud_flagged} anomalies caught
            </div>
          </motion.div>

          {/* Companion 2: Clearance Ratio (2 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.1 }}
            className="surface-card col-span-12 sm:col-span-4 lg:col-span-2"
            style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span className="section-label" style={{ fontSize: 11 }}>Clearance Ratio</span>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--emerald-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--emerald)" }}>
                  <CheckCircle2 style={{ width: 13, height: 13 }} />
                </div>
              </div>
              <div className="kpi-numeral-standard" style={{ color: "var(--emerald)", marginBottom: 4 }}>
                <AnimatedNumber value={summary.approved || 0} decimals={0} />
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 500 }}>
              {summary.blocked || 0} blocked, {summary.soft_blocked_pending || 0} held
            </div>
          </motion.div>

          {/* Companion 3: Retraining Pool (2 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, delay: 0.14 }}
            className="surface-card col-span-12 sm:col-span-4 lg:col-span-2"
            style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span className="section-label" style={{ fontSize: 11 }}>Retraining Pool</span>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: "var(--shell-bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)" }}>
                  <Database style={{ width: 13, height: 13 }} />
                </div>
              </div>
              <div className="kpi-numeral-standard" style={{ color: "var(--text-1)", marginBottom: 4 }}>
                <AnimatedNumber value={summary.feedback_records_ready_for_retraining || 0} decimals={0} />
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-3)", fontWeight: 500 }}>
              Human feedback labels
            </div>
          </motion.div>
        </div>
      </div>

      {/* Population Stratification: Instrument-Grade Risk Distribution */}
      <div className="surface-card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="section-label" style={{ fontSize: 11 }}>Instrument Envelope</span>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--text-1)" }}>
                Population Risk Stratification
              </span>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 2 }}>
              Active settlement distribution calibrated against the 3-tier operational boundary.
            </p>
          </div>

          <div
            className="tabular-nums"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
            }}
          >
            <span style={{ color: "var(--emerald)", fontWeight: 700 }}>
              Low: {pctLow}% ({riskDist.low})
            </span>
            <span style={{ color: "var(--amber)", fontWeight: 700 }}>
              Challenge: {pctReview}% ({riskDist.review})
            </span>
            <span style={{ color: "var(--rose)", fontWeight: 700 }}>
              Blocked: {pctHigh}% ({riskDist.high})
            </span>
          </div>
        </div>

        {/* Calibrated Instrument Track with Micro Gaps */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 10,
            borderRadius: 6,
            background: "var(--shell-bg)",
            display: "flex",
            overflow: "hidden",
            gap: 2,
            padding: 1,
          }}
        >
          <div
            style={{
              width: `${pctLow}%`,
              background: "var(--emerald)",
              borderRadius: "4px 0 0 4px",
              transition: "width 240ms ease",
            }}
            title={`Low Risk (&lt;0.35): ${pctLow}%`}
          />
          <div
            style={{
              width: `${pctReview}%`,
              background: "var(--amber)",
              transition: "width 240ms ease",
            }}
            title={`3DS2 Challenge (0.35 - 0.70): ${pctReview}%`}
          />
          <div
            style={{
              width: `${pctHigh}%`,
              background: "var(--rose)",
              borderRadius: "0 4px 4px 0",
              transition: "width 240ms ease",
            }}
            title={`Hard Block (&ge;0.70): ${pctHigh}%`}
          />
        </div>

        {/* Instrument Ticks and Calibration Points */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--text-3)",
            marginTop: 8,
            paddingTop: 4,
            borderTop: "1px dashed rgba(15, 23, 42, 0.08)",
          }}
        >
          <span>0.00 (Autonomous Pass)</span>
          <span style={{ color: "var(--amber)", fontWeight: 600 }}>&uarr; 0.35 Threshold (3DS2 OTP)</span>
          <span style={{ color: "var(--rose)", fontWeight: 600 }}>&uarr; 0.70 Threshold (Immediate Block)</span>
          <span>1.00 (Critical Fraud)</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          marginBottom: 14,
        }}
      >
        {/* Filter Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "var(--shell-bg)",
            padding: 3,
            borderRadius: "var(--radius-pill)",
          }}
        >
          {[
            { id: "ALL", label: "All Transactions" },
            { id: "APPROVED", label: "Approved" },
            { id: "SOFT_BLOCKED", label: "3DS2 Holds" },
            { id: "BLOCKED", label: "Blocked" },
          ].map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                style={{
                  padding: "5px 14px",
                  borderRadius: "var(--radius-pill)",
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  border: "none",
                  cursor: "pointer",
                  background: active ? "var(--text-1)" : "transparent",
                  color: active ? "#FFFFFF" : "var(--text-2)",
                  boxShadow: active ? "0 2px 6px rgba(10, 15, 29, 0.2)" : "none",
                  transition: "all 140ms var(--ease-spring)",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: "relative", minWidth: 260 }}>
          <Search
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              width: 14,
              height: 14,
              color: "var(--text-4)",
            }}
          />
          <input
            type="text"
            placeholder="Search token or user ID..."
            aria-label="Search transactions by token or user ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-machined"
            style={{
              paddingLeft: 34,
              paddingTop: 7,
              paddingBottom: 7,
              fontSize: 12,
              borderRadius: "var(--radius-pill)",
            }}
          />
        </div>
      </div>

      {/* Transactions Table (Clean hairline container, rationing bezels) */}
      <div className="surface-card" style={{ padding: 0, overflow: "hidden", marginBottom: 32 }}>
        <div className="overflow-x-auto">
            <table
              className="table-machined table-mobile-cards"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--shell-bg)",
                    borderBottom: "1px solid var(--shell-border)",
                  }}
                >
                  <th style={{ padding: "12px 18px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Token
                  </th>
                  <th style={{ padding: "12px 18px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Cardholder
                  </th>
                  <th style={{ padding: "12px 18px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Amount
                  </th>
                  <th style={{ padding: "12px 18px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Distance
                  </th>
                  <th style={{ padding: "12px 18px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Risk Score
                  </th>
                  <th style={{ padding: "12px 18px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Verdict
                  </th>
                  <th style={{ padding: "12px 18px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "right" }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? (
                  filtered.map((tx, i) => {
                    const ok =
                      tx.status === "APPROVED" || tx.status === "VERIFIED";
                    const isReview = tx.status === "SOFT_BLOCKED";
                    const prob = (tx.fraud_probability || 0) * 100;

                    return (
                      <tr
                        key={tx.id || tx.transaction_token || i}
                        tabIndex={0}
                        role="button"
                        aria-label={`Transaction ${tx.transaction_token}, user ${tx.user_id}, amount $${(tx.amount || 0).toFixed(2)}, status ${tx.status}`}
                        style={{
                          borderBottom: "1px solid var(--shell-bg)",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          if (onSelectTransaction) onSelectTransaction(tx);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (onSelectTransaction) onSelectTransaction(tx);
                          }
                        }}
                      >
                        <td
                          style={{
                            padding: "13px 18px",
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--text-1)",
                          }}
                        >
                          {tx.transaction_token}
                        </td>
                        <td style={{ padding: "13px 18px", color: "var(--text-2)" }}>
                          <span>
                            #{tx.user_id}{" "}
                            <span style={{ fontSize: 12, color: "var(--text-4)" }}>
                              ({tx.user_id === 1002 ? "Jonathan V." : "Alex M."})
                            </span>
                          </span>
                        </td>
                        <td
                          style={{
                            padding: "13px 18px",
                            fontFamily: "var(--font-mono)",
                            fontWeight: 700,
                            color: "var(--text-1)",
                          }}
                        >
                          ${(tx.amount || 0).toFixed(2)}
                        </td>
                        <td
                          style={{
                            padding: "13px 18px",
                            fontFamily: "var(--font-mono)",
                            fontSize: 12,
                            color: "var(--text-3)",
                          }}
                        >
                          {(tx.distance || 0).toFixed(1)} km
                        </td>
                        <td style={{ padding: "13px 18px" }}>
                          <span
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 12,
                              fontWeight: 700,
                              color: ok
                                ? "var(--emerald)"
                                : isReview
                                ? "var(--amber)"
                                : "var(--rose)",
                            }}
                          >
                            {prob.toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ padding: "13px 18px" }}>
                          <span
                            className={`status-tag ${
                              ok
                                ? "status-approved"
                                : isReview
                                ? "status-review"
                                : "status-blocked"
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ padding: "13px 18px", textAlign: "right" }}>
                          <button
                            type="button"
                            aria-label={`Inspect transaction ${tx.transaction_token}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectTransaction) onSelectTransaction(tx);
                            }}
                            className="btn-island-secondary"
                            style={{
                              padding: "4px 10px",
                              fontSize: 11,
                              borderRadius: "var(--radius-pill)",
                            }}
                          >
                            Inspect <ArrowUpRight style={{ width: 11, height: 11 }} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--shell-bg)" }}>
                      <td style={{ padding: "14px 18px" }}><div className="skeleton skeleton-text" style={{ width: 90 }} /></td>
                      <td style={{ padding: "14px 18px" }}><div className="skeleton skeleton-text" style={{ width: 70 }} /></td>
                      <td style={{ padding: "14px 18px" }}><div className="skeleton skeleton-text" style={{ width: 60 }} /></td>
                      <td style={{ padding: "14px 18px" }}><div className="skeleton skeleton-text" style={{ width: 50 }} /></td>
                      <td style={{ padding: "14px 18px" }}><div className="skeleton skeleton-text" style={{ width: 45 }} /></td>
                      <td style={{ padding: "14px 18px" }}><div className="skeleton skeleton-text" style={{ width: 80 }} /></td>
                      <td style={{ padding: "14px 18px", textAlign: "right" }}><div className="skeleton skeleton-text" style={{ width: 55, marginLeft: "auto" }} /></td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: "54px 18px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: "var(--shell-bg)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "var(--text-3)",
                          }}
                        >
                          <Inbox style={{ width: 22, height: 22 }} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                          No matching records found
                        </div>
                        <p style={{ fontSize: 12, color: "var(--text-3)", maxWidth: 300, lineHeight: 1.5 }}>
                          No transactions match the current filter or search criteria.
                        </p>
                        {(filter !== "ALL" || searchTerm) && (
                          <button
                            onClick={() => {
                              setFilter("ALL");
                              setSearchTerm("");
                            }}
                            className="btn-island-secondary"
                            style={{ marginTop: 6, fontSize: 12, padding: "5px 14px" }}
                          >
                            Reset filters & search
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  );
}
