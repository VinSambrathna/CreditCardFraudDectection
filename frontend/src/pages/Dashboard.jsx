import React, { useState, useEffect } from "react";
import {
  RotateCw,
  Search,
  ArrowUpRight,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Database,
  User,
} from "lucide-react";
import { getDashboardStatistics, getTransactions } from "../services/api";

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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              className="status-indicator status-approved"
              style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}
            >
              <span className="status-dot" />
              Production Ingestion Stream
            </span>
            <span style={{ color: "var(--text-4)" }}>·</span>
            <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
              Continuous Ingestion
            </span>
          </div>
          <h1 className="page-title">Operations & Risk Telemetry</h1>
          <p className="page-subtitle">
            Audited settlement transactions, population risk stratification, and human-in-the-loop retraining pool.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
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
            style={{ padding: "6px 14px", fontSize: 12 }}
          >
            <RotateCw
              style={{
                width: 12,
                height: 12,
                animation: loading ? "spin 1s linear infinite" : "none",
              }}
            />
            Refresh Telemetry
          </button>
        </div>
      </div>

      {/* 4 Double-Bezel KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "Processed Volume",
            value: `$${(summary.total_volume_usd || 0).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
            sub: `${summary.total_transactions} operations evaluated`,
            icon: TrendingUp,
          },
          {
            label: "Fraud Rate",
            value: `${(summary.fraud_rate_pct || 0).toFixed(1)}%`,
            sub: `${summary.fraud_flagged} anomalies caught`,
            statusClass: summary.fraud_rate_pct > 5 ? "status-blocked" : "status-review",
            badgeText: `${summary.fraud_flagged} flagged`,
            icon: ShieldAlert,
          },
          {
            label: "Clearance Ratio",
            value: `${summary.approved || 0}`,
            sub: `${summary.blocked || 0} blocked, ${summary.soft_blocked_pending || 0} held`,
            statusClass: "status-approved",
            badgeText: "Safe clearance",
            icon: CheckCircle2,
          },
          {
            label: "Retraining Pool",
            value: `${summary.feedback_records_ready_for_retraining || 0}`,
            sub: "Verified labels ready for training",
            statusClass: "status-cobalt",
            badgeText: "SMOTE Queue",
            icon: Database,
          },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bezel-shell">
              <div className="bezel-core" style={{ padding: "20px 22px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span className="section-label" style={{ fontSize: 10 }}>
                    {kpi.label}
                  </span>
                  {kpi.statusClass ? (
                    <span className={`status-indicator ${kpi.statusClass}`} style={{ fontSize: 11 }}>
                      <span className="status-dot" />
                      {kpi.badgeText}
                    </span>
                  ) : (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        background: "var(--shell-bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-1)",
                      }}
                    >
                      <Icon style={{ width: 13, height: 13 }} />
                    </div>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 800,
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-1)",
                    letterSpacing: "-0.03em",
                    marginBottom: 4,
                  }}
                >
                  {kpi.value}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>
                  {kpi.sub}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Population Stratification (Double-Bezel) */}
      <div className="bezel-shell" style={{ marginBottom: 20 }}>
        <div className="bezel-core" style={{ padding: "18px 24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 12,
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                Population Risk Stratification
              </span>
              <span style={{ fontSize: 12, color: "var(--text-3)", marginLeft: 8 }}>
                (Overall distribution across all monitored transactions)
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 11, fontFamily: "var(--font-mono)" }}>
              <span style={{ color: "var(--emerald)", fontWeight: 700 }}>
                &bull; Low Risk ({pctLow}%) &bull; {riskDist.low}
              </span>
              <span style={{ color: "var(--amber)", fontWeight: 700 }}>
                &bull; 3DS2 Review ({pctReview}%) &bull; {riskDist.review}
              </span>
              <span style={{ color: "var(--rose)", fontWeight: 700 }}>
                &bull; High Risk ({pctHigh}%) &bull; {riskDist.high}
              </span>
            </div>
          </div>

          <div
            style={{
              width: "100%",
              height: 6,
              borderRadius: 99,
              background: "var(--shell-bg)",
              display: "flex",
              overflow: "hidden",
              gap: 2,
            }}
          >
            <div
              style={{ width: `${pctLow}%`, background: "var(--emerald)" }}
              title={`Low Risk: ${pctLow}%`}
            />
            <div
              style={{ width: `${pctReview}%`, background: "var(--amber)" }}
              title={`Review: ${pctReview}%`}
            />
            <div
              style={{ width: `${pctHigh}%`, background: "var(--rose)" }}
              title={`High Risk: ${pctHigh}%`}
            />
          </div>
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

      {/* Transactions Table inside Double-Bezel Enclosure */}
      <div className="bezel-shell" style={{ overflow: "hidden", marginBottom: 32 }}>
        <div className="bezel-core" style={{ padding: 0, overflow: "hidden" }}>
          <div className="overflow-x-auto">
            <table
              className="table-machined"
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
                        style={{
                          borderBottom: "1px solid var(--shell-bg)",
                          cursor: "pointer",
                        }}
                        onClick={() => onSelectTransaction && onSelectTransaction(tx)}
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
                            className={`status-indicator ${
                              ok
                                ? "status-approved"
                                : isReview
                                ? "status-review"
                                : "status-blocked"
                            }`}
                          >
                            <span className="status-dot" />
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ padding: "13px 18px", textAlign: "right" }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTransaction && onSelectTransaction(tx);
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
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        padding: "48px 18px",
                        textAlign: "center",
                        color: "var(--text-3)",
                      }}
                    >
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
