import React, { useState, useEffect } from "react";
import { Cpu } from "lucide-react";
import { getModelInfo } from "../services/api";

export default function ModelIntelligence() {
  const [intel, setIntel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getModelInfo();
        setIntel(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const meta = intel?.model_metadata || {
    name: "SentinelPay XGBoost Classifier",
    version: "1.0.0",
    framework: "XGBoost + Scikit-Learn + SHAP",
    balancing_method: "SMOTE (Train Only)",
    scaler: "RobustScaler",
  };

  const metrics = intel?.performance_metrics || {
    precision: 0.9793,
    recall: 0.9861,
    f1_score: 0.9827,
    roc_auc: 1.0,
    pr_auc: 0.999,
  };

  const globalImp = intel?.global_feature_importance || [];
  const sweep = intel?.threshold_calibration?.threshold_sweep || [];
  const maxImp = Math.max(...globalImp.map((g) => g.importance), 1.0);

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
              className="status-indicator status-cobalt"
              style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}
            >
              <span className="status-dot" />
              Holdout Evaluation N=12,000
            </span>
            <span style={{ color: "var(--text-4)" }}>·</span>
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>
              Train-Only SMOTE Balancing
            </span>
          </div>
          <h1 className="page-title">Model Governance & Decision Cutoffs</h1>
          <p className="page-subtitle">
            Holdout evaluation benchmarks, global TreeSHAP rankings, confusion matrix, and calibrated operating boundaries.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: "var(--radius-pill)",
            background: "#FFFFFF",
            border: "1px solid rgba(15, 23, 42, 0.1)",
            fontSize: 12,
            fontFamily: "var(--font-mono)",
            color: "var(--text-1)",
            fontWeight: 600,
          }}
        >
          <Cpu style={{ width: 14, height: 14, color: "var(--cobalt)" }} />
          <span>{meta.name} (v{meta.version})</span>
        </div>
      </div>

      {/* 4 Double-Bezel Metric Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 14,
          marginBottom: 20,
        }}
      >
        {[
          {
            label: "PR-AUC Score",
            value: metrics.pr_auc?.toFixed(4),
            sub: "Precision-Recall curve area",
            statusClass: "status-cobalt",
            tag: "0.9990",
          },
          {
            label: "Recall Rate",
            value: `${((metrics.recall || 0) * 100).toFixed(2)}%`,
            sub: "142 of 144 true frauds caught",
            statusClass: "status-approved",
            tag: "High sensitivity",
          },
          {
            label: "Precision Rate",
            value: `${((metrics.precision || 0) * 100).toFixed(2)}%`,
            sub: "3 false positives in 12,000",
            statusClass: "status-neutral",
            tag: "Low friction",
          },
          {
            label: "F1-Score",
            value: metrics.f1_score?.toFixed(4),
            sub: "Harmonic balanced mean",
            statusClass: "status-cobalt",
            tag: "Stable",
          },
        ].map((m, i) => (
          <div key={i} className="bezel-shell">
            <div className="bezel-core" style={{ padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span className="section-label" style={{ fontSize: 10 }}>{m.label}</span>
                <span className={`status-indicator ${m.statusClass}`} style={{ fontSize: 11 }}>
                  <span className="status-dot" />
                  {m.tag}
                </span>
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-1)",
                  marginBottom: 4,
                }}
              >
                {m.value}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>{m.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Middle 2-Column Section (Double-Bezel) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* Global Feature Importance */}
        <div className="bezel-shell">
          <div className="bezel-core" style={{ padding: "24px 26px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 12,
                borderBottom: "1px solid var(--shell-bg)",
                marginBottom: 16,
              }}
            >
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                  Global Feature Importance
                </h3>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                  Mean absolute Shapley values across population
                </span>
              </div>
              <span className="status-indicator status-neutral" style={{ fontSize: 11 }}>
                <span className="status-dot" />
                Mean |SHAP|
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {globalImp.map((item, i) => {
                const pct = (item.importance / maxImp) * 100;
                return (
                  <div key={i}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 5,
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: "var(--font-mono)",
                            color: "var(--text-4)",
                            width: 16,
                          }}
                        >
                          #{i + 1}
                        </span>
                        <span style={{ fontWeight: 600, color: "var(--text-1)" }}>
                          {item.label}
                        </span>
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--text-2)",
                        }}
                      >
                        {item.importance.toFixed(4)}
                      </span>
                    </div>

                    <div
                      style={{
                        height: 5,
                        width: "100%",
                        background: "var(--shell-bg)",
                        borderRadius: 99,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: i < 2 ? "var(--cobalt)" : "var(--text-1)",
                          borderRadius: 99,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Confusion Matrix & Specs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Confusion Matrix (N = 12,000) */}
          <div className="bezel-shell">
            <div className="bezel-core" style={{ padding: "24px 26px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: 12,
                  borderBottom: "1px solid var(--shell-bg)",
                  marginBottom: 16,
                }}
              >
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                    Holdout Confusion Matrix
                  </h3>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                    Evaluated on N = 12,000 unseen test records
                  </span>
                </div>
                <span className="status-indicator status-approved" style={{ fontSize: 11 }}>
                  <span className="status-dot" />
                  99.96% Accuracy
                </span>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {[
                  {
                    label: "True Negative (TN)",
                    value: "11,853",
                    sub: "Legit cleared (98.78%)",
                    badge: "eyebrow-emerald",
                  },
                  {
                    label: "False Positive (FP)",
                    value: "3",
                    sub: "False alarms (0.02%)",
                    badge: "eyebrow-amber",
                  },
                  {
                    label: "False Negative (FN)",
                    value: "2",
                    sub: "Missed fraud (0.01%)",
                    badge: "eyebrow-rose",
                  },
                  {
                    label: "True Positive (TP)",
                    value: "142",
                    sub: "Frauds caught (98.61%)",
                    badge: "eyebrow-emerald",
                  },
                ].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "14px 14px",
                      borderRadius: 14,
                      background: "var(--shell-bg)",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginBottom: 2 }}>
                      {c.label}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)" }}>
                      {c.value}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text-3)", marginTop: 2 }}>
                      {c.sub}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pipeline Specifications */}
          <div className="bezel-shell">
            <div className="bezel-core" style={{ padding: "20px 24px" }}>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--text-1)",
                  paddingBottom: 10,
                  borderBottom: "1px solid var(--shell-bg)",
                  marginBottom: 12,
                }}
              >
                Pipeline Architecture
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 0, fontSize: 12 }}>
                {[
                  { label: "Core Model", value: meta.framework },
                  { label: "Class Imbalance", value: "SMOTE (Train split only, no data leakage)" },
                  { label: "Feature Scaler", value: meta.scaler },
                  { label: "Explainer Model", value: "TreeSHAP (Exact tree traversal)" },
                ].map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "9px 0",
                      borderBottom: "1px solid var(--shell-bg)",
                    }}
                  >
                    <span style={{ color: "var(--text-3)" }}>{r.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-1)", fontWeight: 600 }}>
                      {r.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Decision Boundary Sweep Table (Double-Bezel) */}
      <div className="bezel-shell" style={{ overflow: "hidden", marginBottom: 32 }}>
        <div className="bezel-core" style={{ padding: 0, overflow: "hidden" }}>
          <div
            style={{
              padding: "16px 22px",
              borderBottom: "1px solid var(--shell-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                Operational Cutoff Calibration Curve
              </h3>
              <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                Trade-off calibration across decision cutoffs 0.15 to 0.85
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, fontFamily: "var(--font-mono)" }}>
              <span style={{ color: "var(--cobalt)", fontWeight: 700 }}>Clearance: 0.35</span>
              <span style={{ color: "var(--rose)", fontWeight: 700 }}>Denial: 0.70</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table
              className="table-machined"
              style={{
                width: "100%",
                borderCollapse: "collapse",
                textAlign: "left",
                fontSize: 12,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "var(--shell-bg)",
                    borderBottom: "1px solid var(--shell-border)",
                  }}
                >
                  <th style={{ padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
                    Threshold
                  </th>
                  <th style={{ padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
                    Precision
                  </th>
                  <th style={{ padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
                    Recall
                  </th>
                  <th style={{ padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
                    F1-Score
                  </th>
                  <th style={{ padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
                    FPR %
                  </th>
                  <th style={{ padding: "10px 18px", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
                    Policy Tier
                  </th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: "var(--font-mono)" }}>
                {sweep.map((row, i) => {
                  const isClearance = row.threshold === 0.35;
                  const isDenial = row.threshold === 0.7;

                  return (
                    <tr
                      key={i}
                      style={{
                        borderBottom: "1px solid var(--shell-bg)",
                        background: isClearance || isDenial ? "var(--shell-bg)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "10px 18px", fontWeight: 700, color: "var(--text-1)" }}>
                        {row.threshold.toFixed(2)}
                        {isClearance && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: "var(--cobalt)" }}>
                            (Clearance)
                          </span>
                        )}
                        {isDenial && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: "var(--rose)" }}>
                            (Denial)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "10px 18px", color: "var(--text-2)" }}>
                        {((row.precision || 0) * 100).toFixed(2)}%
                      </td>
                      <td style={{ padding: "10px 18px", color: "var(--emerald)", fontWeight: 700 }}>
                        {((row.recall || 0) * 100).toFixed(2)}%
                      </td>
                      <td style={{ padding: "10px 18px", color: "var(--text-1)", fontWeight: 700 }}>
                        {row.f1_score?.toFixed(4)}
                      </td>
                      <td style={{ padding: "10px 18px", color: "var(--text-3)" }}>
                        {row.fpr_pct?.toFixed(2)}%
                      </td>
                      <td style={{ padding: "10px 18px" }}>
                        <span
                          className={`status-indicator ${
                            row.threshold < 0.35
                              ? "status-approved"
                              : row.threshold < 0.7
                              ? "status-review"
                              : "status-blocked"
                          }`}
                        >
                          <span className="status-dot" />
                          {row.tier}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
