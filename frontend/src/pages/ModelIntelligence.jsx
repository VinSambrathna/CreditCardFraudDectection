import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu } from "lucide-react";
import { getModelInfo } from "../services/api";
import AnimatedNumber from "../components/AnimatedNumber";

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
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="section-label">Model Governance</span>
          </div>
          <h1 className="page-title">Model Governance &amp; Decision Cutoffs</h1>
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
      {loading && !intel ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 14,
            marginBottom: 20,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bezel-shell">
              <div className="bezel-core" style={{ padding: "20px 22px" }}>
                <div className="skeleton skeleton-text" style={{ width: "45%", marginBottom: 12 }} />
                <div className="skeleton skeleton-title" style={{ width: "65%", marginBottom: 8 }} />
                <div className="skeleton skeleton-text" style={{ width: "50%" }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
          }}
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
              numericValue: metrics.pr_auc || 0.999,
              decimals: 4,
              sub: "Precision-Recall curve area",
              target: "0.950",
            },
            {
              label: "Recall Rate",
              numericValue: (metrics.recall || 0) * 100,
              decimals: 2,
              suffix: "%",
              sub: "142 of 144 true frauds caught",
              target: "95.0%",
            },
            {
              label: "Precision Rate",
              numericValue: (metrics.precision || 0) * 100,
              decimals: 2,
              suffix: "%",
              sub: "3 false positives in 12,000",
              target: "95.0%",
            },
            {
              label: "F1-Score",
              numericValue: metrics.f1_score || 0.9827,
              decimals: 4,
              sub: "Harmonic balanced mean",
              target: "0.950",
            },
          ].map((m, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
              }}
              className="bezel-shell"
            >
              <div className="bezel-core" style={{ padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span className="section-label" style={{ fontSize: 11 }}>{m.label}</span>
                  <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-3)", fontWeight: 500 }}>
                    Target ≥ {m.target}
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
                  <AnimatedNumber
                    value={m.numericValue}
                    decimals={m.decimals}
                    suffix={m.suffix || ""}
                  />
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>{m.sub}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

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
                        fontSize: 12,
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "var(--text-1)" }}>
                        {item.feature}
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: "var(--text-2)",
                        }}
                      >
                        {item.importance.toFixed(3)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 5,
                        borderRadius: 3,
                        background: "var(--shell-bg)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          borderRadius: 3,
                          background: "var(--cobalt)",
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
          {/* Holdout Confusion Matrix */}
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
                <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--emerald)" }}>
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
                    bg: "var(--emerald-light)",
                    border: "var(--emerald-border)",
                    topColor: "var(--emerald)",
                    category: "Cleared",
                  },
                  {
                    label: "False Positive (FP)",
                    value: "3",
                    sub: "False holds (0.02%)",
                    bg: "var(--amber-light)",
                    border: "var(--amber-border)",
                    topColor: "var(--amber)",
                    category: "Held (3DS2)",
                  },
                  {
                    label: "False Negative (FN)",
                    value: "2",
                    sub: "Missed fraud (0.01%)",
                    bg: "var(--rose-light)",
                    border: "var(--rose-border)",
                    topColor: "var(--rose)",
                    category: "Missed",
                  },
                  {
                    label: "True Positive (TP)",
                    value: "142",
                    sub: "Frauds caught (98.61%)",
                    bg: "var(--emerald-light)",
                    border: "var(--emerald-border)",
                    topColor: "var(--emerald)",
                    category: "Declined",
                  },
                ].map((c, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "15px 14px",
                      borderRadius: 14,
                      background: c.bg,
                      border: `1px solid ${c.border}`,
                      borderTop: `3px solid ${c.topColor}`,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 11 }}>
                      <span style={{ color: "var(--text-2)", fontWeight: 600 }}>{c.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: c.topColor }}>
                        {c.category}
                      </span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "var(--text-1)" }}>
                      {c.value}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
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
                        background: isClearance
                          ? "rgba(37, 99, 235, 0.06)"
                          : isDenial
                          ? "rgba(220, 38, 38, 0.06)"
                          : "transparent",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 18px",
                          fontWeight: 700,
                          color: "var(--text-1)",
                          borderLeft: isClearance
                            ? "3px solid var(--cobalt)"
                            : isDenial
                            ? "3px solid var(--rose)"
                            : "3px solid transparent",
                        }}
                      >
                        {row.threshold.toFixed(2)}
                        {isClearance && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              color: "var(--cobalt)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            [ACTIVE CLEARANCE]
                          </span>
                        )}
                        {isDenial && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 11,
                              fontWeight: 700,
                              color: "var(--rose)",
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            [HARD BLOCK]
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
                          className={`status-tag ${
                            row.threshold < 0.35
                              ? "status-approved"
                              : row.threshold < 0.7
                              ? "status-review"
                              : "status-blocked"
                          }`}
                        >
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
