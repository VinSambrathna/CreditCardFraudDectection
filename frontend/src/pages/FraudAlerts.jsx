import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ExternalLink,
  Wifi,
  WifiOff,
  Filter,
  Search,
  Building2
} from "lucide-react";
import {
  connectAlertWebSocket,
  getTransactions
} from "../services/api";

export default function FraudAlerts({ onSelectTransaction }) {
  const [alerts, setAlerts] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [filterInst, setFilterInst] = useState("ALL");
  const [filterRisk, setFilterRisk] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Load initial baseline alerts from transactions
  useEffect(() => {
    async function loadRecent() {
      try {
        const txs = await getTransactions(30);
        const baselineAlerts = txs.map((tx) => ({
          transaction_token: tx.transaction_token,
          institution_code: tx.institution_id === 2 ? "ACLEDA" : tx.institution_id === 3 ? "WING" : "ABA",
          amount: tx.amount,
          currency: tx.currency || "USD",
          payment_method: tx.payment_method || "KHQR",
          fraud_probability: tx.fraud_probability,
          risk_level: tx.risk_level,
          status: tx.status,
          explanation: tx.explanation ? tx.explanation.slice(0, 2) : [],
          timestamp: tx.created_at || new Date().toISOString()
        }));
        setAlerts(baselineAlerts);
      } catch (err) {
        console.error("Failed to load initial alerts", err);
      }
    }
    loadRecent();
  }, []);

  // Connect to live WebSocket Alert Hub
  useEffect(() => {
    const ws = connectAlertWebSocket({
      onOpen: () => setWsConnected(true),
      onClose: () => setWsConnected(false),
      onError: (e) => setWsConnected(false),
      onMessage: (msg) => {
        if (msg.event === "FRAUD_ALERT" || msg.event === "TRANSACTION_CLEARED") {
          const newAlert = msg.data;
          setAlerts((prev) => [newAlert, ...prev.slice(0, 49)]);
        } else if (msg.event === "TRANSACTION_STATUS_MUTATED") {
          // Update status in place if transaction already listed
          const update = msg.data;
          setAlerts((prev) =>
            prev.map((a) =>
              a.transaction_token === update.transaction_token
                ? { ...a, status: update.new_status }
                : a
            )
          );
        }
      }
    });

    return () => {
      if (ws) ws.close();
    };
  }, []);

  const filteredAlerts = alerts.filter((a) => {
    const matchInst = filterInst === "ALL" || a.institution_code === filterInst;
    const matchRisk = filterRisk === "ALL" || a.risk_level === filterRisk;
    const matchSearch =
      !searchTerm ||
      a.transaction_token.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.institution_code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchInst && matchRisk && matchSearch;
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="section-label">Real-Time Event Stream</span>
            <span style={{ fontSize: 11, background: "rgba(239, 68, 68, 0.08)", color: "var(--rose)", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
              LIVE PUSH HUB
            </span>
          </div>
          <h1 className="page-title">Live Fraud Alerts &amp; Interceptions</h1>
          <p className="page-subtitle">
            Sub-second real-time alert feed pushed via FastAPI WebSockets directly from the SentinelPay inference gateway.
          </p>
        </div>

        {/* WebSocket Live Status Badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#FFFFFF", padding: "8px 14px", borderRadius: 12, border: "1px solid var(--shell-border)", boxShadow: "var(--shadow-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: wsConnected ? "var(--emerald)" : "var(--rose)" }}>
            {wsConnected ? <Wifi style={{ width: 15, height: 15 }} /> : <WifiOff style={{ width: 15, height: 15 }} />}
            <span>{wsConnected ? "WebSocket Stream: Active" : "Connecting to Hub..."}</span>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
            ws://localhost:8000/ws/alerts
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 20, background: "var(--shell-bg)", padding: "10px 14px", borderRadius: 12, border: "1px solid var(--shell-border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Institution Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <Building2 style={{ width: 14, height: 14, color: "var(--text-3)" }} />
            <select
              value={filterInst}
              onChange={(e) => setFilterInst(e.target.value)}
              className="input-machined"
              style={{ padding: "4px 8px", fontSize: 12, width: "auto" }}
            >
              <option value="ALL">All Institutions</option>
              <option value="ABA">ABA Bank</option>
              <option value="ACLEDA">ACLEDA Bank</option>
              <option value="WING">Wing Bank</option>
              <option value="CANADIA">Canadia Bank</option>
            </select>
          </div>

          {/* Risk Tier Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <Filter style={{ width: 14, height: 14, color: "var(--text-3)" }} />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="input-machined"
              style={{ padding: "4px 8px", fontSize: 12, width: "auto" }}
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="HIGH">High Risk (&ge;70%)</option>
              <option value="REVIEW">Review / Step-Up (35-70%)</option>
              <option value="LOW">Low Risk (&lt;35%)</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", minWidth: 220 }}>
          <input
            type="text"
            placeholder="Search token..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-machined"
            style={{ padding: "5px 10px 5px 28px", fontSize: 12 }}
          />
          <Search style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "var(--text-4)" }} />
        </div>
      </div>

      {/* Real-Time Alerts Feed Table */}
      <div className="surface-card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
            <thead>
              <tr style={{ background: "var(--shell-bg)", borderBottom: "1px solid var(--shell-border)", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
                <th style={{ padding: "12px 16px" }}>Institution</th>
                <th style={{ padding: "12px 14px" }}>Transaction Token</th>
                <th style={{ padding: "12px 14px" }}>Amount &amp; Rail</th>
                <th style={{ padding: "12px 14px" }}>Risk Probability</th>
                <th style={{ padding: "12px 14px" }}>Policy Status</th>
                <th style={{ padding: "12px 14px" }}>Key AI Indicators</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Forensics</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "36px", textAlign: "center", color: "var(--text-3)" }}>
                    No alerts matching current filters. Run a test in the Bank Simulator to push live events.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert, idx) => {
                  const isHigh = alert.risk_level === "HIGH";
                  const isReview = alert.risk_level === "REVIEW";
                  const isReleased = alert.status === "RELEASED" || alert.status === "VERIFIED" || alert.status === "APPROVED";
                  const isBlocked = alert.status === "BLOCKED";

                  return (
                    <motion.tr
                      key={alert.transaction_token || idx}
                      initial={{ opacity: 0, backgroundColor: "rgba(37, 99, 235, 0.08)" }}
                      animate={{ opacity: 1, backgroundColor: "transparent" }}
                      transition={{ duration: 0.4 }}
                      style={{ borderBottom: "1px solid var(--shell-bg)" }}
                    >
                      {/* Institution Badge */}
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, background: "rgba(15, 23, 42, 0.06)", color: "var(--text-1)", padding: "2px 8px", borderRadius: 4 }}>
                          {alert.institution_code || "ABA"}
                        </span>
                      </td>

                      {/* Token */}
                      <td style={{ padding: "12px 14px" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-1)" }}>
                          {alert.transaction_token}
                        </span>
                      </td>

                      {/* Amount & Method */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ fontWeight: 700, color: "var(--text-1)", fontFamily: "var(--font-mono)" }}>
                          {alert.currency || "USD"} {parseFloat(alert.amount || 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: 10.5, color: "var(--text-3)" }}>
                          via {alert.payment_method || "KHQR"}
                        </div>
                      </td>

                      {/* Probability */}
                      <td style={{ padding: "12px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            fontFamily: "var(--font-mono)",
                            fontWeight: 800,
                            color: isHigh ? "var(--rose)" : isReview ? "var(--amber)" : "var(--emerald)"
                          }}>
                            {((alert.fraud_probability || 0.05) * 100).toFixed(1)}%
                          </span>
                          <span className={`status-tag ${isHigh ? "status-blocked" : isReview ? "status-review" : "status-approved"}`} style={{ fontSize: 10 }}>
                            {alert.risk_level}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: "12px 14px" }}>
                        <span className={`status-tag ${isReleased ? "status-approved" : isBlocked ? "status-blocked" : "status-review"}`}>
                          {alert.status || "PENDING"}
                        </span>
                      </td>

                      {/* AI Indicators */}
                      <td style={{ padding: "12px 14px", fontSize: 11, color: "var(--text-2)" }}>
                        {alert.explanation && alert.explanation.length > 0 ? (
                          <span>{alert.explanation[0].label} ({alert.explanation[0].contribution > 0 ? "+" : ""}{alert.explanation[0].contribution})</span>
                        ) : (
                          <span style={{ color: "var(--text-4)" }}>Standard Profile</span>
                        )}
                      </td>

                      {/* Forensics Action */}
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => onSelectTransaction && onSelectTransaction(alert)}
                          className="btn-island-secondary"
                          style={{ fontSize: 11, padding: "4px 8px", gap: 4 }}
                        >
                          <span>SHAP Waterfall</span>
                          <ExternalLink style={{ width: 11, height: 11 }} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
