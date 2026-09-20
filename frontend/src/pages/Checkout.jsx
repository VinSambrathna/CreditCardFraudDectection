import React, { useState, useMemo } from "react";
import {
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ShieldOff,
  RotateCw,
} from "lucide-react";
import { predictTransaction } from "../services/api";

const PRESETS = [
  {
    id: "legit",
    name: "Domestic Purchase",
    desc: "Supermarket POS, verified primary iPhone, 3.8 km from billing coordinates.",
    outcome: "Auto-approved",
    statusType: "status-approved",
    icon: ShieldCheck,
    data: {
      user_id: 1001,
      amount: 38.5,
      distance: 3.8,
      time_delta: 24.0,
      merchant_risk: 0.08,
      device_trust: 0.98,
      velocity_1h: 1,
      velocity_24h: 2,
      hour_of_day: 14,
      is_weekend: 0,
    },
  },
  {
    id: "suspicious",
    name: "Cross-Border Anomaly",
    desc: "High-value order, 890 km away from home, unrecognized Android browser session.",
    outcome: "3DS2 challenge",
    statusType: "status-review",
    icon: AlertTriangle,
    data: {
      user_id: 1001,
      amount: 1850.0,
      distance: 890.0,
      time_delta: 0.15,
      merchant_risk: 0.88,
      device_trust: 0.12,
      velocity_1h: 4,
      velocity_24h: 7,
      hour_of_day: 3,
      is_weekend: 1,
    },
  },
  {
    id: "fraud",
    name: "Account Takeover",
    desc: "Rapid $2,650 withdrawal, 2,100 km distance, 4% device trust, velocity burst.",
    outcome: "Hard block",
    statusType: "status-blocked",
    icon: ShieldOff,
    data: {
      user_id: 1002,
      amount: 2650.0,
      distance: 2100.0,
      time_delta: 0.05,
      merchant_risk: 0.95,
      device_trust: 0.04,
      velocity_1h: 6,
      velocity_24h: 12,
      hour_of_day: 4,
      is_weekend: 1,
    },
  },
];

export default function Checkout({ onTransactionComplete }) {
  const [formData, setFormData] = useState(PRESETS[0].data);
  const [selectedPreset, setSelectedPreset] = useState("legit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handlePresetSelect = (p) => {
    setSelectedPreset(p.id);
    setFormData({ ...p.data });
    setError(null);
  };

  const handleChange = (field, value) => {
    setSelectedPreset("custom");
    setFormData((prev) => ({ ...prev, [field]: parseFloat(value) || 0 }));
  };

  const estimatedRisk = useMemo(() => {
    let s = 0.03;
    if (formData.amount > 500) s += 0.18;
    if (formData.amount > 1500) s += 0.18;
    if (formData.distance > 200) s += 0.20;
    if (formData.distance > 800) s += 0.20;
    if (formData.device_trust < 0.4) s += 0.22;
    if (formData.device_trust < 0.15) s += 0.15;
    if (formData.merchant_risk > 0.6) s += 0.16;
    if (formData.velocity_1h > 3) s += 0.15;
    if (formData.time_delta < 0.5) s += 0.10;
    return Math.min(Math.max(s, 0.015), 0.985);
  }, [formData]);

  const riskPct = (estimatedRisk * 100).toFixed(1);
  const isClear = estimatedRisk < 0.35;
  const isReview = estimatedRisk >= 0.35 && estimatedRisk < 0.7;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await predictTransaction(formData);
      onTransactionComplete(result, formData);
    } catch (err) {
      setError(err.message || "Evaluation failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header (Clean, Zero AI-slop sticker pills) */}
      <div style={{ marginBottom: 26 }}>
        <div className="section-kicker" style={{ marginBottom: 4 }}>
          Simulator &bull; Real-time Inference
        </div>
        <h1 className="page-title">Transaction Simulator</h1>
        <p className="page-subtitle">
          Configure telemetry inputs or select behavioral benchmark scenarios to observe model inference.
        </p>
      </div>

      {/* 3 Double-Bezel Scenario Presets */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {PRESETS.map((p) => {
          const isSelected = selectedPreset === p.id;
          const Icon = p.icon;

          return (
            <div
              key={p.id}
              onClick={() => handlePresetSelect(p)}
              className="bezel-shell"
              style={{
                cursor: "pointer",
                background: isSelected ? "#DFE6F0" : "var(--shell-bg)",
                borderColor: isSelected ? "var(--cobalt)" : "var(--shell-border)",
              }}
            >
              <div className="bezel-core">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: "var(--shell-bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--text-1)",
                      }}
                    >
                      <Icon style={{ width: 16, height: 16 }} strokeWidth={2.2} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                      {p.name}
                    </span>
                  </div>

                  {/* Clean Stripe-style Status Dot Indicator */}
                  <span className={`status-indicator ${p.statusType}`}>
                    <span className="status-dot" />
                    {p.outcome}
                  </span>
                </div>

                <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.55, marginBottom: 14 }}>
                  {p.desc}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-3)",
                    paddingTop: 10,
                    borderTop: "1px solid var(--shell-bg)",
                  }}
                >
                  <span>${p.data.amount.toFixed(2)} USD</span>
                  <span>{p.data.distance} km</span>
                  <span>Trust: {(p.data.device_trust * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulator Workspace Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Form Container */}
        <div className="bezel-shell">
          <div className="bezel-core" style={{ padding: "26px 28px" }}>
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
                <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
                  Telemetry Parameters
                </h2>
                <span style={{ fontSize: 12, color: "var(--text-3)" }}>
                  Tune model feature inputs
                </span>
              </div>
              {selectedPreset === "custom" && (
                <span className="status-indicator status-cobalt" style={{ fontSize: 11 }}>
                  <span className="status-dot" />
                  Custom parameters
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Row 1: Profile & Amount */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>
                    Cardholder Profile
                  </label>
                  <select
                    value={formData.user_id}
                    onChange={(e) => handleChange("user_id", e.target.value)}
                    className="input-machined"
                    style={{ cursor: "pointer" }}
                  >
                    <option value={1001}>Alex Morgan (#1001)</option>
                    <option value={1002}>Jonathan Vance (#1002)</option>
                  </select>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
                      Amount (USD)
                    </label>
                    <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-1)" }}>
                      ${formData.amount.toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="10000"
                    value={formData.amount}
                    onChange={(e) => handleChange("amount", e.target.value)}
                    className="input-machined"
                  />
                </div>
              </div>

              {/* Slider 1: Distance */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
                    Distance from Home Address
                  </label>
                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--cobalt)" }}>
                    {formData.distance.toFixed(1)} km
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="3000"
                  step="5"
                  value={formData.distance}
                  onChange={(e) => handleChange("distance", e.target.value)}
                />
              </div>

              {/* Slider 2: Device Trust */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
                    Device Trust Score
                  </label>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color: formData.device_trust > 0.5 ? "var(--emerald)" : "var(--rose)",
                    }}
                  >
                    {(formData.device_trust * 100).toFixed(0)}% ({formData.device_trust.toFixed(2)})
                  </span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="1.0"
                  step="0.02"
                  value={formData.device_trust}
                  onChange={(e) => handleChange("device_trust", e.target.value)}
                />
              </div>

              {/* Slider 3: Merchant Risk */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
                    Merchant Risk Rating
                  </label>
                  <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-1)" }}>
                    {(formData.merchant_risk * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="1.0"
                  step="0.02"
                  value={formData.merchant_risk}
                  onChange={(e) => handleChange("merchant_risk", e.target.value)}
                />
              </div>

              {/* Row: Velocity & Time Delta */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>
                    Velocity (1h attempts)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.velocity_1h}
                    onChange={(e) => handleChange("velocity_1h", e.target.value)}
                    className="input-machined"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>
                    Hours Since Previous Tx
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    max="72"
                    step="0.5"
                    value={formData.time_delta}
                    onChange={(e) => handleChange("time_delta", e.target.value)}
                    className="input-machined"
                  />
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    background: "var(--rose-light)",
                    border: "1px solid var(--rose-border)",
                    color: "var(--rose)",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {error}
                </div>
              )}

              {/* Button-in-Button Trailing Icon CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-island"
                style={{ width: "100%", marginTop: 8 }}
              >
                <span>
                  {isSubmitting ? "Running XGBoost Inference..." : "Authorize Simulation"}
                </span>
                <div className="icon-nest">
                  {isSubmitting ? (
                    <RotateCw style={{ width: 14, height: 14, animation: "spin 1s linear infinite" }} />
                  ) : (
                    <ArrowRight style={{ width: 14, height: 14 }} strokeWidth={2.5} />
                  )}
                </div>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Telemetry Assessment Card */}
        <div className="bezel-shell">
          <div className="bezel-core">
            <div
              style={{
                paddingBottom: 12,
                borderBottom: "1px solid var(--shell-bg)",
                marginBottom: 16,
              }}
            >
              <span className="section-kicker">Live Heuristic Evaluation</span>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginTop: 2 }}>
                Risk Envelope
              </h3>
            </div>

            {/* Score Display with Stripe Status Dot */}
            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-1)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {riskPct}%
              </div>
              <div style={{ marginTop: 8 }}>
                <span
                  className={`status-indicator ${
                    isClear
                      ? "status-approved"
                      : isReview
                      ? "status-review"
                      : "status-blocked"
                  }`}
                  style={{ fontSize: 13, fontWeight: 700 }}
                >
                  <span className="status-dot" />
                  {isClear
                    ? "Safe clearance envelope"
                    : isReview
                    ? "3DS2 challenge required"
                    : "Refusal limit exceeded"}
                </span>
              </div>
            </div>

            {/* Progress Track */}
            <div
              style={{
                width: "100%",
                height: 6,
                borderRadius: 99,
                background: "var(--shell-bg)",
                overflow: "hidden",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: `${riskPct}%`,
                  height: "100%",
                  background: isClear
                    ? "var(--emerald)"
                    : isReview
                    ? "var(--amber)"
                    : "var(--rose)",
                  transition: "width 220ms var(--ease-spring)",
                }}
              />
            </div>

            {/* Signal Observations */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
                Diagnostic Signals
              </span>

              {[
                {
                  label: "Distance from Home",
                  val: `${formData.distance.toFixed(1)} km`,
                  flag: formData.distance > 500,
                },
                {
                  label: "Device Confidence",
                  val: `${(formData.device_trust * 100).toFixed(0)}%`,
                  flag: formData.device_trust < 0.3,
                },
                {
                  label: "Merchant Risk",
                  val: `${(formData.merchant_risk * 100).toFixed(0)}%`,
                  flag: formData.merchant_risk > 0.6,
                },
                {
                  label: "Velocity (1h)",
                  val: `${formData.velocity_1h} attempts`,
                  flag: formData.velocity_1h > 3,
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "7px 0",
                    borderBottom: "1px solid var(--shell-bg)",
                  }}
                >
                  <span style={{ color: "var(--text-3)" }}>{s.label}</span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color: s.flag ? "var(--rose)" : "var(--text-1)",
                    }}
                  >
                    {s.val}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: 20,
                padding: "12px 14px",
                borderRadius: 12,
                background: "var(--shell-bg)",
                fontSize: 11,
                color: "var(--text-3)",
                lineHeight: 1.5,
              }}
            >
              Calculated using exact tree splitting rules. Transactions with probability &ge; 0.35 require step-up challenge before settlement.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
