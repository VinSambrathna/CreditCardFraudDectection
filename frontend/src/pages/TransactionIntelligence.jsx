import React, { useState, useEffect } from "react";
import {
  Layers,
  ArrowRight,
  FileText,
  Cpu,
} from "lucide-react";
import { getTransactions } from "../services/api";

export default function TransactionIntelligence({ selectedTransaction }) {
  const [transactions, setTransactions] = useState([]);
  const [activeTx, setActiveTx] = useState(selectedTransaction);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setActiveTx(selectedTransaction);
  }, [selectedTransaction]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const list = await getTransactions(20);
        setTransactions(list);
        if (!activeTx && list.length > 0) setActiveTx(list[0]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const explanations = activeTx?.explanation || [];
  const probPercent = ((activeTx?.fraud_probability || 0) * 100).toFixed(1);
  const isApproved =
    activeTx?.status === "APPROVED" || activeTx?.status === "VERIFIED";
  const isReview = activeTx?.status === "SOFT_BLOCKED";
  const maxContrib = Math.max(
    ...explanations.map((e) => Math.abs(e.contribution)),
    1.0
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span
            className="status-indicator status-cobalt"
            style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}
          >
            <span className="status-dot" />
            Interpretability Engine
          </span>
          <span style={{ color: "var(--text-4)" }}>·</span>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>
            Exact TreeSHAP Attribution
          </span>
        </div>
        <h1 className="page-title">Transaction Explainability</h1>
        <p className="page-subtitle">
          Exact Shapley values quantifying the marginal change in log-odds produced by each telemetry signal.
        </p>
      </div>

      {/* 2-Column Double-Bezel Layout */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "330px 1fr",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Left Column: Transaction Feed */}
        <div className="bezel-shell">
          <div className="bezel-core" style={{ padding: "18px 20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 12,
                borderBottom: "1px solid var(--shell-bg)",
                marginBottom: 12,
              }}
            >
              <span className="section-label" style={{ fontSize: 10 }}>
                Audit Queue
              </span>
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>
                {transactions.length} records
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 5,
                maxHeight: 620,
                overflowY: "auto",
              }}
            >
              {transactions.map((tx) => {
                const isSelected =
                  (activeTx?.transaction_token || activeTx?.transaction_id) ===
                  (tx.transaction_token || tx.transaction_id);
                const ok =
                  tx.status === "APPROVED" || tx.status === "VERIFIED";
                const isSoft = tx.status === "SOFT_BLOCKED";
                const prob = ((tx.fraud_probability || 0) * 100).toFixed(1);

                return (
                  <div
                    key={tx.id || tx.transaction_token}
                    onClick={() => setActiveTx(tx)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      cursor: "pointer",
                      border: isSelected ? "1px solid var(--cobalt)" : "1px solid transparent",
                      background: isSelected ? "var(--cobalt-light)" : "transparent",
                      transition: "all 140ms var(--ease-spring)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          color: isSelected ? "var(--cobalt)" : "var(--text-1)",
                        }}
                      >
                        {tx.transaction_token}
                      </span>
                      <span
                        className={`status-indicator ${
                          ok ? "status-approved" : isSoft ? "status-review" : "status-blocked"
                        }`}
                        style={{ fontSize: 11 }}
                      >
                        <span className="status-dot" />
                        {tx.status}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 11,
                        color: "var(--text-3)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      <span>${(tx.amount || 0).toFixed(2)}</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: ok
                            ? "var(--emerald)"
                            : isSoft
                            ? "var(--amber)"
                            : "var(--rose)",
                        }}
                      >
                        {prob}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Waterfall and Diagnosis */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {activeTx ? (
            <>
              {/* Snapshot Bar (Double-Bezel) */}
              <div className="bezel-shell">
                <div
                  className="bezel-core"
                  style={{
                    padding: "16px 22px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 16,
                  }}
                >
                  {[
                    {
                      label: "Token",
                      value: activeTx.transaction_token || activeTx.transaction_id,
                      mono: true,
                    },
                    {
                      label: "Amount",
                      value: `$${(activeTx.amount || 0).toFixed(2)} USD`,
                      mono: true,
                    },
                    {
                      label: "Risk Score",
                      value: `${probPercent}%`,
                      mono: true,
                      color: isApproved ? "var(--emerald)" : isReview ? "var(--amber)" : "var(--rose)",
                    },
                    {
                      label: "Decision",
                      value: activeTx.status,
                      badge: true,
                    },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="section-label" style={{ fontSize: 10, marginBottom: 2 }}>
                        {item.label}
                      </div>
                      {item.badge ? (
                        <span
                          className={`status-indicator ${
                            isApproved ? "status-approved" : isReview ? "status-review" : "status-blocked"
                          }`}
                          style={{ fontSize: 13 }}
                        >
                          <span className="status-dot" />
                          {item.value}
                        </span>
                      ) : (
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            fontFamily: item.mono ? "var(--font-mono)" : "inherit",
                            color: item.color || "var(--text-1)",
                          }}
                        >
                          {item.value}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Waterfall Breakdown (Double-Bezel) */}
              <div className="bezel-shell">
                <div className="bezel-core" style={{ padding: "24px 26px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: 14,
                      borderBottom: "1px solid var(--shell-bg)",
                      marginBottom: 20,
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                        Feature Attribution Waterfall
                      </h3>
                      <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                        Relative to base expected value (E[f(x)])
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 14, fontSize: 11, fontFamily: "var(--font-mono)" }}>
                      <span style={{ color: "var(--rose)", fontWeight: 700 }}>Risk +</span>
                      <span style={{ color: "var(--emerald)", fontWeight: 700 }}>Protective -</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {explanations.map((item, i) => {
                      const pos = item.contribution > 0;
                      const pct = Math.min((Math.abs(item.contribution) / maxContrib) * 100, 100);

                      return (
                        <div key={i}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 6,
                              fontSize: 13,
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 700, color: "var(--text-1)" }}>
                                {item.label}
                              </span>
                              <span
                                style={{
                                  marginLeft: 8,
                                  fontSize: 11,
                                  fontFamily: "var(--font-mono)",
                                  color: "var(--text-3)",
                                }}
                              >
                                ({item.value})
                              </span>
                            </div>

                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 12,
                                fontWeight: 700,
                                color: pos ? "var(--rose)" : "var(--emerald)",
                              }}
                            >
                              {pos ? `+${item.contribution.toFixed(4)}` : item.contribution.toFixed(4)}
                            </span>
                          </div>

                          {/* Centered divergent bar track */}
                          <div
                            style={{
                              height: 6,
                              width: "100%",
                              background: "var(--shell-bg)",
                              borderRadius: 99,
                              position: "relative",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                left: "50%",
                                top: 0,
                                bottom: 0,
                                width: 1,
                                background: "var(--text-4)",
                                zIndex: 2,
                              }}
                            />

                            {pos ? (
                              <div
                                style={{
                                  height: "100%",
                                  background: "var(--rose)",
                                  marginLeft: "50%",
                                  width: `${pct / 2}%`,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  height: "100%",
                                  background: "var(--emerald)",
                                  marginLeft: `${50 - pct / 2}%`,
                                  width: `${pct / 2}%`,
                                }}
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Diagnostic Summary Callout */}
                  <div
                    style={{
                      marginTop: 22,
                      padding: "14px 18px",
                      borderRadius: 14,
                      background: "var(--shell-bg)",
                      fontSize: 12,
                      lineHeight: 1.6,
                      color: "var(--text-2)",
                    }}
                  >
                    {activeTx.status === "SOFT_BLOCKED" || activeTx.status === "BLOCKED" ? (
                      <>
                        <strong>Diagnostic Summary:</strong> Primary fraud risk drivers are{" "}
                        <span style={{ color: "var(--rose)", fontWeight: 700 }}>
                          {explanations[0]?.label}
                        </span>{" "}
                        and{" "}
                        <span style={{ color: "var(--rose)", fontWeight: 700 }}>
                          {explanations[1]?.label}
                        </span>
                        . These features exceeded standard cardholder boundaries and triggered protective protocols.
                      </>
                    ) : (
                      <>
                        <strong>Diagnostic Summary:</strong> Established device trust and minimal distance from billing location provided strong protective signals, keeping model output well inside the clearance boundary.
                      </>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bezel-shell">
              <div className="bezel-core" style={{ padding: 48, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>
                Select a transaction from the list on the left to inspect feature attribution.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
