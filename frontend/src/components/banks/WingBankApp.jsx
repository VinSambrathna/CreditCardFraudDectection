import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  CreditCard,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  Smartphone,
  Gift,
  Bell,
  Search,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  RotateCw,
  Lock,
  CheckCircle2,
  XCircle,
  Fingerprint,
  Check,
  Building2,
  Zap,
  Coins,
  Shield,
  Layers,
  Store,
  Share2,
  Download,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  ArrowLeftRight,
  TrendingUp,
  Copy,
  Flashlight,
  Image as ImageIcon,
  Clock,
  Info,
  PhoneCall,
  X,
  FileText,
  Sliders,
  Home,
  User,
  Compass
} from "lucide-react";
import VirtualCreditCard from "../VirtualCreditCard";
import MobileBankingKeypad from "./MobileBankingKeypad";
import BrandLogo, { EmblemMark } from "../BrandLogo";
import BankStepUpChallenge from "./BankStepUpChallenge";
import PrimaryPinModal from "./PrimaryPinModal";

// Authentic Wing Bank Logo Component
export function WingBankLogo({ size = 32, showText = true, textColor = "#002D62" }) {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, userSelect: "none" }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" style={{ flexShrink: 0 }}>
        {/* Signature Wing Lime Green Circle */}
        <circle cx="50" cy="50" r="48" fill="#77BC1F" />
        {/* Dynamic Stylized Wing Bird in Flight */}
        <path
          d="M20 58C24 40 40 28 60 26C46 32 38 42 36 52C44 42 58 36 78 34C64 42 54 52 52 64C62 54 74 50 82 50C70 62 56 70 38 70C28 70 22 65 20 58Z"
          fill="#FFFFFF"
        />
        <path
          d="M30 63C36 49 48 39 64 37C52 42 46 49 44 57C52 49 62 45 74 45C62 55 52 63 40 65C34 65 31 64 30 63Z"
          fill="#002D62"
        />
      </svg>
      {showText && (
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.05 }}>
          <div style={{ fontSize: size * 0.44, fontWeight: 900, letterSpacing: "-0.03em", color: textColor }}>
            Wing<span style={{ color: "#77BC1F" }}>Bank</span>
          </div>
          <span style={{ fontSize: size * 0.22, fontWeight: 800, color: "#55850E", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Everyday Bank
          </span>
        </div>
      )}
    </div>
  );
}

// 5 Prepared Demo Scenarios
const WING_RECIPIENTS = [
  { name: "Phnom Penh Coffee (BKK1)", account: "012 294 812", bank: "Wing Bank", city: "Phnom Penh", defaultAmount: 8.50, risk: 0.08, trust: 0.98, dist: 1.2, category: "Coffee & Food" },
  { name: "Cambodia Electronics Mall", account: "089 551 920", bank: "Wing Pay", city: "Siem Reap", defaultAmount: 1500.00, risk: 0.65, trust: 0.88, dist: 310.0, category: "Electronics" },
  { name: "Poipet Border Duty Free", account: "096 882 104", bank: "Bakong Network", city: "Poipet", defaultAmount: 1800.00, risk: 0.92, trust: 0.10, dist: 850.0, category: "Border Retail" },
  { name: "Lucky Supermarket (BKK)", account: "011 918 331", bank: "Wing Bank", city: "Phnom Penh", defaultAmount: 900.00, risk: 0.45, trust: 0.35, dist: 25.0, category: "Supermarket" },
  { name: "Online Gaming & FX Liquidity", account: "078 332 990", bank: "Bakong Switch", city: "Sihanoukville", defaultAmount: 2000.00, risk: 0.96, trust: 0.40, dist: 120.0, category: "Gaming & FX" }
];

export default function WingBankApp({
  balance,
  onBalanceChange,
  recentTransactions = [],
  onInitiatePayment,
  onResolveStepUp,
  isSubmitting,
  isVerifying,
  activeGatewayResult,
  activeSheet,
  setActiveSheet,
  paymentDetails,
  setPaymentDetails,
  error
}) {
  // Navigation stack: "home" | "scan" | "transfers_menu" | "select_recipient" | "input_amount" | "review_transfer" | "cards" | "history" | "security_center" | "my_qr" | "notifications"
  const [activeTab, setActiveTab] = useState("home");
  const [showBalance, setShowBalance] = useState(true);
  const [cardFrozen, setCardFrozen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [showPrimaryPin, setShowPrimaryPin] = useState(false);
  const [inAppPushNotification, setInAppPushNotification] = useState(null);
  const [bioScanning, setBioScanning] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState(null);

  // Currency display toggle on the home account card: "USD" | "KHR"
  const [activeCurrencyMode, setActiveCurrencyMode] = useState("USD");

  // Transfer Flow State
  const [selectedRecipient, setSelectedRecipient] = useState(WING_RECIPIENTS[0]);
  const [customAmountStr, setCustomAmountStr] = useState(paymentDetails?.amount ? String(paymentDetails.amount) : "8.50");
  const [transferCurrency, setTransferCurrency] = useState(paymentDetails?.currency || "USD");
  const [transferRemark, setTransferRemark] = useState("Wing Payment");

  const accountNumber = "012 889 901";
  const cardholderName = "SOVANNA SOK";
  const khrBalance = Math.round(balance * 4100);

  // External scenario injection sync (when scenario card clicked on the right panel)
  useEffect(() => {
    if (activeSheet === "CONFIRM_PAYMENT") {
      setCustomAmountStr(String(paymentDetails.amount || 8.50));
      setTransferCurrency(paymentDetails.currency || "USD");
      setActiveTab("review_transfer");
    }
  }, [activeSheet, paymentDetails]);

  useEffect(() => {
    if (paymentDetails?.amount) {
      setCustomAmountStr(String(paymentDetails.amount));
    }
    if (paymentDetails?.currency) {
      setTransferCurrency(paymentDetails.currency);
    }
    if (paymentDetails?.merchant) {
      const match = WING_RECIPIENTS.find(r => r.name.toLowerCase().includes(paymentDetails.merchant.toLowerCase()));
      if (match) setSelectedRecipient(match);
    }
  }, [paymentDetails]);

  // Real-time Push Notification banner
  useEffect(() => {
    if (activeGatewayResult) {
      const isApproved = activeGatewayResult.status === "APPROVED" || activeGatewayResult.status === "RELEASED";
      const isStepUp = activeGatewayResult.action === "STEP_UP_REQUIRED" && activeGatewayResult.status === "SOFT_BLOCKED";
      const isBlocked = activeGatewayResult.status === "BLOCKED";

      let notification = null;
      const merchantName = paymentDetails?.merchant || selectedRecipient?.name || "Merchant";
      const formattedAmt = parseFloat(activeGatewayResult.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      if (isApproved) {
        notification = {
          type: "success",
          badge: "Wing Bank",
          title: "Transfer Successful",
          message: `Sent $${formattedAmt} to ${merchantName} via WingPay.`,
          time: "now"
        };
      } else if (isStepUp) {
        notification = {
          type: "warning",
          badge: "Wing Bank",
          title: "Verification Required",
          message: `Authorize $${formattedAmt} to ${merchantName} with PIN or Face ID.`,
          time: "now"
        };
      } else if (isBlocked) {
        notification = {
          type: "danger",
          badge: "Wing Bank",
          title: "Payment Blocked",
          message: `Suspicious transfer of $${formattedAmt} at ${merchantName} was declined.`,
          time: "now"
        };
      }

      if (notification) {
        setInAppPushNotification(notification);
        const timer = setTimeout(() => setInAppPushNotification(null), 6500);
        return () => clearTimeout(timer);
      }
    }
  }, [activeGatewayResult, paymentDetails?.merchant]);

  const handleCopyAccount = () => {
    navigator.clipboard?.writeText(accountNumber.replace(/\s+/g, ""));
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handlePinInput = (num) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + num;
      setEnteredPin(nextPin);
      if (nextPin.length === 4) {
        setTimeout(() => {
          onResolveStepUp("APPROVED");
          setEnteredPin("");
        }, 300);
      }
    }
  };

  const handleDeletePin = () => {
    setEnteredPin((prev) => prev.slice(0, -1));
  };

  const handleTriggerBiometric = () => {
    setBioScanning(true);
    setTimeout(() => {
      setBioScanning(false);
      onResolveStepUp("APPROVED");
      setEnteredPin("");
    }, 1200);
  };

  const handlePickRecipient = (rec) => {
    setSelectedRecipient(rec);
    setCustomAmountStr(String(rec.defaultAmount));
    setPaymentDetails?.({
      merchant: rec.name,
      city: rec.city,
      amount: rec.defaultAmount,
      currency: "USD",
      merchantRisk: rec.risk,
      deviceTrust: rec.trust,
      distance: rec.dist
    });
    setActiveTab("input_amount");
  };

  const handleProceedToReview = () => {
    const parsed = parseFloat(customAmountStr) || 1.0;
    setPaymentDetails?.({
      merchant: selectedRecipient.name,
      city: selectedRecipient.city,
      amount: parsed,
      currency: transferCurrency,
      merchantRisk: selectedRecipient.risk,
      deviceTrust: selectedRecipient.trust,
      distance: selectedRecipient.dist
    });
    setActiveTab("review_transfer");
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#F4F7F6",
        color: "#1E293B",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        overflow: "hidden"
      }}
    >
      {/* ============================================================= */}
      {/* IN-APP REAL-TIME PUSH NOTIFICATION BANNER (Native Mobile Push)*/}
      {/* ============================================================= */}
      <AnimatePresence>
        {inAppPushNotification && (
          <motion.div
            initial={{ y: -60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -60, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            onClick={() => {
              if (activeGatewayResult?.status === "BLOCKED") {
                setActiveSheet("RECEIPT");
              } else if (activeGatewayResult?.action === "STEP_UP_REQUIRED") {
                setActiveSheet("STEP_UP");
              } else {
                setActiveSheet("RECEIPT");
              }
            }}
            style={{
              position: "absolute",
              top: 8,
              left: 10,
              right: 10,
              zIndex: 140,
              background: "rgba(10, 37, 64, 0.94)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              borderRadius: 16,
              padding: "10px 14px 11px",
              boxShadow:
                inAppPushNotification.type === "danger"
                  ? "0 12px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(239, 68, 68, 0.35)"
                  : inAppPushNotification.type === "warning"
                  ? "0 12px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(245, 158, 11, 0.35)"
                  : "0 12px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(119, 188, 31, 0.4)",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            {/* Native Header: Wing App Squircle Icon + App Name (Left) & 'now' (Right) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {/* Authentic Wing Bank App Squircle Icon */}
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: "#77BC1F",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.4)",
                    border: "0.5px solid rgba(255, 255, 255, 0.2)",
                    flexShrink: 0
                  }}
                >
                  <svg width={13} height={13} viewBox="0 0 100 100" fill="none">
                    <path
                      d="M20 58C24 40 40 28 60 26C46 32 38 42 36 52C44 42 58 36 78 34C64 42 54 52 52 64C62 54 74 50 82 50C70 62 56 70 38 70C28 70 22 65 20 58Z"
                      fill="#FFFFFF"
                    />
                    <path
                      d="M30 63C36 49 48 39 64 37C52 42 46 49 44 57C52 49 62 45 74 45C62 55 52 63 40 65C34 65 31 64 30 63Z"
                      fill="#002D62"
                    />
                  </svg>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255, 255, 255, 0.7)", letterSpacing: "-0.01em" }}>
                  {inAppPushNotification.badge || "Wing Bank"}
                </span>
              </div>
              <span style={{ fontSize: 10.5, color: "rgba(255, 255, 255, 0.45)", fontWeight: 500 }}>
                {inAppPushNotification.time || "now"}
              </span>
            </div>

            {/* Notification Title with subtle status dot */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background:
                    inAppPushNotification.type === "danger"
                      ? "#EF4444"
                      : inAppPushNotification.type === "warning"
                      ? "#F59E0B"
                      : "#77BC1F",
                  boxShadow: `0 0 6px ${
                    inAppPushNotification.type === "danger"
                      ? "rgba(239, 68, 68, 0.7)"
                      : inAppPushNotification.type === "warning"
                      ? "rgba(245, 158, 11, 0.7)"
                      : "rgba(119, 188, 31, 0.7)"
                  }`,
                  flexShrink: 0
                }}
              />
              <div style={{ fontSize: 12, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
                {inAppPushNotification.title}
              </div>
            </div>

            {/* Concise Message Body */}
            <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.78)", lineHeight: 1.35, paddingLeft: 12 }}>
              {inAppPushNotification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------- */}
      {/* SCROLLABLE MAIN CONTENT AREA                                 */}
      {/* ------------------------------------------------------------- */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          paddingBottom: 68, // Leave room for authentic bottom navigation bar
          scrollbarWidth: "none"
        }}
      >
        {/* ========================================================= */}
        {/* VIEW 1: AUTHENTIC WING BANK HOME SCREEN                   */}
        {/* ========================================================= */}
        {activeTab === "home" && (
          <div style={{ padding: "12px 16px 20px" }}>

            {/* Authentic Wing Bank Top App Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              {/* User Avatar & Greeting */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #77BC1F 0%, #4D7C0F 100%)",
                    padding: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: "50%",
                      background: "#002D62",
                      color: "#77BC1F",
                      fontWeight: 900,
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                  >
                    SS
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 800, color: "#002D62" }}>Hello, Sovanna!</span>
                    <span style={{ fontSize: 8.5, fontWeight: 800, background: "#FEF3C7", color: "#B45309", padding: "1px 5px", borderRadius: 4 }}>
                      GOLD
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B", fontWeight: 500 }}>
                    Wing Everyday Banking
                  </div>
                </div>
              </div>

              {/* Right Action Icons: Search & Bell */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("notifications")}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    color: "#002D62",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    position: "relative",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.04)"
                  }}
                  title="Notifications"
                >
                  <Bell style={{ width: 16, height: 16 }} />
                  <span style={{ position: "absolute", top: 7, right: 7, width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }} />
                </button>

                {/* Wing Bank Official Logo in Header */}
                <WingBankLogo size={32} showText={false} />
              </div>
            </div>

            {/* Persistent In-App SentinelPay AI Shield Status Pill */}
            <div
              onClick={() => setActiveTab("security_center")}
              style={{
                background: "rgba(37, 99, 235, 0.08)",
                border: "1px solid rgba(37, 99, 235, 0.22)",
                borderRadius: 12,
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 12,
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <BrandLogo variant="badge" emblemSize={14} color="var(--cobalt)" />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#1D4ED8" }}>
                  AI Risk Engine: Active (0.03s)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 9.5, color: "#64748B", fontWeight: 600 }}>Wing Core Shield</span>
                <ChevronRight style={{ width: 12, height: 12, color: "#64748B" }} />
              </div>
            </div>

            {/* ========================================================= */}
            {/* AUTHENTIC WING BANK PRIMARY ACCOUNT CARD                  */}
            {/* ========================================================= */}
            <div
              style={{
                background: "linear-gradient(135deg, #0A2540 0%, #001B30 100%)",
                borderRadius: 22,
                padding: "16px 18px",
                color: "#FFFFFF",
                boxShadow: "0 12px 28px rgba(10, 37, 64, 0.35)",
                marginBottom: 14,
                position: "relative",
                overflow: "hidden"
              }}
            >
              {/* Background Wing Stylized Wave Watermark */}
              <div
                style={{
                  position: "absolute",
                  right: -20,
                  top: -20,
                  width: 130,
                  height: 130,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(119, 188, 31, 0.25) 0%, transparent 70%)",
                  pointerEvents: "none"
                }}
              />

              {/* Card Top Row: Account Label & Eye */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, position: "relative", zIndex: 2 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ background: "#77BC1F", color: "#002D62", fontSize: 9.5, fontWeight: 900, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.04em" }}>
                    PRIMARY
                  </span>
                  <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>
                    Wing Payroll &bull; {accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    style={{ background: "none", border: "none", color: copiedAccount ? "#77BC1F" : "#94A3B8", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}
                    title="Copy Account Number"
                  >
                    {copiedAccount ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                  </button>
                </div>

                {/* Peek Balance Toggle & Currency Tabs */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {/* Currency Switcher Pill (USD / KHR) */}
                  <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.12)", borderRadius: 99, padding: 2 }}>
                    <button
                      type="button"
                      onClick={() => setActiveCurrencyMode("USD")}
                      style={{
                        padding: "2px 8px",
                        borderRadius: 99,
                        border: "none",
                        background: activeCurrencyMode === "USD" ? "#77BC1F" : "transparent",
                        color: activeCurrencyMode === "USD" ? "#002D62" : "#CBD5E1",
                        fontSize: 9.5,
                        fontWeight: 800,
                        cursor: "pointer"
                      }}
                    >
                      USD
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCurrencyMode("KHR")}
                      style={{
                        padding: "2px 8px",
                        borderRadius: 99,
                        border: "none",
                        background: activeCurrencyMode === "KHR" ? "#77BC1F" : "transparent",
                        color: activeCurrencyMode === "KHR" ? "#002D62" : "#CBD5E1",
                        fontSize: 9.5,
                        fontWeight: 800,
                        cursor: "pointer"
                      }}
                    >
                      KHR
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowBalance(!showBalance)}
                    style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: 3, display: "flex", alignItems: "center" }}
                  >
                    {showBalance ? <Eye style={{ width: 16, height: 16 }} /> : <EyeOff style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>

              {/* Balance Amount */}
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "var(--font-mono)", letterSpacing: "-0.03em", marginBottom: 3, position: "relative", zIndex: 2 }}>
                {showBalance ? (
                  activeCurrencyMode === "USD" ? (
                    `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  ) : (
                    `៛${khrBalance.toLocaleString("en-US")}`
                  )
                ) : (
                  "••••••••••"
                )}
              </div>

              {/* Secondary Currency Equivalent */}
              <div style={{ fontSize: 10.5, color: "rgba(255, 255, 255, 0.65)", marginBottom: 14, position: "relative", zIndex: 2 }}>
                {activeCurrencyMode === "USD" ? (
                  <>KHR Equivalent: <strong style={{ color: "#FFFFFF" }}>៛{khrBalance.toLocaleString()}</strong></>
                ) : (
                  <>USD Equivalent: <strong style={{ color: "#FFFFFF" }}>${balance.toFixed(2)}</strong></>
                )}
              </div>

              {/* 4 Signature Wing Action Pills inside Account Card */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, position: "relative", zIndex: 2 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("transfers_menu")}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "8px 4px",
                    borderRadius: 12,
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "background 120ms ease"
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#77BC1F", color: "#002D62", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ArrowUpRight style={{ width: 14, height: 14 }} strokeWidth={2.5} />
                  </div>
                  <span>Transfer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("my_qr")}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "8px 4px",
                    borderRadius: 12,
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "background 120ms ease"
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255, 255, 255, 0.2)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <QrCode style={{ width: 14, height: 14 }} strokeWidth={2.5} />
                  </div>
                  <span>My QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("scan")}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "8px 4px",
                    borderRadius: 12,
                    background: "rgba(119, 188, 31, 0.25)",
                    border: "1px solid rgba(119, 188, 31, 0.4)",
                    color: "#77BC1F",
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: "pointer",
                    transition: "background 120ms ease"
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "#77BC1F", color: "#002D62", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <QrCode style={{ width: 14, height: 14 }} strokeWidth={2.5} />
                  </div>
                  <span>Scan QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePickRecipient(WING_RECIPIENTS[0])}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "8px 4px",
                    borderRadius: 12,
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "background 120ms ease"
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255, 255, 255, 0.2)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Coins style={{ width: 14, height: 14 }} strokeWidth={2.5} />
                  </div>
                  <span>Cash Out</span>
                </button>
              </div>
            </div>

            {/* ========================================================= */}
            {/* AUTHENTIC WING 4x3 SERVICES GRID                          */}
            {/* ========================================================= */}
            <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "14px 12px", border: "1px solid #E2E8F0", marginBottom: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, padding: "0 4px" }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#002D62" }}>Everyday Services</span>
                <span style={{ fontSize: 10.5, color: "#77BC1F", fontWeight: 700, cursor: "pointer" }} onClick={() => setActiveTab("transfers_menu")}>
                  See All
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px 6px" }}>
                {[
                  { label: "Wing Transfer", icon: ArrowLeftRight, action: () => setActiveTab("transfers_menu"), highlight: true, color: "#77BC1F" },
                  { label: "WingPay Scan", icon: QrCode, action: () => setActiveTab("scan"), highlight: true, color: "#002D62" },
                  { label: "Phone Top-Up", icon: Smartphone, action: () => handlePickRecipient(WING_RECIPIENTS[0]), color: "#0284C7" },
                  { label: "Bills Payment", icon: Zap, action: () => handlePickRecipient(WING_RECIPIENTS[1]), color: "#D97706" },
                  { label: "Wing WeiLuy", icon: Coins, action: () => handlePickRecipient(WING_RECIPIENTS[0]), color: "#77BC1F" },
                  { label: "Wing Points", icon: Gift, action: () => handlePickRecipient(WING_RECIPIENTS[0]), color: "#EC4899" },
                  { label: "Wing Cards", icon: CreditCard, action: () => setActiveTab("cards"), color: "#6366F1" },
                  { label: "Quick Loan", icon: TrendingUp, action: () => handlePickRecipient(WING_RECIPIENTS[3]), color: "#059669" },
                  { label: "Term Deposit", icon: Building2, action: () => handlePickRecipient(WING_RECIPIENTS[1]), color: "#0EA5E9" },
                  { label: "WingFlex Bus", icon: Compass, action: () => handlePickRecipient(WING_RECIPIENTS[2]), color: "#8B5CF6" },
                  { label: "Free Bakong", icon: Layers, action: () => setActiveTab("transfers_menu"), color: "#E11928" },
                  { label: "Security", icon: ShieldCheck, action: () => setActiveTab("security_center"), color: "#2563EB" }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={item.action}
                      style={{
                        background: "transparent",
                        border: "none",
                        padding: "4px 2px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer"
                      }}
                    >
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 14,
                          background: item.highlight ? "rgba(119, 188, 31, 0.15)" : "#F8FAFC",
                          border: `1px solid ${item.highlight ? "rgba(119, 188, 31, 0.3)" : "#E2E8F0"}`,
                          color: item.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "transform 100ms ease"
                        }}
                      >
                        <Icon style={{ width: 20, height: 20 }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#334155", textAlign: "center", lineHeight: 1.2 }}>
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Jib Jib Banking Buddy Interactive Banner */}
            <div
              style={{
                background: "linear-gradient(135deg, #FEF9C3 0%, #FEF08A 100%)",
                borderRadius: 16,
                padding: "12px 14px",
                border: "1px solid #FDE047",
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 14,
                boxShadow: "0 2px 8px rgba(253, 224, 71, 0.2)"
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#77BC1F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#002D62",
                  fontWeight: 900,
                  fontSize: 16,
                  flexShrink: 0
                }}
              >
                <ShieldCheck style={{ width: 18, height: 18, color: "#002D62" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#854D0E" }}>
                  Jib Jib Banking Buddy
                </div>
                <div style={{ fontSize: 10, color: "#713F12", lineHeight: 1.3 }}>
                  SentinelPay AI is actively screening all Bakong KHQR payments for zero-fraud security.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("security_center")}
                style={{
                  padding: "5px 10px",
                  borderRadius: 99,
                  background: "#002D62",
                  color: "#77BC1F",
                  border: "none",
                  fontSize: 9.5,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Check
              </button>
            </div>

            {/* SentinelPay AI Real-Time Protection Card */}
            <div
              onClick={() => setActiveTab("security_center")}
              style={{
                background: "#FFFFFF",
                borderRadius: 16,
                padding: "12px 14px",
                border: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
                cursor: "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(37, 99, 235, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <EmblemMark size={20} color="var(--cobalt)" />
                </div>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 800, color: "#0F172A" }}>
                    SentinelPay Risk Engine
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B" }}>
                    Connected to Wing Tenant API &bull; 99.8% ML Accuracy
                  </div>
                </div>
              </div>
              <ChevronRight style={{ width: 16, height: 16, color: "#94A3B8" }} />
            </div>

            {/* Recent Activity / Passbook Quick Preview */}
            <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "14px 14px", border: "1px solid #E2E8F0" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#002D62" }}>Recent Transactions</span>
                <span
                  style={{ fontSize: 10.5, color: "#77BC1F", fontWeight: 700, cursor: "pointer" }}
                  onClick={() => setActiveTab("history")}
                >
                  View All
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentTransactions.slice(0, 3).map((tx, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedTxForDetail(tx)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "8px 6px",
                      borderRadius: 10,
                      cursor: "pointer",
                      borderBottom: idx < 2 ? "1px solid #F1F5F9" : "none"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          background: tx.status === "BLOCKED" ? "#FEE2E2" : "#DCFCE7",
                          color: tx.status === "BLOCKED" ? "#EF4444" : "#16A34A",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {tx.status === "BLOCKED" ? <ShieldAlert style={{ width: 16, height: 16 }} /> : <ArrowUpRight style={{ width: 16, height: 16 }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#0F172A" }}>
                          {tx.transaction_token}
                        </div>
                        <div style={{ fontSize: 9.5, color: "#64748B" }}>
                          {tx.created_at || "Today"} &bull; {tx.payment_method || "KHQR"}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--font-mono)", color: tx.status === "BLOCKED" ? "#DC2626" : "#0F172A" }}>
                        {tx.status === "BLOCKED" ? "$0.00" : `-$${parseFloat(tx.amount || 0).toFixed(2)}`}
                      </div>
                      <span
                        style={{
                          fontSize: 8.5,
                          fontWeight: 800,
                          padding: "1px 5px",
                          borderRadius: 4,
                          background: tx.status === "BLOCKED" ? "#FEE2E2" : "#DCFCE7",
                          color: tx.status === "BLOCKED" ? "#B91C1C" : "#16A34A"
                        }}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: AUTHENTIC WINGPAY KHQR SCANNER                    */}
        {/* ========================================================= */}
        {activeTab === "scan" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#000000", color: "#FFFFFF", padding: "14px 16px 20px" }}>
            {/* Scanner Top Bar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255, 255, 255, 0.2)", border: "none", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 20, height: 20 }} />
              </button>
              <div style={{ fontSize: 15, fontWeight: 800 }}>WingPay &bull; Scan KHQR</div>
              <button
                type="button"
                onClick={() => setFlashOn(!flashOn)}
                style={{ width: 34, height: 34, borderRadius: "50%", background: flashOn ? "#77BC1F" : "rgba(255, 255, 255, 0.2)", border: "none", color: flashOn ? "#002D62" : "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <Flashlight style={{ width: 17, height: 17 }} />
              </button>
            </div>

            {/* Camera Viewfinder Simulation */}
            <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              {/* KHQR Viewfinder Box */}
              <div
                style={{
                  width: 220,
                  height: 220,
                  border: "2px solid rgba(119, 188, 31, 0.6)",
                  borderRadius: 20,
                  position: "relative",
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)"
                }}
              >
                {/* 4 Corner Markers */}
                <div style={{ position: "absolute", top: -2, left: -2, width: 24, height: 24, borderTop: "4px solid #77BC1F", borderLeft: "4px solid #77BC1F", borderTopLeftRadius: 18 }} />
                <div style={{ position: "absolute", top: -2, right: -2, width: 24, height: 24, borderTop: "4px solid #77BC1F", borderRight: "4px solid #77BC1F", borderTopRightRadius: 18 }} />
                <div style={{ position: "absolute", bottom: -2, left: -2, width: 24, height: 24, borderBottom: "4px solid #77BC1F", borderLeft: "4px solid #77BC1F", borderBottomLeftRadius: 18 }} />
                <div style={{ position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderBottom: "4px solid #77BC1F", borderRight: "4px solid #77BC1F", borderBottomRightRadius: 18 }} />

                {/* Animated Green Laser Scanner Line */}
                <motion.div
                  animate={{ y: [10, 200, 10] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{
                    position: "absolute",
                    left: 6,
                    right: 6,
                    height: 2.5,
                    background: "linear-gradient(90deg, transparent, #77BC1F, transparent)",
                    boxShadow: "0 0 10px #77BC1F"
                  }}
                />

                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <QrCode style={{ width: 64, height: 64, color: "rgba(255, 255, 255, 0.15)" }} />
                </div>
              </div>

              <div style={{ marginTop: 18, fontSize: 11.5, color: "rgba(255, 255, 255, 0.8)", textAlign: "center", display: "flex", alignItems: "center", gap: 6 }}>
                <BrandLogo variant="badge" emblemSize={12} inverted color="#77BC1F" />
                <span>Align any Bakong KHQR code in frame</span>
              </div>
            </div>

            {/* Quick Demo Merchant Picker */}
            <div style={{ background: "rgba(255, 255, 255, 0.1)", borderRadius: 16, padding: "12px", backdropFilter: "blur(10px)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#77BC1F", marginBottom: 8 }}>
                Or select demo merchant QR to scan:
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {WING_RECIPIENTS.map((rec, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handlePickRecipient(rec)}
                    style={{
                      background: "rgba(255, 255, 255, 0.12)",
                      border: "1px solid rgba(255, 255, 255, 0.18)",
                      borderRadius: 10,
                      padding: "8px 10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      color: "#FFFFFF",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700 }}>{rec.name}</div>
                      <div style={{ fontSize: 9.5, color: "rgba(255, 255, 255, 0.6)" }}>{rec.category} &bull; {rec.city}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#77BC1F", fontFamily: "var(--font-mono)" }}>
                      ${rec.defaultAmount.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: WING TRANSFERS MENU                               */}
        {/* ========================================================= */}
        {activeTab === "transfers_menu" && (
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#1E293B", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#002D62" }}>Wing Transfers</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { title: "Wing to Wing Transfer", desc: "Instant zero-fee transfer to any Wing phone or account", icon: ArrowLeftRight, action: () => setActiveTab("select_recipient"), highlight: true },
                { title: "Local Bank & Bakong KHQR", desc: "Instant transfer across 40+ Cambodian banks", icon: Layers, action: () => setActiveTab("select_recipient") },
                { title: "Wing WeiLuy (Cash Express)", desc: "Code-based cash pick-up at 10,000+ Wing Agents", icon: Coins, action: () => setActiveTab("select_recipient") },
                { title: "Scan Merchant KHQR", desc: "Scan to pay with Wing zero-fee cashback", icon: QrCode, action: () => setActiveTab("scan") }
              ].map((opt, i) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={opt.action}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E2E8F0",
                      borderRadius: 16,
                      padding: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      color: "#1E293B",
                      cursor: "pointer",
                      textAlign: "left",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                    }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: opt.highlight ? "rgba(119, 188, 31, 0.15)" : "#F1F5F9", color: opt.highlight ? "#77BC1F" : "#002D62", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon style={{ width: 18, height: 18 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0F172A" }}>{opt.title}</div>
                      <div style={{ fontSize: 10.5, color: "#64748B" }}>{opt.desc}</div>
                    </div>
                    <ChevronRight style={{ width: 16, height: 16, color: "#94A3B8" }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: SELECT RECIPIENT                                  */}
        {/* ========================================================= */}
        {activeTab === "select_recipient" && (
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setActiveTab("transfers_menu")}
                style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#1E293B", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#002D62" }}>Choose Recipient</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {WING_RECIPIENTS.map((rec, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePickRecipient(rec)}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 14,
                    padding: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textAlign: "left",
                    cursor: "pointer",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
                  }}
                >
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "rgba(119, 188, 31, 0.15)", color: "#77BC1F", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Store style={{ width: 18, height: 18 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0F172A" }}>{rec.name}</div>
                    <div style={{ fontSize: 10, color: "#64748B" }}>{rec.bank} &bull; {rec.account}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#77BC1F", background: "#F0FDF4", padding: "3px 8px", borderRadius: 6 }}>
                      Select
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: INPUT AMOUNT & WING KEYPAD                        */}
        {/* ========================================================= */}
        {activeTab === "input_amount" && (
          <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", minHeight: "100%", justifyContent: "space-between" }}>
            <div>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("select_recipient")}
                  style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#1E293B", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <ChevronLeft style={{ width: 18, height: 18 }} />
                </button>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#002D62" }}>Wing Transfer Amount</div>
              </div>

              {/* Beneficiary Info Card */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 14, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9.5, color: "#64748B", fontWeight: 600 }}>Beneficiary Payee</div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: "#002D62" }}>{selectedRecipient.name}</div>
                  <div style={{ fontSize: 10, color: "#77BC1F", fontFamily: "var(--font-mono)" }}>{selectedRecipient.account} &bull; {selectedRecipient.bank}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("select_recipient")}
                  style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", color: "#15803D", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                >
                  Change
                </button>
              </div>

              {/* Interactive Amount Box */}
              <div style={{ background: "#FFFFFF", border: "2px solid #77BC1F", borderRadius: 18, padding: "14px", textAlign: "center", marginBottom: 10, boxShadow: "0 4px 12px rgba(119, 188, 31, 0.12)" }}>
                {/* Currency Selector Pill */}
                <div style={{ display: "inline-flex", background: "#F1F5F9", borderRadius: 99, padding: 3, marginBottom: 6 }}>
                  {["USD", "KHR"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTransferCurrency(c)}
                      style={{
                        padding: "3px 12px",
                        borderRadius: 99,
                        border: "none",
                        background: transferCurrency === c ? "#77BC1F" : "transparent",
                        color: transferCurrency === c ? "#002D62" : "#64748B",
                        fontSize: 10.5,
                        fontWeight: 800,
                        cursor: "pointer"
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Amount Display with Blinking Cursor */}
                <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#002D62", margin: "2px 0" }}>
                  {transferCurrency === "USD" ? `$${customAmountStr}` : `៛${Math.round((parseFloat(customAmountStr) || 0) * 4100).toLocaleString()}`}
                  <span style={{ color: "#77BC1F", animation: "pulse 1s infinite" }}>|</span>
                </div>

                <div style={{ fontSize: 10, color: "#64748B" }}>
                  Available in Wing: <strong>${balance.toFixed(2)} USD</strong> (៛{khrBalance.toLocaleString()})
                </div>

                {/* Quick Amount Chips */}
                <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 8, flexWrap: "wrap" }}>
                  {["8.50", "50", "100", "500", "1500", "1800"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomAmountStr(preset)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 6,
                        background: customAmountStr === preset ? "#DCFCE7" : "#F8FAFC",
                        border: customAmountStr === preset ? "1px solid #77BC1F" : "1px solid #E2E8F0",
                        fontSize: 9.5,
                        fontWeight: 800,
                        color: customAmountStr === preset ? "#15803D" : "#334155",
                        cursor: "pointer"
                      }}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remark Field */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 12, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 10.5, color: "#64748B", fontWeight: 600 }}>Remark:</span>
                <input
                  type="text"
                  value={transferRemark}
                  onChange={(e) => setTransferRemark(e.target.value)}
                  style={{ background: "transparent", border: "none", outline: "none", color: "#0F172A", fontSize: 11, width: "100%" }}
                />
              </div>
            </div>

            {/* DOCKED AUTHENTIC MOBILE KEYPAD */}
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 8 }}>
              <MobileBankingKeypad
                onDigit={(digit) => {
                  setCustomAmountStr((prev) => {
                    if (prev === "0") return String(digit);
                    if (prev.includes(".") && prev.split(".")[1]?.length >= 2) return prev;
                    return prev + digit;
                  });
                }}
                onDecimal={() => {
                  if (!customAmountStr.includes(".")) {
                    setCustomAmountStr((prev) => prev + ".");
                  }
                }}
                onDelete={() => {
                  setCustomAmountStr((prev) => {
                    if (prev.length <= 1) return "0";
                    return prev.slice(0, -1);
                  });
                }}
                onSubmit={handleProceedToReview}
                mode="amount"
                theme="wing"
              />

              <button
                type="button"
                onClick={handleProceedToReview}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: 14,
                  background: "#77BC1F",
                  color: "#002D62",
                  border: "none",
                  fontSize: 13.5,
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <span>Continue to Review</span>
                <ChevronRight style={{ width: 16, height: 16 }} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 6: REVIEW TRANSFER & SENTINELPAY SHIELD CHECK        */}
        {/* ========================================================= */}
        {activeTab === "review_transfer" && (
          <div style={{ padding: "14px 16px 20px", display: "flex", flexDirection: "column", minHeight: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setActiveTab("input_amount")}
                style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#1E293B", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#002D62" }}>Confirm Wing Transfer</div>
            </div>

            {/* Settled Amount Card */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: "16px", textAlign: "center", marginBottom: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
              <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>Total Transfer Amount</div>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#002D62", margin: "4px 0" }}>
                ${parseFloat(customAmountStr || 0).toFixed(2)} USD
              </div>
              <div style={{ fontSize: 10.5, color: "#16A34A", fontWeight: 700 }}>
                Transfer Fee: $0.00 &bull; Instant Settlement
              </div>
            </div>

            {/* Transfer Details Breakdown */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: "14px", display: "flex", flexDirection: "column", gap: 9, fontSize: 11.5, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>To Beneficiary:</span>
                <strong style={{ color: "#002D62" }}>{selectedRecipient.name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Bank Rail:</span>
                <span>{selectedRecipient.bank} (Bakong KHQR)</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>From Wing Account:</span>
                <span>{accountNumber}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B" }}>Remark:</span>
                <span>{transferRemark}</span>
              </div>
            </div>

            {/* ALWAYS USE SENTINELPAY LOGO IN SIMULATOR */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(37, 99, 235, 0.03) 100%)",
                border: "1px solid rgba(37, 99, 235, 0.25)",
                borderRadius: 14,
                padding: "12px",
                marginBottom: 14
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <BrandLogo variant="horizontal" emblemSize={18} />
                <span style={{ fontSize: 9.5, fontWeight: 800, background: "#DBEAFE", color: "#1D4ED8", padding: "1px 6px", borderRadius: 4 }}>
                  Real-Time Screening
                </span>
              </div>
              <div style={{ fontSize: 10.5, color: "#334155", lineHeight: 1.4 }}>
                This transaction will be evaluated in real time by the SentinelPay XGBoost ML model &amp; TreeSHAP explainability engine.
              </div>
            </div>

            {error && (
              <div style={{ padding: "8px 10px", borderRadius: 8, background: "#FEE2E2", border: "1px solid #EF4444", color: "#DC2626", fontSize: 11, marginBottom: 10 }}>
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setShowPrimaryPin(true)}
              style={{
                marginTop: "auto",
                padding: "14px",
                borderRadius: 14,
                background: "#77BC1F",
                color: "#002D62",
                border: "none",
                fontSize: 14,
                fontWeight: 900,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
            >
              {isSubmitting ? (
                <>
                  <RotateCw style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                  <span>Screening via SentinelPay...</span>
                </>
              ) : (
                <>
                  <Lock style={{ width: 16, height: 16 }} />
                  <span>Confirm &amp; Pay ${parseFloat(customAmountStr || 0).toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 7: WING CARDS                                        */}
        {/* ========================================================= */}
        {activeTab === "cards" && (
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#1E293B", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#002D62" }}>Wing Cards</div>
            </div>

            <VirtualCreditCard
              cardholder={cardholderName}
              cardNumber="4111 •••• •••• 1092"
              expiry="07/28"
              cardType="VISA"
              status={cardFrozen ? "BLOCKED" : "ACTIVE"}
            />

            <div style={{ marginTop: 14, background: "#FFFFFF", borderRadius: 16, padding: "14px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#0F172A" }}>Freeze Card Instantly</div>
                  <div style={{ fontSize: 10, color: "#64748B" }}>Temporarily block all in-store and online payments</div>
                </div>
                <button
                  type="button"
                  onClick={() => setCardFrozen(!cardFrozen)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 99,
                    background: cardFrozen ? "#EF4444" : "#77BC1F",
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  {cardFrozen ? "Frozen" : "Active"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 8: WING PASSBOOK & HISTORY                           */}
        {/* ========================================================= */}
        {activeTab === "history" && (
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#1E293B", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#002D62" }}>Wing Passbook</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentTransactions.map((tx, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedTxForDetail(tx)}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid #E2E8F0",
                    borderRadius: 14,
                    padding: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    boxShadow: "0 2px 5px rgba(0,0,0,0.02)"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: tx.status === "BLOCKED" ? "#FEE2E2" : "#DCFCE7",
                        color: tx.status === "BLOCKED" ? "#EF4444" : "#16A34A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {tx.status === "BLOCKED" ? <ShieldAlert style={{ width: 18, height: 18 }} /> : <ArrowUpRight style={{ width: 18, height: 18 }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#0F172A" }}>{tx.transaction_token}</div>
                      <div style={{ fontSize: 10, color: "#64748B" }}>{tx.payment_method || "KHQR"} &bull; {tx.status}</div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12.5, fontWeight: 900, fontFamily: "var(--font-mono)", color: tx.status === "BLOCKED" ? "#DC2626" : "#0F172A" }}>
                      {tx.status === "BLOCKED" ? "$0.00" : `-$${parseFloat(tx.amount || 0).toFixed(2)}`}
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, color: tx.status === "BLOCKED" ? "#DC2626" : "#16A34A" }}>
                      Tap for receipt
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 9: SENTINELPAY SECURITY CENTER                       */}
        {/* ========================================================= */}
        {activeTab === "security_center" && (
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#1E293B", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#002D62" }}>Security &amp; Fraud Defense</div>
            </div>

            {/* ALWAYS USE SENTINELPAY LOGO IN SIMULATOR */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: "16px", marginBottom: 12, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <BrandLogo variant="horizontal" emblemSize={22} />
                <span style={{ fontSize: 10, fontWeight: 800, background: "#DCFCE7", color: "#16A34A", padding: "2px 8px", borderRadius: 6 }}>
                  CONNECTED
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#64748B", lineHeight: 1.5 }}>
                Wing Bank is integrated via tenant API key to SentinelPay's XGBoost ML &amp; TreeSHAP inference pipeline. Every transaction is pre-screened in sub-40 milliseconds before reaching the Bakong clearinghouse.
              </div>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 16, padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#002D62" }}>Core Shield Metrics</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                <span style={{ color: "#64748B" }}>Inference Model:</span>
                <strong style={{ fontFamily: "var(--font-mono)" }}>XGBoost v2.1.0</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                <span style={{ color: "#64748B" }}>SHAP Explainer:</span>
                <strong style={{ color: "#2563EB" }}>TreeSHAP Real-time</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5 }}>
                <span style={{ color: "#64748B" }}>Adaptive 2FA:</span>
                <span style={{ color: "#16A34A", fontWeight: 700 }}>OTP &bull; Biometric &bull; Hard Block</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 10: MY QR (RECEIVE MONEY)                            */}
        {/* ========================================================= */}
        {activeTab === "my_qr" && (
          <div style={{ padding: "14px 16px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#1E293B", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#002D62" }}>My Bakong KHQR</div>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: 24, padding: "20px", textAlign: "center", border: "2px solid #77BC1F", boxShadow: "0 10px 30px rgba(119, 188, 31, 0.2)", maxWidth: 300, width: "100%" }}>
              <div style={{ marginBottom: 10 }}>
                <WingBankLogo size={28} showText={true} />
              </div>

              <div style={{ fontSize: 13, fontWeight: 800, color: "#002D62", marginBottom: 2 }}>
                {cardholderName}
              </div>
              <div style={{ fontSize: 10.5, color: "#64748B", fontFamily: "var(--font-mono)", marginBottom: 14 }}>
                {accountNumber} &bull; Wing Account
              </div>

              {/* QR Code Container */}
              <div style={{ padding: 14, background: "#FFFFFF", borderRadius: 16, border: "1px solid #E2E8F0", display: "inline-block", marginBottom: 14 }}>
                <QrCode style={{ width: 170, height: 170, color: "#002D62" }} />
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 14 }}>
                <BrandLogo variant="badge" emblemSize={14} color="var(--cobalt)" />
                <span style={{ fontSize: 10, color: "#64748B", fontWeight: 600 }}>Protected by SentinelPay AI</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <button
                  type="button"
                  style={{ padding: "8px", borderRadius: 10, background: "#F1F5F9", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                >
                  <Share2 style={{ width: 14, height: 14 }} />
                  <span>Share</span>
                </button>
                <button
                  type="button"
                  style={{ padding: "8px", borderRadius: 10, background: "#77BC1F", color: "#002D62", border: "none", fontSize: 11, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                >
                  <Download style={{ width: 14, height: 14 }} />
                  <span>Save QR</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ============================================================= */}
      {/* AUTHENTIC WING BANK 5-TAB DOCKED BOTTOM NAVIGATION BAR        */}
      {/* ============================================================= */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: "#FFFFFF",
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          zIndex: 100,
          boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.05)"
        }}
      >
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            color: activeTab === "home" ? "#77BC1F" : "#64748B",
            cursor: "pointer"
          }}
        >
          <Home style={{ width: 20, height: 20 }} />
          <span style={{ fontSize: 9.5, fontWeight: activeTab === "home" ? 800 : 600 }}>Home</span>
        </button>

        {/* Tab 2: Cards */}
        <button
          type="button"
          onClick={() => setActiveTab("cards")}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            color: activeTab === "cards" ? "#77BC1F" : "#64748B",
            cursor: "pointer"
          }}
        >
          <CreditCard style={{ width: 20, height: 20 }} />
          <span style={{ fontSize: 9.5, fontWeight: activeTab === "cards" ? 800 : 600 }}>Cards</span>
        </button>

        {/* Tab 3: ELEVATED WINGPAY SCAN QR BUTTON */}
        <div style={{ position: "relative", top: -14 }}>
          <button
            type="button"
            onClick={() => setActiveTab("scan")}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#77BC1F",
              border: "3px solid #FFFFFF",
              color: "#002D62",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
            title="Scan WingPay KHQR"
          >
            <QrCode style={{ width: 26, height: 26 }} strokeWidth={2.4} />
          </button>
        </div>

        {/* Tab 4: History / Passbook */}
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            color: activeTab === "history" ? "#77BC1F" : "#64748B",
            cursor: "pointer"
          }}
        >
          <Clock style={{ width: 20, height: 20 }} />
          <span style={{ fontSize: 9.5, fontWeight: activeTab === "history" ? 800 : 600 }}>History</span>
        </button>

        {/* Tab 5: Security / SentinelPay */}
        <button
          type="button"
          onClick={() => setActiveTab("security_center")}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            color: activeTab === "security_center" ? "#2563EB" : "#64748B",
            cursor: "pointer"
          }}
        >
          <ShieldCheck style={{ width: 20, height: 20 }} />
          <span style={{ fontSize: 9.5, fontWeight: activeTab === "security_center" ? 800 : 600 }}>Security</span>
        </button>
      </div>

      {/* ============================================================= */}
      {/* IN-APP IN-FLIGHT SENTINELPAY SCREENING MODAL                  */}
      {/* ============================================================= */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 130,
              background: "rgba(10, 37, 64, 0.94)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              textAlign: "center",
              color: "#FFFFFF"
            }}
          >
            <div style={{ position: "relative", width: 76, height: 76, marginBottom: 16 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  border: "3px solid rgba(119, 188, 31, 0.2)",
                  borderTopColor: "#77BC1F"
                }}
              />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <EmblemMark size={32} color="#77BC1F" leftFacetColor="#FFFFFF" />
              </div>
            </div>

            {/* ALWAYS USE SENTINELPAY LOGO */}
            <BrandLogo variant="horizontal" emblemSize={20} inverted color="#77BC1F" />

            <div style={{ fontSize: 16, fontWeight: 900, color: "#FFFFFF", marginTop: 10, marginBottom: 4 }}>
              Screening via SentinelPay...
            </div>
            <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.7)", maxWidth: 250, lineHeight: 1.4 }}>
              Evaluating real-time XGBoost ML and TreeSHAP feature contributions for Wing Bank.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* MODAL SHEET: PRIMARY 4-DIGIT PIN AUTHENTICATION               */}
      {/* ============================================================= */}
      <PrimaryPinModal
        isOpen={showPrimaryPin}
        onClose={() => setShowPrimaryPin(false)}
        onPinSuccess={() => {
          setShowPrimaryPin(false);
          onInitiatePayment();
        }}
        bankCode="WING"
        bankName="Wing Bank"
        amount={customAmountStr}
        currency={transferCurrency}
        recipientName={selectedRecipient?.name || "Merchant"}
        accountNumber={selectedRecipient?.account || "012 294 812"}
        isSubmitting={isSubmitting}
      />

      {/* ============================================================= */}
      {/* MODAL SHEET: WING STEP-UP VERIFICATION (MFA REAL SCENARIOS)   */}
      {/* ============================================================= */}
      <AnimatePresence>
        {activeSheet === "STEP_UP" && activeGatewayResult && (
          <BankStepUpChallenge
            bankName="Wing Bank"
            bankCode="WING"
            activeGatewayResult={activeGatewayResult}
            paymentDetails={paymentDetails}
            onResolveStepUp={onResolveStepUp}
            isVerifying={isVerifying}
            onClose={() => setActiveSheet("NONE")}
          />
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* MODAL SHEET: OFFICIAL WING BANK SUCCESS / DECLINE SCREENS     */}
      {/* ============================================================= */}
      <AnimatePresence>
        {activeSheet === "RECEIPT" && activeGatewayResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 120,
              background: "#F4F7F6",
              display: "flex",
              flexDirection: "column",
              padding: "16px 16px 20px",
              overflowY: "auto"
            }}
          >
            {activeGatewayResult.status === "BLOCKED" ? (
              /* --------------------------------------------------------- */
              /* SCREEN A: REAL WING BANK PAYMENT DECLINED SCREEN           */
              /* --------------------------------------------------------- */
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                {/* Declined Header */}
                <div style={{ textAlign: "center", padding: "6px 0 12px" }}>
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.8, 1.05, 1] }}
                    transition={{ duration: 0.3 }}
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: "50%",
                      background: "#FEE2E2",
                      border: "2.5px solid #EF4444",
                      color: "#EF4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px",
                      boxShadow: "0 0 24px rgba(239, 68, 68, 0.25)"
                    }}
                  >
                    <ShieldAlert style={{ width: 32, height: 32 }} strokeWidth={2.5} />
                  </motion.div>

                  <div style={{ fontSize: 17, fontWeight: 900, color: "#002D62", marginBottom: 3 }}>
                    Payment Declined
                  </div>
                  <div style={{ fontSize: 11, color: "#DC2626", fontWeight: 800 }}>
                    Funds Protected &bull; $0.00 Debited
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
                    Wing Bank Automated Security Interception
                  </div>
                </div>

                {/* Wing Incident Slip */}
                <div style={{ background: "#FFFFFF", border: "1px solid #FECACA", borderRadius: 18, padding: "14px", marginBottom: 12, boxShadow: "0 4px 12px rgba(239, 68, 68, 0.08)" }}>
                  <div style={{ textAlign: "center", paddingBottom: 10, borderBottom: "1px dashed #FECACA", marginBottom: 10 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Attempted Transfer
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#DC2626", marginTop: 2 }}>
                      ${parseFloat(activeGatewayResult.amount || 0).toFixed(2)} USD
                    </div>
                    <div style={{ display: "inline-block", marginTop: 4, background: "#FEE2E2", color: "#B91C1C", fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 4, border: "1px solid #FCA5A5" }}>
                      BLOCKED BY FRAUD POLICY &bull; FUNDS SAFE
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748B" }}>Incident Reference</span>
                      <strong style={{ fontFamily: "var(--font-mono)", color: "#002D62" }}>{activeGatewayResult.transaction_token}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748B" }}>Attempted Payee</span>
                      <strong style={{ color: "#002D62" }}>{paymentDetails?.merchant || selectedRecipient.name}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748B" }}>Origin Wing Account</span>
                      <span>{accountNumber} (Balance Untouched)</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748B" }}>Interception Reason</span>
                      <span style={{ color: "#DC2626", fontWeight: 700 }}>SentinelPay Critical Anomaly</span>
                    </div>
                  </div>

                  {/* SentinelPay AI Real-Time Attribution */}
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #FECACA" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <BrandLogo variant="badge" emblemSize={14} color="var(--cobalt)" />
                      <span style={{ fontSize: 9, fontWeight: 900, padding: "2px 6px", borderRadius: 4, background: "#FEE2E2", color: "#B91C1C" }}>
                        DEFENSE ACTIVE &bull; BLOCKED
                      </span>
                    </div>

                    <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "8px 10px", fontSize: 10.5, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>Anomaly Probability:</span>
                        <strong style={{ color: "#DC2626" }}>
                          {((activeGatewayResult.fraud_probability || 0.92) * 100).toFixed(1)}% &bull; CRITICAL
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>Device Trust Score:</span>
                        <span style={{ color: "#DC2626" }}>{((paymentDetails?.deviceTrust || 0.10) * 100).toFixed(0)}% (Untrusted)</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>Location Delta:</span>
                        <span>{paymentDetails?.distance || 850} km from usual zone</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decline Actions */}
                <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 7 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setCardFrozen(true);
                      setActiveSheet("NONE");
                      setActiveTab("cards");
                    }}
                    style={{
                      padding: "11px",
                      borderRadius: 14,
                      background: "#EF4444",
                      color: "#FFFFFF",
                      border: "none",
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    <Lock style={{ width: 15, height: 15 }} />
                    <span>Freeze Card &bull; Protect Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSheet("NONE");
                      setActiveTab("home");
                    }}
                    style={{
                      padding: "11px",
                      borderRadius: 14,
                      background: "#E2E8F0",
                      color: "#002D62",
                      border: "none",
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    Done &bull; Return to Wing Home
                  </button>
                </div>
              </div>
            ) : (
              /* --------------------------------------------------------- */
              /* SCREEN B: REAL WING BANK PAYMENT SUCCESS E-RECEIPT         */
              /* --------------------------------------------------------- */
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <div style={{ textAlign: "center", padding: "6px 0 10px" }}>
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.8, 1.1, 1] }}
                    transition={{ duration: 0.3 }}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "50%",
                      background: "#DCFCE7",
                      border: "2.5px solid #16A34A",
                      color: "#16A34A",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 8px",
                      boxShadow: "0 0 20px rgba(22, 163, 74, 0.25)"
                    }}
                  >
                    <Check style={{ width: 30, height: 30 }} strokeWidth={3} />
                  </motion.div>

                  <div style={{ fontSize: 16, fontWeight: 900, color: "#002D62" }}>
                    {activeGatewayResult.status === "RELEASED"
                      ? "Payment Released via OTP"
                      : "Wing Payment Successful"}
                  </div>
                  <div style={{ fontSize: 11, color: "#77BC1F", fontWeight: 800 }}>
                    Wing Bank (Cambodia) Plc. &bull; Bakong Switch
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
                    Official Digital Transaction Slip
                  </div>
                </div>

                {/* Official Wing Digital Slip */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: 18, padding: "14px", marginBottom: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
                  <div style={{ textAlign: "center", paddingBottom: 10, borderBottom: "1px dashed #E2E8F0", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>Settled Amount</div>
                    <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#002D62", marginTop: 2 }}>
                      ${parseFloat(activeGatewayResult.amount || 0).toFixed(2)} USD
                    </div>
                    <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 2 }}>
                      &asymp; ៛{(Math.round(parseFloat(activeGatewayResult.amount || 0) * 4100)).toLocaleString()} KHR
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748B" }}>Reference ID</span>
                      <strong style={{ fontFamily: "var(--font-mono)", color: "#002D62" }}>{activeGatewayResult.transaction_token}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748B" }}>To Merchant</span>
                      <strong style={{ color: "#002D62" }}>{paymentDetails?.merchant || selectedRecipient.name}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748B" }}>From Wing Account</span>
                      <span>{accountNumber}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748B" }}>Date &amp; Time</span>
                      <span>Today &bull; 9:41 AM</span>
                    </div>
                  </div>

                  {/* ALWAYS USE SENTINELPAY LOGO IN TRANSACTION CLEARANCE */}
                  <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed #E2E8F0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <BrandLogo variant="badge" emblemSize={14} color="var(--cobalt)" />
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          padding: "1px 6px",
                          borderRadius: 4,
                          background: "#DCFCE7",
                          color: "#16A34A"
                        }}
                      >
                        CLEARED &bull; APPROVED
                      </span>
                    </div>

                    <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "8px 10px", fontSize: 10.5, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>Fraud Probability:</span>
                        <strong style={{ color: "#16A34A" }}>
                          {((activeGatewayResult.fraud_probability || 0.04) * 100).toFixed(1)}% &bull; {activeGatewayResult.risk_level || "LOW"}
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>Device Trust:</span>
                        <span>{((paymentDetails?.deviceTrust || 0.98) * 100).toFixed(0)}%</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748B" }}>Radial Distance:</span>
                        <span>{paymentDetails?.distance || 1.2} km</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Share / Save / Done Buttons */}
                <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => alert("Wing transfer receipt copied to clipboard!")}
                      style={{ flex: 1, padding: "9px", borderRadius: 12, background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#002D62", fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    >
                      <Share2 style={{ width: 14, height: 14 }} />
                      <span>Share</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alert("Official Wing slip saved to photos!")}
                      style={{ flex: 1, padding: "9px", borderRadius: 12, background: "#FFFFFF", border: "1px solid #E2E8F0", color: "#002D62", fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    >
                      <Download style={{ width: 14, height: 14 }} />
                      <span>Save Slip</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveSheet("NONE");
                      setActiveTab("home");
                    }}
                    style={{
                      padding: "12px",
                      borderRadius: 14,
                      background: "#77BC1F",
                      color: "#002D62",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 900,
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(119, 188, 31, 0.4)"
                    }}
                  >
                    Done &bull; Back to Wing Home
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* IN-APP TRANSACTION DETAIL DRAWER (When tapping recent tx)     */}
      {/* ============================================================= */}
      <AnimatePresence>
        {selectedTxForDetail && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 120,
              background: "#F4F7F6",
              display: "flex",
              flexDirection: "column",
              padding: "16px 16px 20px",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#002D62" }}>Wing Transaction Slip</span>
              <button
                type="button"
                onClick={() => setSelectedTxForDetail(null)}
                style={{ background: "#E2E8F0", border: "none", color: "#1E293B", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "16px", border: "1px solid #E2E8F0", marginBottom: 14 }}>
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <WingBankLogo size={26} showText={true} />
                <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "var(--font-mono)", color: selectedTxForDetail.status === "BLOCKED" ? "#DC2626" : "#002D62", marginTop: 8 }}>
                  ${parseFloat(selectedTxForDetail.amount || 0).toFixed(2)} USD
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 11.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Reference Token:</span>
                  <strong style={{ fontFamily: "var(--font-mono)" }}>{selectedTxForDetail.transaction_token}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Status:</span>
                  <span style={{ color: selectedTxForDetail.status === "BLOCKED" ? "#DC2626" : "#16A34A", fontWeight: 800 }}>
                    {selectedTxForDetail.status}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Payment Rail:</span>
                  <span>{selectedTxForDetail.payment_method || "Bakong KHQR"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>AI Verification:</span>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <BrandLogo variant="badge" emblemSize={12} color="var(--cobalt)" />
                    <span style={{ color: "#16A34A", fontWeight: 700 }}>Cleared</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTxForDetail(null)}
              style={{ marginTop: "auto", padding: "12px", borderRadius: 14, background: "#77BC1F", color: "#002D62", border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
            >
              Close Receipt
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* NOTIFICATIONS DRAWER                                          */}
      {/* ============================================================= */}
      <AnimatePresence>
        {activeTab === "notifications" && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 120,
              background: "#F4F7F6",
              display: "flex",
              flexDirection: "column",
              padding: "16px 16px 20px",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#002D62" }}>Wing Bank Notifications</span>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "#E2E8F0", border: "none", color: "#1E293B", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { title: "SentinelPay AI Real-Time Protection Active", desc: "Your Wing Account is protected with sub-40ms XGBoost risk evaluation.", time: "Just now", highlight: true },
                { title: "KHQR Coffee Payment Cleared", desc: "Routine morning payment to Phnom Penh Coffee (BKK1) was auto-approved.", time: "Today, 08:45 AM" },
                { title: "Jib Jib Rewards Update", desc: "You earned 50 Wing Points on your last QR payment.", time: "Yesterday" }
              ].map((n, i) => (
                <div key={i} style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px", border: "1px solid #E2E8F0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 800, color: n.highlight ? "#002D62" : "#1E293B" }}>{n.title}</span>
                    <span style={{ fontSize: 9.5, color: "#94A3B8" }}>{n.time}</span>
                  </div>
                  <div style={{ fontSize: 10.5, color: "#64748B" }}>{n.desc}</div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("home")}
              style={{ marginTop: "auto", padding: "12px", borderRadius: 14, background: "#77BC1F", color: "#002D62", border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer" }}
            >
              Back to Home
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
