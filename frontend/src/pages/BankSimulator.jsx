import React, { useState, useEffect } from "react";
import {
  Wifi,
  Activity,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  ShieldOff,
  RotateCw,
  Store,
  Sliders,
  Terminal,
  QrCode,
  Smartphone,
  Copy,
  Check,
  X,
  Layers,
  Maximize2
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  DEMO_INSTITUTIONS,
  gatewayCheckFraud,
  gatewaySubmitVerification,
  getTransactions,
  connectAlertWebSocket,
  API_BASE_URL
} from "../services/api";
import AbaMobileApp from "../components/banks/AbaMobileApp";
import AcledaMobileApp from "../components/banks/AcledaMobileApp";
import WingBankApp from "../components/banks/WingBankApp";
import BrandLogo, { EmblemMark } from "../components/BrandLogo";

// 5 Prepared Demo Scenarios aligned with Phase 12 of SentinelPay Specification
const DEMO_SCENARIOS = [
  {
    id: "scenario_a",
    name: "Scenario A: Normal KHQR",
    shortTitle: "Normal Coffee KHQR",
    tierLabel: "Auto-Approve",
    tierClass: "status-approved",
    icon: ShieldCheck,
    merchant: "Phnom Penh Coffee (BKK1)",
    merchantId: "pp_coffee@aba",
    city: "Phnom Penh",
    category: "Coffee & Food",
    amount: 8.50,
    currency: "USD",
    paymentMethod: "KHQR",
    distance: 1.2,
    timeDelta: 18.0,
    merchantRisk: 0.08,
    deviceTrust: 0.98,
    description: "Routine $8.50 morning coffee paid via Bakong KHQR on trusted smartphone near residential baseline.",
    expectedVerdict: "LOW RISK (~3.8%) → AUTO-APPROVED"
  },
  {
    id: "scenario_b",
    name: "Scenario B: False Positive",
    shortTitle: "Travel Laptop Purchase",
    tierLabel: "Step-Up → Release",
    tierClass: "status-review",
    icon: AlertTriangle,
    merchant: "Cambodia Electronics Mall",
    merchantId: "cam_electronics@aba",
    city: "Siem Reap",
    category: "Electronics",
    amount: 1500.00,
    currency: "USD",
    paymentMethod: "KHQR",
    distance: 310.0,
    timeDelta: 1.5,
    merchantRisk: 0.65,
    deviceTrust: 0.88,
    description: "Cardholder traveling to Siem Reap buying a laptop. Flagged for review; customer approves OTP.",
    expectedVerdict: "REVIEW → STEP-UP → RELEASED"
  },
  {
    id: "scenario_c",
    name: "Scenario C: Confirmed Fraud",
    shortTitle: "Account Takeover Attack",
    tierLabel: "Step-Up → Block",
    tierClass: "status-blocked",
    icon: ShieldOff,
    merchant: "Poipet Border Duty Free",
    merchantId: "dutyfree_poipet@aba",
    city: "Poipet",
    category: "Border Retail",
    amount: 1800.00,
    currency: "USD",
    paymentMethod: "KHQR",
    distance: 850.0,
    timeDelta: 0.15,
    merchantRisk: 0.92,
    deviceTrust: 0.10,
    description: "Account takeover attempt via unauthorized proxy device 850 km away. Cardholder denies; payment blocked.",
    expectedVerdict: "HIGH RISK (87%+) → BLOCKED"
  },
  {
    id: "scenario_d",
    name: "Scenario D: Velocity Burst",
    shortTitle: "Rapid Velocity Burst",
    tierLabel: "Velocity Anomaly",
    tierClass: "status-review",
    icon: RotateCw,
    merchant: "Lucky Supermarket (BKK)",
    merchantId: "lucky_bkk1@aba",
    city: "Phnom Penh",
    category: "Supermarket",
    amount: 900.00,
    currency: "USD",
    paymentMethod: "KHQR",
    distance: 25.0,
    timeDelta: 0.05,
    merchantRisk: 0.45,
    deviceTrust: 0.35,
    velocity_1h: 6,
    description: "Rapid high-frequency transactions within 3 minutes ($20 → $900 → $1,400 velocity anomaly).",
    expectedVerdict: "STEP-UP CHALLENGE REQUIRED"
  },
  {
    id: "scenario_e",
    name: "Scenario E: Merchant Anomaly",
    shortTitle: "High-Risk Gaming Transfer",
    tierLabel: "Merchant Anomaly",
    tierClass: "status-review",
    icon: Store,
    merchant: "Online Gaming & FX Liquidity",
    merchantId: "fx_apex_liquidity@aba",
    city: "Sihanoukville",
    category: "Gaming & FX",
    amount: 2000.00,
    currency: "USD",
    paymentMethod: "BANK_TRANSFER",
    distance: 120.0,
    timeDelta: 0.8,
    merchantRisk: 0.96,
    deviceTrust: 0.40,
    description: "Sudden $2,000 late-night transfer to an unregistered gambling/crypto liquidity gateway.",
    expectedVerdict: "STEP-UP CHALLENGE REQUIRED"
  }
];

const BANK_META = {
  ABA: {
    code: "ABA",
    name: "ABA Mobile",
    brandColor: "#003853",
    accentColor: "#00A3E0",
    badge: "Advanced Bank of Asia",
    chassisAccent: "#002B42",
    onBrand: "#FFFFFF"
  },
  ACLEDA: {
    code: "ACLEDA",
    name: "ACLEDA Mobile",
    brandColor: "#0A2240",
    accentColor: "#D4AF37",
    badge: "The People's Bank",
    chassisAccent: "#061527",
    onBrand: "#FFFFFF"
  },
  WING: {
    code: "WING",
    name: "Wing Bank",
    brandColor: "#77BC1F",
    accentColor: "#8CD428",
    badge: "Wing Bank (Cambodia)",
    chassisAccent: "#2E5E0B",
    onBrand: "#12300A"
  }
};

function formatAmount(value, currency) {
  return `${currency} ${Number(value).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BankSimulator({
  onTransactionComplete,
  onNavigateToIntelligence,
  standalone = false
}) {
  const [selectedInstKey, setSelectedInstKey] = useState("ABA");
  const [selectedScenario, setSelectedScenario] = useState("scenario_a");
  const [viewMode, setViewMode] = useState(standalone ? "standalone" : "cockpit");
  const [showQrModal, setShowQrModal] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [customHost, setCustomHost] = useState(() => {
    if (typeof window !== "undefined") {
      const h = window.location.hostname;
      if (h && h !== "localhost" && h !== "127.0.0.1") return h;
    }
    return "192.168.1.22";
  });
  const [networkInfo, setNetworkInfo] = useState(null);

  // Auto-discover the machine LAN IP so phone QR works seamlessly on Wi-Fi
  useEffect(() => {
    let isMounted = true;
    async function fetchNetworkInfo() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/system/network-info`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.lan_ip) {
            setNetworkInfo(data);
            setCustomHost(data.lan_ip);
          }
        }
      } catch (err) {
        console.warn("Could not retrieve network info:", err);
      }
    }
    fetchNetworkInfo();
    return () => { isMounted = false; };
  }, []);

  const computedMobileUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${customHost}:${window.location.port || '5173'}/#/mobile`
    : `http://${customHost}:5173/#/mobile`;

  // In-App Sheet Modal State: "NONE" | "CONFIRM_PAYMENT" | "STEP_UP" | "RECEIPT"
  const [activeSheet, setActiveSheet] = useState("NONE");

  // Financial State
  const [customerBalance, setCustomerBalance] = useState(8420.00);
  const [recentFeed, setRecentFeed] = useState([]);

  // Payment Form & Risk Factors
  const [merchant, setMerchant] = useState(DEMO_SCENARIOS[0].merchant);
  const [merchantCity, setMerchantCity] = useState(DEMO_SCENARIOS[0].city);
  const [amount, setAmount] = useState(DEMO_SCENARIOS[0].amount);
  const [currency, setCurrency] = useState(DEMO_SCENARIOS[0].currency);
  const [paymentMethod, setPaymentMethod] = useState(DEMO_SCENARIOS[0].paymentMethod);
  const [distance, setDistance] = useState(DEMO_SCENARIOS[0].distance);
  const [timeDelta, setTimeDelta] = useState(DEMO_SCENARIOS[0].timeDelta);
  const [merchantRisk, setMerchantRisk] = useState(DEMO_SCENARIOS[0].merchantRisk);
  const [deviceTrust, setDeviceTrust] = useState(DEMO_SCENARIOS[0].deviceTrust);
  const [velocity1h, setVelocity1h] = useState(DEMO_SCENARIOS[0].velocity_1h || 1);

  // In-flight Gateway State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeGatewayResult, setActiveGatewayResult] = useState(null);
  const [liveApiLog, setLiveApiLog] = useState(null);
  const [apiLatency, setApiLatency] = useState(null);
  const [error, setError] = useState(null);

  const activeBank = BANK_META[selectedInstKey] || BANK_META.ABA;
  const activeInst = DEMO_INSTITUTIONS.find((i) => i.code === selectedInstKey) || DEMO_INSTITUTIONS[0];
  const activeScenarioObj = DEMO_SCENARIOS.find((s) => s.id === selectedScenario) || DEMO_SCENARIOS[0];

  // Fetch recent transactions
  useEffect(() => {
    async function loadRecentActivity() {
      try {
        const txs = await getTransactions(8, activeInst.id);
        if (txs && txs.length > 0) {
          setRecentFeed(txs);
        } else {
          setRecentFeed([
            { id: 1, transaction_token: `${selectedInstKey}-TX-70646`, amount: 1500.00, currency: "USD", payment_method: "KHQR", status: "APPROVED", created_at: "Today, 09:20 AM" },
            { id: 2, transaction_token: `${selectedInstKey}-TX-11184`, amount: 8.50, currency: "USD", payment_method: "KHQR", status: "APPROVED", created_at: "Today, 08:45 AM" },
            { id: 3, transaction_token: `${selectedInstKey}-TX-97407-03`, amount: 1500.00, currency: "USD", payment_method: "KHQR", status: "RELEASED", created_at: "Yesterday" },
            { id: 4, transaction_token: `${selectedInstKey}-TX-97407-02`, amount: 1800.00, currency: "USD", payment_method: "KHQR", status: "BLOCKED", created_at: "Yesterday" }
          ]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadRecentActivity();
  }, [selectedInstKey, activeInst.id]);

  // Real-time WebSocket listener for out-of-band mutations (e.g. Telegram inline buttons or text replies)
  useEffect(() => {
    const ws = connectAlertWebSocket({
      institutionId: activeInst?.id || null,
      onMessage: (msg) => {
        if (msg.event === "TRANSACTION_STATUS_MUTATED") {
          const update = msg.data;
          setActiveGatewayResult((prev) => {
            if (!prev || prev.transaction_token !== update.transaction_token) return prev;
            const isApproved = update.new_status === "RELEASED";
            if (isApproved) {
              setCustomerBalance((b) => Math.max(0, b - prev.amount));
            }
            return {
              ...prev,
              status: update.new_status,
              message: isApproved
                ? "Step-up verification approved via Telegram. Transaction released."
                : "Step-up verification denied via Telegram. Transaction permanently blocked."
            };
          });
          setActiveSheet("RECEIPT");
          setRecentFeed((prev) => [
            {
              id: Date.now(),
              transaction_token: update.transaction_token,
              amount: amount || 0,
              currency: currency || "USD",
              payment_method: paymentMethod || "KHQR",
              status: update.new_status,
              created_at: "Just now (Telegram)"
            },
            ...prev.slice(0, 5)
          ]);
        }
      }
    });

    return () => {
      if (ws) ws.close();
    };
  }, [activeInst?.id, amount, currency, paymentMethod]);

  // Inject a Scenario onto the Phone
  const handleSelectScenario = (sc) => {
    setSelectedScenario(sc.id);
    setMerchant(sc.merchant);
    setMerchantCity(sc.city);
    setAmount(sc.amount);
    setCurrency(sc.currency);
    setPaymentMethod(sc.paymentMethod);
    setDistance(sc.distance);
    setTimeDelta(sc.timeDelta);
    setMerchantRisk(sc.merchantRisk);
    setDeviceTrust(sc.deviceTrust);
    setVelocity1h(sc.velocity_1h || (sc.timeDelta <= 0.1 ? 6 : 1));
    setActiveGatewayResult(null);
    setActiveSheet("CONFIRM_PAYMENT");
    setError(null);
  };

  // Submit Payment via Gateway
  const handleInitiatePayment = async () => {
    setIsSubmitting(true);
    setError(null);
    const token = `${selectedInstKey}-TX-${Math.floor(10000 + Math.random() * 90000)}`;
    const startTime = performance.now();

    const payload = {
      transaction_token: token,
      amount: parseFloat(amount),
      currency: currency,
      payment_method: paymentMethod,
      distance: parseFloat(distance),
      time_delta: parseFloat(timeDelta),
      merchant_risk: parseFloat(merchantRisk),
      device_trust: parseFloat(deviceTrust),
      velocity_1h: parseInt(velocity1h || (parseFloat(timeDelta) <= 0.1 ? 6 : 1), 10),
      user_id: 1001,
      extra_fields: { merchant_name: merchant }
    };

    try {
      const result = await gatewayCheckFraud(payload, activeInst.apiKey, activeInst.code);
      const latency = Math.round(performance.now() - startTime);
      setApiLatency(latency);
      setActiveGatewayResult(result);
      setLiveApiLog({
        endpoint: "POST /api/v1/fraud/check",
        status: 200,
        request: payload,
        response: result,
        latencyMs: latency
      });

      const isBlocked = result.status === "BLOCKED" || result.action === "DENY" || result.action === "BLOCK";
      if (result.action === "STEP_UP_REQUIRED") {
        setActiveSheet("STEP_UP");
      } else if (isBlocked) {
        // High Risk Confirmed Fraud -> Hard Blocked (No funds debited)
        const blockedResult = { ...result, status: "BLOCKED" };
        setActiveGatewayResult(blockedResult);
        setRecentFeed((prev) => [
          {
            id: Date.now(),
            transaction_token: token,
            amount: amount,
            currency: currency,
            payment_method: paymentMethod,
            status: "BLOCKED",
            created_at: "Just now"
          },
          ...prev.slice(0, 5)
        ]);
        setActiveSheet("RECEIPT");
        if (onTransactionComplete) {
          onTransactionComplete(blockedResult, payload);
        }
      } else {
        // Auto-Approved
        setCustomerBalance((prev) => Math.max(0, prev - amount));
        setRecentFeed((prev) => [
          {
            id: Date.now(),
            transaction_token: token,
            amount: amount,
            currency: currency,
            payment_method: paymentMethod,
            status: "APPROVED",
            created_at: "Just now"
          },
          ...prev.slice(0, 5)
        ]);
        setActiveSheet("RECEIPT");
        if (onTransactionComplete) {
          onTransactionComplete(result, payload);
        }
      }
    } catch (err) {
      setError(err.message || "Gateway fraud check failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resolve Bank Step-Up Challenge (Biometric Liveness, Cooling-Off Lock, Anti-Scam Advisory)
  const handleResolveStepUp = async (verdict, authMethod = "BIOMETRIC_LIVENESS", customReason = null) => {
    if (!activeGatewayResult) return;
    setIsVerifying(true);
    const startTime = performance.now();
    try {
      const defaultReason = verdict === "APPROVED"
        ? `Customer verified via ${authMethod} in ${activeBank.name}`
        : `Transaction rejected/intercepted via ${authMethod} in ${activeBank.name}`;

      const res = await gatewaySubmitVerification({
        transaction_token: activeGatewayResult.transaction_token,
        verification: verdict,
        auth_method: authMethod,
        reason: customReason || defaultReason
      }, activeInst.apiKey, activeInst.code);

      const latency = Math.round(performance.now() - startTime);
      const isApproved = res.status === "RELEASED";

      if (isApproved) {
        setCustomerBalance((prev) => Math.max(0, prev - activeGatewayResult.amount));
      }

      const updatedResult = {
        ...activeGatewayResult,
        status: res.status,
        message: res.message,
        auth_method: authMethod
      };

      setRecentFeed((prev) => [
        {
          id: Date.now(),
          transaction_token: activeGatewayResult.transaction_token,
          amount: activeGatewayResult.amount,
          currency: activeGatewayResult.currency,
          payment_method: activeGatewayResult.payment_method || "KHQR",
          status: res.status,
          created_at: "Just now"
        },
        ...prev.slice(0, 5)
      ]);

      setActiveGatewayResult(updatedResult);
      setLiveApiLog({
        endpoint: "POST /api/v1/verification/result",
        status: 200,
        request: {
          transaction_token: activeGatewayResult.transaction_token,
          verification: verdict,
          auth_method: authMethod,
          reason: customReason || defaultReason
        },
        response: res,
        latencyMs: latency
      });

      setActiveSheet("RECEIPT");

      if (onTransactionComplete) {
        onTransactionComplete(updatedResult, activeGatewayResult);
      }
    } catch (err) {
      setError(err.message || "Failed to submit verification result");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: standalone ? 480 : 1380, margin: "0 auto" }}>
      {/* ── Standalone Mode Header (when visited as Cardholder view) ── */}
      {standalone ? (
        <div className="standalone-mode-header" style={{ width: "100%", maxWidth: 390, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, padding: "8px 12px", background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(12px)", borderRadius: 12, border: "1px solid rgba(255, 255, 255, 0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BrandLogo variant="badge" emblemSize={18} color="#38BDF8" />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>Cardholder Client</div>
              <div style={{ fontSize: 9.5, color: "rgba(255, 255, 255, 0.6)" }}>Direct Banking Session</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            {Object.entries(BANK_META).map(([code, meta]) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setSelectedInstKey(code);
                  setActiveGatewayResult(null);
                  setActiveSheet("NONE");
                }}
                style={{
                  padding: "4px 9px",
                  borderRadius: 6,
                  border: selectedInstKey === code ? `1px solid ${meta.accentColor || meta.brandColor}` : "1px solid rgba(255, 255, 255, 0.12)",
                  background: selectedInstKey === code ? meta.brandColor : "rgba(255, 255, 255, 0.06)",
                  color: selectedInstKey === code ? meta.onBrand : "#E2E8F0",
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 120ms ease"
                }}
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* ── Full Cockpit Header ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div style={{ minWidth: 260, maxWidth: 640 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span className="section-label">Commercial Banking Simulation</span>
                <span style={{ color: "var(--text-3)", fontSize: 11 }}>&middot;</span>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>Cambodia Retail Gateway</span>
              </div>
              <h1 className="page-title" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-1)", margin: "0 0 4px 0" }}>
                Commercial Banking Simulator
              </h1>
              <p className="page-subtitle" style={{ fontSize: 13, color: "var(--text-2)", margin: 0, lineHeight: 1.45 }}>
                Simulate authentic retail transactions across ABA Mobile, ACLEDA, and Wing Bank with real-time TreeSHAP fraud forensics.
              </p>
            </div>

            {/* Clean Segmented Bank Switcher */}
            <div
              role="tablist"
              aria-label="Select banking app"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "var(--surface)",
                padding: "3px 4px",
                borderRadius: 10,
                border: "1px solid var(--shell-border)",
                boxShadow: "var(--shadow-subtle)"
              }}
            >
              {Object.entries(BANK_META).map(([code, meta]) => {
                const isSelected = selectedInstKey === code;
                return (
                  <button
                    key={code}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => {
                      setSelectedInstKey(code);
                      setActiveGatewayResult(null);
                      setActiveSheet("NONE");
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 7,
                      border: "none",
                      background: isSelected ? meta.brandColor : "transparent",
                      color: isSelected ? meta.onBrand : "var(--text-2)",
                      fontSize: 12,
                      fontWeight: isSelected ? 600 : 500,
                      cursor: "pointer",
                      transition: "all 140ms ease",
                      boxShadow: isSelected ? "0 1px 4px rgba(0,0,0,0.15)" : "none"
                    }}
                  >
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: meta.accentColor }} />
                    <span>{meta.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sub-toolbar: View controls & Handshake Actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, paddingTop: 10, borderTop: "1px solid var(--shell-border)" }}>
            {/* View Mode: Dual Cockpit vs Phone Focus */}
            <div style={{ display: "inline-flex", background: "rgba(15, 23, 42, 0.04)", padding: 2.5, borderRadius: 8, border: "1px solid rgba(15, 23, 42, 0.06)" }}>
              <button
                type="button"
                onClick={() => setViewMode("cockpit")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: viewMode === "cockpit" ? "#FFFFFF" : "transparent",
                  color: viewMode === "cockpit" ? "var(--text-1)" : "var(--text-3)",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: viewMode === "cockpit" ? "0 1px 2px rgba(0,0,0,0.08)" : "none"
                }}
              >
                <Sliders style={{ width: 12, height: 12 }} />
                <span>Split Cockpit</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("standalone")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "none",
                  background: viewMode === "standalone" ? "#FFFFFF" : "transparent",
                  color: viewMode === "standalone" ? "var(--text-1)" : "var(--text-3)",
                  fontSize: 11.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: viewMode === "standalone" ? "0 1px 2px rgba(0,0,0,0.08)" : "none"
                }}
              >
                <Smartphone style={{ width: 12, height: 12 }} />
                <span>Phone Focus</span>
              </button>
            </div>

            {/* Quick Actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* QR Connect Action */}
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: "6px 12px",
                  background: "var(--cobalt)",
                  color: "#FFFFFF",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer"
                }}
                title="Connect real phone via QR code"
              >
                <QrCode style={{ width: 13, height: 13 }} />
                <span>Connect Phone (QR)</span>
              </button>

              {/* Pop-out standalone window */}
              <button
                type="button"
                onClick={() => {
                  window.open('#/mobile', 'SentinelPayMobile', 'width=410,height=860,menubar=no,toolbar=no,location=no');
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11.5,
                  fontWeight: 600,
                  padding: "6px 11px",
                  background: "var(--surface)",
                  border: "1px solid var(--shell-border)",
                  borderRadius: 8,
                  cursor: "pointer",
                  color: "var(--text-2)"
                }}
                title="Pop out standalone mobile app window"
              >
                <ExternalLink style={{ width: 12, height: 12 }} />
                <span>Pop-Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid or Centered Standalone Chassis */}
      <div className={viewMode === "standalone" || standalone ? "standalone-view-wrap" : "simulator-grid"}>

        {/* ========================================================================= */}
        {/* COLUMN 1: THE SMARTPHONE (REAL IPHONE 16 PRO FRAME)                       */}
        {/* ========================================================================= */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Physical Phone Chassis — compresses on short viewports so nothing is clipped */}
          <div
            className="phone-mockup-frame"
            style={{
              width: 390,
              height: 790,
              maxHeight: "calc(100dvh - 120px)",
              minHeight: 560,
              borderRadius: 52,
              background: "#000000",
              border: "12px solid #1E293B",
              boxShadow: "0 28px 75px -15px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.15)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column"
            }}
          >
            {/* iOS Dynamic Island & Status Bar */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 44,
                zIndex: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 26px",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 600,
                pointerEvents: "none"
              }}
            >
              <span>9:41</span>
              {/* Dynamic Island Pill */}
              <div
                style={{
                  width: 98,
                  height: 25,
                  borderRadius: 14,
                  background: "#000000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-end",
                  paddingRight: 8
                }}
              >
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#0F172A", border: "1.5px solid #1E293B" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 10, fontFamily: "var(--font-mono)" }}>5G</span>
                <Wifi style={{ width: 12, height: 12 }} />
                <div style={{ width: 18, height: 10, borderRadius: 3, border: "1.5px solid #FFFFFF", padding: 1 }}>
                  <div style={{ width: "85%", height: "100%", background: "#FFFFFF", borderRadius: 1 }} />
                </div>
              </div>
            </div>

            {/* In-App Screen Content Container: Switches to the Authentic Bank Replica */}
            <div
              className="mobile-app-viewport no-scrollbar"
              style={{
                flex: 1,
                paddingTop: 44,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {selectedInstKey === "ABA" && (
                <AbaMobileApp
                  balance={customerBalance}
                  onBalanceChange={setCustomerBalance}
                  recentTransactions={recentFeed}
                  onInitiatePayment={handleInitiatePayment}
                  onResolveStepUp={handleResolveStepUp}
                  isSubmitting={isSubmitting}
                  isVerifying={isVerifying}
                  activeGatewayResult={activeGatewayResult}
                  activeSheet={activeSheet}
                  setActiveSheet={setActiveSheet}
                  paymentDetails={{
                    merchant,
                    city: merchantCity,
                    amount,
                    currency,
                    paymentMethod,
                    distance,
                    timeDelta,
                    merchantRisk,
                    deviceTrust
                  }}
                  setPaymentDetails={(updates) => {
                    if (updates.merchant !== undefined) setMerchant(updates.merchant);
                    if (updates.city !== undefined) setMerchantCity(updates.city);
                    if (updates.amount !== undefined) setAmount(updates.amount);
                    if (updates.currency !== undefined) setCurrency(updates.currency);
                  }}
                  error={error}
                />
              )}

              {selectedInstKey === "ACLEDA" && (
                <AcledaMobileApp
                  balance={customerBalance}
                  onBalanceChange={setCustomerBalance}
                  recentTransactions={recentFeed}
                  onInitiatePayment={handleInitiatePayment}
                  onResolveStepUp={handleResolveStepUp}
                  isSubmitting={isSubmitting}
                  isVerifying={isVerifying}
                  activeGatewayResult={activeGatewayResult}
                  activeSheet={activeSheet}
                  setActiveSheet={setActiveSheet}
                  paymentDetails={{
                    merchant,
                    city: merchantCity,
                    amount,
                    currency,
                    paymentMethod,
                    distance,
                    timeDelta,
                    merchantRisk,
                    deviceTrust
                  }}
                  setPaymentDetails={(updates) => {
                    if (updates.merchant !== undefined) setMerchant(updates.merchant);
                    if (updates.city !== undefined) setMerchantCity(updates.city);
                    if (updates.amount !== undefined) setAmount(updates.amount);
                    if (updates.currency !== undefined) setCurrency(updates.currency);
                  }}
                  error={error}
                />
              )}

              {selectedInstKey === "WING" && (
                <WingBankApp
                  balance={customerBalance}
                  onBalanceChange={setCustomerBalance}
                  recentTransactions={recentFeed}
                  onInitiatePayment={handleInitiatePayment}
                  onResolveStepUp={handleResolveStepUp}
                  isSubmitting={isSubmitting}
                  isVerifying={isVerifying}
                  activeGatewayResult={activeGatewayResult}
                  activeSheet={activeSheet}
                  setActiveSheet={setActiveSheet}
                  paymentDetails={{
                    merchant,
                    city: merchantCity,
                    amount,
                    currency,
                    paymentMethod,
                    distance,
                    timeDelta,
                    merchantRisk,
                    deviceTrust
                  }}
                  setPaymentDetails={(updates) => {
                    if (updates.merchant !== undefined) setMerchant(updates.merchant);
                    if (updates.city !== undefined) setMerchantCity(updates.city);
                    if (updates.amount !== undefined) setAmount(updates.amount);
                    if (updates.currency !== undefined) setCurrency(updates.currency);
                  }}
                  error={error}
                />
              )}
            </div>

            {/* iOS Bottom Home Bar */}
            <div
              style={{
                position: "absolute",
                bottom: 6,
                left: "50%",
                transform: "translateX(-50%)",
                width: 130,
                height: 4,
                borderRadius: 4,
                background: selectedInstKey === "WING" ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.4)",
                pointerEvents: "none",
                zIndex: 110
              }}
            />
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMN 2: UNIFIED COCKPIT DOCK: SCENARIOS, SIGNALS & LIVE TELEMETRY       */}
        {/* ========================================================================= */}
        {viewMode === "cockpit" && !standalone && (
          <div className="cockpit-dock-container">

            {/* ── SECTION 1: SCENARIO TEST SUITE (5-COLUMN BALANCED MATRIX) ── */}
            <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--shell-border)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Layers style={{ width: 15, height: 15, color: "var(--cobalt)" }} />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.01em" }}>
                      Transaction Scenarios
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-3)", marginLeft: 8 }}>
                      Pre-configured fraud patterns
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: activeBank.accentColor || "var(--cobalt)" }} />
                  <span style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500 }}>
                    Target: <strong style={{ color: "var(--text-1)", fontWeight: 600 }}>{activeBank.name}</strong>
                  </span>
                </div>
              </div>

              {/* 5-Column Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 6 }}>
                {DEMO_SCENARIOS.map((sc, idx) => {
                  const isSelected = selectedScenario === sc.id;
                  const letter = String.fromCharCode(65 + idx); // A, B, C, D, E
                  const Icon = sc.icon;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleSelectScenario(sc)}
                      className={`scenario-pill-btn ${isSelected ? "active" : ""}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span
                            style={{
                              width: 17,
                              height: 17,
                              borderRadius: 4,
                              background: isSelected ? "var(--cobalt)" : "rgba(15, 23, 42, 0.08)",
                              color: isSelected ? "#FFFFFF" : "var(--text-2)",
                              fontSize: 10,
                              fontWeight: 700,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontFamily: "var(--font-mono)"
                            }}
                          >
                            {letter}
                          </span>
                          <Icon style={{ width: 12, height: 12, color: isSelected ? "var(--cobalt)" : "var(--text-3)", flexShrink: 0 }} />
                        </div>
                        <span className={`status-tag ${sc.tierClass}`} style={{ fontSize: 9, padding: "0 4px", lineHeight: "16px" }}>
                          ${sc.amount >= 1000 ? `${(sc.amount / 1000).toFixed(1)}k` : sc.amount}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: isSelected ? 700 : 600, color: "var(--text-1)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={sc.shortTitle}>
                        {sc.shortTitle}
                      </div>
                      <div style={{ fontSize: 9.5, color: isSelected ? "var(--cobalt)" : "var(--text-3)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {sc.tierLabel}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Active Scenario Narrative Strip */}
              <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: "rgba(37, 99, 235, 0.04)", border: "1px solid rgba(37, 99, 235, 0.12)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 240 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--cobalt)" }}>
                    Scenario {selectedScenario.replace("scenario_", "").toUpperCase()}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.4 }}>
                    {activeScenarioObj.description}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: "var(--text-3)", fontWeight: 500 }}>Expected Outcome:</span>
                  <span
                    className={`status-tag ${activeScenarioObj.tierClass}`}
                    style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px" }}
                  >
                    {activeScenarioObj.expectedVerdict.split("→")[1]?.trim() || activeScenarioObj.tierLabel}
                  </span>
                </div>
              </div>
            </div>

            {/* ── SECTION 2: BEHAVIORAL RISK SIGNALS (2x2 PRECISION GRID) ── */}
            <div style={{ padding: "14px 18px", background: "rgba(248, 250, 252, 0.65)", borderBottom: "1px solid var(--shell-border)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Sliders style={{ width: 14, height: 14, color: "var(--cobalt)" }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-1)" }}>
                    Behavioral Risk Signals
                  </span>
                  <span style={{ fontSize: 10.5, color: "var(--text-3)" }}>
                    &middot; Dynamic ML input vector
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleSelectScenario(activeScenarioObj)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: 10.5,
                    color: "var(--cobalt)",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0
                  }}
                  title="Reset sliders to preset scenario values"
                >
                  Reset to Preset
                </button>
              </div>

              {/* 2x2 Grid of Precision Controls */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {/* Tile 1: Distance */}
                <div className="signal-metric-tile">
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500 }}>Distance from Home</span>
                    <strong className="tabular-nums" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: distance > 300 ? "var(--rose)" : "var(--text-1)", fontWeight: 700 }}>
                      {distance} km
                    </strong>
                  </div>
                  <input
                    type="range"
                    className="precision-slider"
                    min="0.5"
                    max="2500"
                    step="5"
                    value={distance}
                    onChange={(e) => setDistance(parseFloat(e.target.value))}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                    <span>0.5 km (Local)</span>
                    <span>2,500 km (Foreign)</span>
                  </div>
                </div>

                {/* Tile 2: Device Trust */}
                <div className="signal-metric-tile">
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500 }}>Device Trust Score</span>
                    <strong className="tabular-nums" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: deviceTrust > 0.6 ? "var(--emerald)" : "var(--rose)", fontWeight: 700 }}>
                      {(deviceTrust * 100).toFixed(0)}%
                    </strong>
                  </div>
                  <input
                    type="range"
                    className="precision-slider"
                    min="0.01"
                    max="1.0"
                    step="0.02"
                    value={deviceTrust}
                    onChange={(e) => setDeviceTrust(parseFloat(e.target.value))}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                    <span>0% (Proxy / Bot)</span>
                    <span>100% (Secure Enclave)</span>
                  </div>
                </div>

                {/* Tile 3: Merchant Risk */}
                <div className="signal-metric-tile">
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500 }}>Merchant Risk Rating</span>
                    <strong className="tabular-nums" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: merchantRisk > 0.6 ? "var(--rose)" : "var(--text-1)", fontWeight: 700 }}>
                      {(merchantRisk * 100).toFixed(0)}%
                    </strong>
                  </div>
                  <input
                    type="range"
                    className="precision-slider"
                    min="0.01"
                    max="1.0"
                    step="0.02"
                    value={merchantRisk}
                    onChange={(e) => setMerchantRisk(parseFloat(e.target.value))}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                    <span>Low (Groceries)</span>
                    <span>High (Crypto / FX)</span>
                  </div>
                </div>

                {/* Tile 4: Time Delta */}
                <div className="signal-metric-tile">
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 11, color: "var(--text-2)", fontWeight: 500 }}>Prior Activity Gap</span>
                    <strong className="tabular-nums" style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: timeDelta <= 0.1 ? "var(--amber)" : "var(--text-1)", fontWeight: 700 }}>
                      {timeDelta} hrs
                    </strong>
                  </div>
                  <input
                    type="range"
                    className="precision-slider"
                    min="0.05"
                    max="48"
                    step="0.5"
                    value={timeDelta}
                    onChange={(e) => setTimeDelta(parseFloat(e.target.value))}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
                    <span>3 mins (Burst)</span>
                    <span>48 hours (Dormant)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── SECTION 3: SYNCHRONOUS TELEMETRY & PRE-FLIGHT MATRIX ── */}
            <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Activity style={{ width: 15, height: 15, color: "var(--cobalt)" }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", letterSpacing: "-0.01em" }}>
                    Synchronous Gateway Telemetry
                  </span>
                  <BrandLogo variant="badge" emblemSize={12} color="var(--cobalt)" />
                </div>

                {apiLatency ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--emerald)" }} />
                    <span className="tabular-nums" style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--emerald)", fontWeight: 700 }}>
                      {apiLatency} ms
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>
                    SLA &lt; 45ms &middot; Real-Time
                  </span>
                )}
              </div>

              {liveApiLog ? (
                <div className="telemetry-grid">
                  {/* Request Payload */}
                  <div style={{ minWidth: 0 }}>
                    <div className="section-label" style={{ fontSize: 10, marginBottom: 4 }}>
                      Request &middot; {activeBank.code} Pay
                    </div>
                    <pre className="telemetry-pre">
                      {JSON.stringify(liveApiLog.request, null, 2)}
                    </pre>
                  </div>

                  {/* Gateway Response with SHAP */}
                  <div style={{ minWidth: 0 }}>
                    <div className="section-label" style={{ fontSize: 10, marginBottom: 4 }}>
                      Response &middot; SHAP Verdict
                    </div>
                    <pre className="telemetry-pre telemetry-pre-response">
                      {JSON.stringify(liveApiLog.response, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                /* Pre-Flight System Readiness Matrix (eliminates dead empty white space) */
                <div style={{ background: "var(--shell-bg)", border: "1px solid var(--shell-border)", borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", fontWeight: 600 }}>Active Gateway</span>
                      <strong style={{ fontSize: 12, color: "var(--text-1)", fontWeight: 600 }}>{activeInst.name}</strong>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", fontWeight: 600 }}>ML Risk Engine</span>
                      <strong style={{ fontSize: 12, color: "var(--cobalt)", fontWeight: 600 }}>XGBoost v2.4 + SHAP</strong>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-3)", fontWeight: 600 }}>Governance</span>
                      <strong style={{ fontSize: 12, color: "var(--emerald)", fontWeight: 600 }}>Zero-PII Tokenized</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: "1px solid var(--shell-border)", flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontSize: 11, color: "var(--text-2)", lineHeight: 1.4 }}>
                      Ready. Scan or tap payment in <strong>{activeBank.name}</strong> to trigger synchronous fraud evaluation.
                    </span>
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleInitiatePayment}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "7px 14px",
                        borderRadius: 6,
                        background: "var(--cobalt)",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: isSubmitting ? "not-allowed" : "pointer"
                      }}
                    >
                      <span>{isSubmitting ? "Evaluating..." : "Run Test Payment"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Forensics Console Link */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, paddingTop: 8, borderTop: "1px solid var(--shell-border)" }}>
                <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                  Institutional Scope: <strong style={{ color: "var(--text-1)", fontWeight: 600 }}>{activeInst.name}</strong>
                </span>
                {onNavigateToIntelligence && (
                  <button
                    type="button"
                    onClick={onNavigateToIntelligence}
                    style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", color: "var(--cobalt)", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}
                  >
                    <span>Investigate SHAP waterfall in Forensics</span>
                    <ExternalLink style={{ width: 12, height: 12 }} />
                  </button>
                )}
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── Dual-Screen Live Demonstration QR Modal ── */}
      {showQrModal && (
        <div className="modal-backdrop" onClick={() => setShowQrModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440, padding: 22, borderRadius: 16 }}>
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "var(--cobalt-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--cobalt)" }}>
                  <Smartphone style={{ width: 18, height: 18 }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", margin: 0 }}>
                    Connect Mobile Device
                  </h3>
                  <span style={{ fontSize: 11, color: "var(--text-3)" }}>
                    Open customer banking app on your physical smartphone
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="icon-btn"
                style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--shell-border)", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={15} />
              </button>
            </div>

            {/* Live LAN Status Banner */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: 8, marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--emerald)", display: "inline-block" }} />
                <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-1)" }}>
                  Wi-Fi Gateway Active
                </span>
              </div>
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--emerald)", fontWeight: 600 }}>
                {customHost}:5173
              </span>
            </div>

            {/* QR Code Container */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ padding: 14, background: "#FFFFFF", borderRadius: 14, border: "1px solid var(--shell-border)", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <QRCodeSVG value={computedMobileUrl} size={185} level="M" />
              </div>

              {/* Direct Link & Copy */}
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    value={computedMobileUrl}
                    readOnly
                    style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: "1px solid var(--shell-border)", fontSize: 11.5, fontFamily: "var(--font-mono)", background: "rgba(15, 23, 42, 0.03)", color: "var(--text-1)" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(computedMobileUrl);
                      setCopiedUrl(true);
                      setTimeout(() => setCopiedUrl(false), 2000);
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 6, background: "var(--surface)", border: "1px solid var(--shell-border)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", color: "var(--text-1)" }}
                  >
                    {copiedUrl ? <Check size={12} color="var(--emerald)" /> : <Copy size={12} />}
                    <span>{copiedUrl ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3 Step Instruction Box */}
            <div style={{ background: "rgba(15, 23, 42, 0.03)", border: "1px solid var(--shell-border)", borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-1)", marginBottom: 6 }}>
                How to Connect:
              </div>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: "var(--text-2)", lineHeight: 1.6 }}>
                <li>Connect your smartphone to the same Wi-Fi network as this PC.</li>
                <li>Open your phone&rsquo;s Camera app and point it at the QR code.</li>
                <li>Tap the prompt to load the bank replica directly in Safari or Chrome.</li>
              </ol>
            </div>

            {/* Footer Actions */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  const newIp = window.prompt("Enter your computer's LAN IP address:", customHost);
                  if (newIp && newIp.trim()) setCustomHost(newIp.trim());
                }}
                style={{ background: "none", border: "none", color: "var(--text-3)", fontSize: 11, cursor: "pointer", textDecoration: "underline" }}
              >
                Change Host IP
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open(computedMobileUrl, 'SentinelPayMobile', 'width=410,height=860,menubar=no,toolbar=no,location=no');
                  setShowQrModal(false);
                }}
                style={{ fontSize: 11.5, padding: "7px 14px", background: "var(--cobalt)", color: "#FFFFFF", borderRadius: 6, border: "none", cursor: "pointer", fontWeight: 600 }}
              >
                Open in Desktop Popup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
