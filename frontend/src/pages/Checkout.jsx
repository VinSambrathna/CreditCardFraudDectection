import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ShieldOff,
  RotateCw,
  CreditCard,
  Lock,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  MapPin,
  Smartphone,
  Store,
} from "lucide-react";
import { predictTransaction } from "../services/api";
import AnimatedNumber from "../components/AnimatedNumber";
import VirtualCreditCard from "../components/VirtualCreditCard";

const PRESETS = [
  {
    id: "legit",
    name: "Domestic Grocery",
    merchant: "Whole Foods Market",
    category: "Supermarket & Groceries",
    itemDesc: "Weekly organic produce & pantry essentials",
    cardholder: "ALEX MORGAN",
    cardNumber: "4532 •••• •••• 8821",
    cardType: "VISA",
    desc: "Routine POS card swipe on primary registered iPhone, 3.8 km from residential billing address.",
    outcome: "Approved",
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
    name: "Overseas Booking",
    merchant: "Emirates Airlines",
    category: "Airlines & Overseas Hospitality",
    itemDesc: "Business class roundtrip & hotel accommodation",
    cardholder: "ALEX MORGAN",
    cardNumber: "4532 •••• •••• 8821",
    cardType: "VISA",
    desc: "High-value travel reservation from unrecognized mobile device, 890 km away from home.",
    outcome: "3DS Challenge",
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
    merchant: "Apex Crypto Exchange",
    category: "Crypto Liquidity & Wire Transfer",
    itemDesc: "Instant unhosted crypto wallet liquidation",
    cardholder: "JONATHAN VANCE",
    cardNumber: "5425 •••• •••• 1002",
    cardType: "MASTERCARD",
    desc: "Rapid $2,650 cashout via foreign proxy, 4% device trust, severe velocity burst anomaly.",
    outcome: "Blocked",
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
  const [showTelemetryDrawer, setShowTelemetryDrawer] = useState(false);

  // Active preset metadata
  const activePreset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[0];
  const cardholderName = formData.user_id === 1002 ? "JONATHAN VANCE" : "ALEX MORGAN";
  const cardNumberDisplay = formData.user_id === 1002 ? "5425 •••• •••• 1002" : "4532 •••• •••• 8821";
  const cardTypeDisplay = formData.user_id === 1002 ? "MASTERCARD" : "VISA";

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
  const isAmountInvalid = !formData.amount || formData.amount < 1 || formData.amount > 10000;

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
      {/* Clean Header: De-duplicated Title & Eyebrow */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span className="section-label">Payment Terminal</span>
        </div>
        <h1 className="page-title">Point-of-Sale Checkout</h1>
        <p className="page-subtitle">
          Interactive consumer checkout terminal. Select a calibrated risk scenario to evaluate real-time model inference and 3DS2 verification loops.
        </p>
      </div>

      {/* Sleek Horizontal Scenario Switcher (Replaces massive vertical cards) */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span className="section-label">Evaluation Scenarios</span>
          <span style={{ fontSize: 11, color: "var(--text-3)", fontStyle: "italic" }}>
            Click to pre-load scenario telemetry
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 10,
            background: "var(--shell-bg)",
            padding: 4,
            borderRadius: 14,
            border: "1px solid var(--shell-border)",
          }}
        >
          {PRESETS.map((p) => {
            const isSelected = selectedPreset === p.id;
            const Icon = p.icon;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetSelect(p)}
                aria-pressed={isSelected}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: isSelected ? "1px solid rgba(37, 99, 235, 0.2)" : "1px solid transparent",
                  background: isSelected ? "#FFFFFF" : "transparent",
                  boxShadow: isSelected ? "0 2px 8px rgba(15, 23, 42, 0.06)" : "none",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 140ms ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: isSelected ? "var(--cobalt-light)" : "rgba(15, 23, 42, 0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isSelected ? "var(--cobalt)" : "var(--text-2)",
                      flexShrink: 0,
                    }}
                  >
                    <Icon style={{ width: 14, height: 14 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: isSelected ? 700 : 600, color: "var(--text-1)", lineHeight: 1.2 }}>
                      {p.name}
                    </div>
                    <div className="tabular-nums" style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--text-3)", marginTop: 2 }}>
                      ${p.data.amount.toFixed(2)} &bull; {p.data.distance} km away
                    </div>
                  </div>
                </div>

                <span className={`status-tag ${p.statusType}`} style={{ fontSize: 11 }}>
                  {p.outcome}
                </span>
              </button>
            );
          })}
        </div>

        {/* Narrative Context Strip for Selected Scenario */}
        <div
          style={{
            marginTop: 8,
            padding: "8px 14px",
            borderRadius: 8,
            background: "rgba(37, 99, 235, 0.04)",
            border: "1px solid rgba(37, 99, 235, 0.1)",
            fontSize: 11.5,
            color: "var(--text-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span>
            <strong style={{ color: "var(--text-1)" }}>Scenario Context:</strong> {activePreset.desc}
          </span>
          <span style={{ fontSize: 11, color: "var(--cobalt)", fontWeight: 600, flexShrink: 0 }}>
            Merchant: {activePreset.merchant}
          </span>
        </div>
      </div>

      {/* Main Payment & Screening Workspace Grid */}
      <div className="checkout-grid">
        {/* Left Column: Realistic Credit Card & Payment Terminal */}
        <div className="bezel-shell">
          <div className="bezel-core" style={{ padding: "26px 28px" }}>
            {/* Merchant Context Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: 16,
                borderBottom: "1px solid var(--shell-bg)",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                  }}
                >
                  <Store style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)" }}>
                    {activePreset.merchant}
                  </h2>
                  <span style={{ fontSize: 11.5, color: "var(--text-3)" }}>
                    {activePreset.category} &bull; Order #SP-{formData.user_id === 1002 ? "9421" : "8824"}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: "right" }}>
                <span className="section-label" style={{ fontSize: 11 }}>Total Charge</span>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--text-1)" }}>
                  ${formData.amount.toFixed(2)}
                </div>
              </div>
            </div>

            {/* Visual Credit Card Preview */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 24,
              }}
            >
              <VirtualCreditCard
                cardholder={cardholderName}
                cardNumber={cardNumberDisplay}
                expiry="09/28"
                cardType={cardTypeDisplay}
                status={isClear ? "ACTIVE" : isReview ? "REVIEW" : "BLOCKED"}
              />
            </div>

            {/* Standard Credit Card Payment Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Cardholder & Amount */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 14 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label htmlFor="cardholder-name" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
                      Name on Card
                    </label>
                    <span id="cardholder-name-hint" style={{ fontSize: 11, color: "var(--text-3)", fontStyle: "italic" }}>
                      Demo autofill
                    </span>
                  </div>
                  <input
                    id="cardholder-name"
                    type="text"
                    value={cardholderName}
                    readOnly
                    aria-describedby="cardholder-name-hint"
                    className="input-machined"
                    style={{ background: "#F8FAFC", color: "var(--text-1)", fontWeight: 600 }}
                  />
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label htmlFor="payment-amount" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
                      Payment Amount (USD)
                    </label>
                    {isAmountInvalid && (
                      <span id="amount-validation-error" role="alert" style={{ fontSize: 11, color: "var(--rose)", fontWeight: 600 }}>
                        $1 - $10,000 max
                      </span>
                    )}
                  </div>
                  <input
                    id="payment-amount"
                    type="number"
                    step="0.5"
                    min="1"
                    max="10000"
                    value={formData.amount}
                    onChange={(e) => handleChange("amount", e.target.value)}
                    aria-invalid={isAmountInvalid}
                    aria-describedby={isAmountInvalid ? "amount-validation-error" : undefined}
                    className="input-machined"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      borderColor: isAmountInvalid ? "var(--rose)" : undefined,
                    }}
                  />
                </div>
              </div>

              {/* Card Number & Expiry & CVV */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label htmlFor="card-number" style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
                      Card Number
                    </label>
                    <span id="card-number-hint" style={{ fontSize: 11, color: "var(--text-3)", fontStyle: "italic" }}>
                      Demo autofill
                    </span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      id="card-number"
                      type="text"
                      value={cardNumberDisplay}
                      readOnly
                      aria-describedby="card-number-hint"
                      className="input-machined"
                      style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
                    />
                    <CreditCard
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: 15,
                        height: 15,
                        color: "var(--text-4)",
                      }}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="card-expiry" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>
                    Expiry
                  </label>
                  <input
                    id="card-expiry"
                    type="text"
                    value="09 / 28"
                    readOnly
                    className="input-machined"
                    style={{ fontFamily: "var(--font-mono)", textAlign: "center", fontSize: 12 }}
                  />
                </div>

                <div>
                  <label htmlFor="card-cvv" style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>
                    Security CVV
                  </label>
                  <input
                    id="card-cvv"
                    type="password"
                    value="•••"
                    readOnly
                    className="input-machined"
                    style={{ fontFamily: "var(--font-mono)", textAlign: "center", fontSize: 12 }}
                  />
                </div>
              </div>

              {/* Collapsible Section: Inspect & Fine-Tune AI Telemetry */}
              <div
                style={{
                  marginTop: 4,
                  borderRadius: 14,
                  border: "1px solid var(--shell-border)",
                  background: "var(--shell-bg)",
                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowTelemetryDrawer((prev) => !prev)}
                  style={{
                    width: "100%",
                    padding: "11px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-2)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <SlidersHorizontal style={{ width: 14, height: 14, color: "var(--cobalt)" }} />
                    <span>Under the Hood: Inspect AI Telemetry & ML Signals</span>
                  </div>
                  {showTelemetryDrawer ? (
                    <ChevronUp style={{ width: 15, height: 15 }} />
                  ) : (
                    <ChevronDown style={{ width: 15, height: 15 }} />
                  )}
                </button>

                <AnimatePresence>
                  {showTelemetryDrawer && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden", padding: "0 16px 16px" }}
                    >
                      <div style={{ paddingTop: 10, borderTop: "1px solid rgba(15, 23, 42, 0.08)", display: "flex", flexDirection: "column", gap: 14 }}>
                        {/* Distance Slider */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-1)" }}>
                              Distance from Billing Home Coordinates
                            </span>
                            <span style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--cobalt)" }}>
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

                        {/* Device Trust Slider */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-1)" }}>
                              Device Trust Confidence
                            </span>
                            <span
                              style={{
                                fontSize: 11.5,
                                fontFamily: "var(--font-mono)",
                                fontWeight: 700,
                                color: formData.device_trust > 0.5 ? "var(--emerald)" : "var(--rose)",
                              }}
                            >
                              {(formData.device_trust * 100).toFixed(0)}%
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

                        {/* Merchant Risk Slider */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-1)" }}>
                              Merchant Risk Index
                            </span>
                            <span style={{ fontSize: 11.5, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-1)" }}>
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

                        {/* Velocity & Hours */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                          <div>
                            <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
                              Velocity (1h attempts)
                            </span>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={formData.velocity_1h}
                              onChange={(e) => handleChange("velocity_1h", e.target.value)}
                              className="input-machined"
                              style={{ padding: "6px 10px", fontSize: 12 }}
                            />
                          </div>
                          <div>
                            <span style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
                              Hours Since Prior Tx
                            </span>
                            <input
                              type="number"
                              min="0.01"
                              max="72"
                              step="0.5"
                              value={formData.time_delta}
                              onChange={(e) => handleChange("time_delta", e.target.value)}
                              className="input-machined"
                              style={{ padding: "6px 10px", fontSize: 12 }}
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {error && (
                <div
                  role="alert"
                  className="error-message-enter"
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

              {/* Authorize Payment Action */}
              <button
                type="submit"
                disabled={isSubmitting || isAmountInvalid}
                aria-busy={isSubmitting}
                className="btn-island"
                style={{
                  width: "100%",
                  marginTop: 4,
                  opacity: isAmountInvalid ? 0.6 : undefined,
                  cursor: isAmountInvalid ? "not-allowed" : undefined,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Lock style={{ width: 14, height: 14 }} />
                  <span>
                    {isSubmitting
                      ? "Evaluating Payment with AI..."
                      : isAmountInvalid
                      ? "Enter Valid Amount ($1 - $10,000)"
                      : `Authorize & Pay $${formData.amount.toFixed(2)} USD`}
                  </span>
                </div>
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

        {/* Right Column: AI Risk Screening Radar (Clean surface-card) */}
        <div className="surface-card">
          <div>
            <div
              style={{
                paddingBottom: 12,
                borderBottom: "1px solid var(--shell-bg)",
                marginBottom: 16,
              }}
            >
              <span className="section-kicker">SentinelPay AI Shield</span>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginTop: 2 }}>
                Pre-Settlement Risk Envelope
              </h3>
            </div>

            {/* Score Display */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-1)",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                <AnimatedNumber value={parseFloat(riskPct)} decimals={1} suffix="%" />
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  marginTop: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  color: isClear
                    ? "var(--emerald)"
                    : isReview
                    ? "var(--amber)"
                    : "var(--rose)",
                }}
              >
                {isClear ? (
                  <CheckCircle2 style={{ width: 15, height: 15, flexShrink: 0 }} />
                ) : isReview ? (
                  <AlertTriangle style={{ width: 15, height: 15, flexShrink: 0 }} />
                ) : (
                  <ShieldOff style={{ width: 15, height: 15, flexShrink: 0 }} />
                )}
                <span>
                  {isClear
                    ? "Safe clearance envelope"
                    : isReview
                    ? "3DS2 challenge required"
                    : "Refusal limit exceeded"}
                </span>
              </div>
            </div>

            {/* Calibrated Risk Gauge Track with Threshold Markers */}
            <div style={{ marginBottom: 30 }}>
              <div className="risk-gauge-track">
                <div
                  className="risk-gauge-fill"
                  style={{
                    width: `${Math.min(parseFloat(riskPct), 100)}%`,
                    background: isClear
                      ? "var(--emerald)"
                      : isReview
                      ? "var(--amber)"
                      : "var(--rose)",
                  }}
                />

                {/* 35% Hold Threshold Marker */}
                <div
                  className="risk-threshold-marker"
                  style={{ left: "35%" }}
                  title="3DS2 Challenge threshold: 0.35"
                >
                  <div className="risk-threshold-label">35% Hold</div>
                </div>

                {/* 70% Block Threshold Marker */}
                <div
                  className="risk-threshold-marker"
                  style={{ left: "70%" }}
                  title="Hard Block threshold: 0.70"
                >
                  <div className="risk-threshold-label">70% Block</div>
                </div>
              </div>
            </div>

            {/* Signal Observations */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
                Active Telemetry Signals
              </span>

              {[
                {
                  label: "Distance from Home",
                  val: `${formData.distance.toFixed(1)} km`,
                  flag: formData.distance > 500,
                  icon: MapPin,
                },
                {
                  label: "Device Confidence",
                  val: `${(formData.device_trust * 100).toFixed(0)}%`,
                  flag: formData.device_trust < 0.3,
                  icon: Smartphone,
                },
                {
                  label: "Merchant Risk",
                  val: `${(formData.merchant_risk * 100).toFixed(0)}%`,
                  flag: formData.merchant_risk > 0.6,
                  icon: Store,
                },
                {
                  label: "Velocity (1h)",
                  val: `${formData.velocity_1h} attempts`,
                  flag: formData.velocity_1h > 3,
                  icon: CreditCard,
                },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
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
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon style={{ width: 12, height: 12, color: "var(--text-4)" }} />
                      <span style={{ color: "var(--text-3)" }}>{s.label}</span>
                    </div>
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
                );
              })}
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
              Pre-flight heuristic estimate. Final authoritative risk verdict and TreeSHAP feature attributions are computed server-side upon authorization.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
