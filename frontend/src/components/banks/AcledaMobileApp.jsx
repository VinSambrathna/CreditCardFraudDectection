import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  CreditCard,
  QrCode,
  ArrowLeftRight,
  Banknote,
  TrendingUp,
  Bell,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  XCircle,
  RotateCw,
  Fingerprint,
  FileText,
  Phone,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  Store,
  Coins,
  Share2,
  Download,
  Search,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Flashlight,
  Image as ImageIcon,
  Home
} from "lucide-react";
import VirtualCreditCard from "../VirtualCreditCard";
import MobileBankingKeypad from "./MobileBankingKeypad";
import BrandLogo, { EmblemMark } from "../BrandLogo";
import BankStepUpChallenge from "./BankStepUpChallenge";
import PrimaryPinModal from "./PrimaryPinModal";

const ACLEDA_RECIPIENTS = [
  { name: "Phnom Penh Coffee (BKK1)", account: "010-82-102931-1", bank: "ACLEDA Bank", city: "Phnom Penh", defaultAmount: 8.50, risk: 0.08, trust: 0.98, dist: 1.2 },
  { name: "Cambodia Electronics Mall", account: "010-44-883192-2", bank: "ACLEDA Toanchet", city: "Siem Reap", defaultAmount: 1500.00, risk: 0.65, trust: 0.88, dist: 310.0 },
  { name: "Poipet Border Duty Free", account: "010-99-104928-1", bank: "Bakong Network", city: "Poipet", defaultAmount: 1800.00, risk: 0.92, trust: 0.10, dist: 850.0 },
  { name: "Lucky Supermarket (BKK)", account: "010-22-991823-1", bank: "ACLEDA Bank", city: "Phnom Penh", defaultAmount: 900.00, risk: 0.45, trust: 0.35, dist: 25.0 },
  { name: "Online Gaming & FX Liquidity", account: "010-18-338192-3", bank: "Bakong Rail", city: "Sihanoukville", defaultAmount: 2000.00, risk: 0.96, trust: 0.40, dist: 120.0 }
];

export default function AcledaMobileApp({
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
  // Navigation: "home" | "transfers_menu" | "select_recipient" | "input_amount" | "review_transfer" | "accounts" | "cards" | "payments" | "scan" | "my_qr" | "security_center"
  const [activeTab, setActiveTab] = useState("home");
  const [showBalance, setShowBalance] = useState(true);
  const [cardFrozen, setCardFrozen] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [enteredPin, setEnteredPin] = useState("");
  const [showPrimaryPin, setShowPrimaryPin] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [showShapDetails, setShowShapDetails] = useState(false);
  const [selectedTxForDetail, setSelectedTxForDetail] = useState(null);
  const [inAppPushNotification, setInAppPushNotification] = useState(null);
  const [bioScanning, setBioScanning] = useState(false);

  // Transfer Flow State
  const [selectedRecipient, setSelectedRecipient] = useState(ACLEDA_RECIPIENTS[0]);
  const [customAmountStr, setCustomAmountStr] = useState(paymentDetails?.amount ? String(paymentDetails.amount) : "8.50");
  const [transferRemark, setTransferRemark] = useState("ACLEDA Toanchet Payment");
  const [transferCurrency, setTransferCurrency] = useState(paymentDetails?.currency || "USD");

  const accountNumber = "0100-20-842192-1";
  const cardholderName = "VEASNA VANN";
  const khrBalance = Math.round(balance * 4100);

  // External scenario injection sync
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
      const match = ACLEDA_RECIPIENTS.find(r => r.name.toLowerCase().includes(paymentDetails.merchant.toLowerCase()));
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
      const merchantName = paymentDetails?.merchant || "Merchant";
      const formattedAmt = parseFloat(activeGatewayResult.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      if (isApproved) {
        notification = {
          type: "success",
          badge: "ACLEDA Toanchet",
          title: "Transfer Successful",
          message: `Sent $${formattedAmt} to ${merchantName} via Bakong KHQR.`,
          time: "now"
        };
      } else if (isStepUp) {
        notification = {
          type: "warning",
          badge: "ACLEDA Toanchet",
          title: "Verification Required",
          message: `Authorize $${formattedAmt} to ${merchantName} with PIN or Biometrics.`,
          time: "now"
        };
      } else if (isBlocked) {
        notification = {
          type: "danger",
          badge: "ACLEDA Toanchet",
          title: "Payment Blocked",
          message: `Suspicious payment of $${formattedAmt} at ${merchantName} was declined.`,
          time: "now"
        };
      }

      if (notification) {
        setInAppPushNotification(notification);
        const timer = setTimeout(() => setInAppPushNotification(null), 6500);
        return () => clearTimeout(timer);
      }
    }
  }, [activeGatewayResult, paymentDetails.merchant]);

  const handleCopyAccount = () => {
    navigator.clipboard?.writeText(accountNumber.replace(/[-\s]/g, ""));
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

  // Amount Keypad for Screen 2
  const handleAmountKeypad = (val) => {
    if (val === "clear") {
      setCustomAmountStr("0");
      return;
    }
    if (val === "del") {
      setCustomAmountStr((prev) => {
        if (prev.length <= 1) return "0";
        return prev.slice(0, -1);
      });
      return;
    }
    if (val === ".") {
      if (!customAmountStr.includes(".")) {
        setCustomAmountStr((prev) => prev + ".");
      }
      return;
    }
    setCustomAmountStr((prev) => {
      if (prev === "0") return String(val);
      if (prev.includes(".") && prev.split(".")[1]?.length >= 2) return prev;
      return prev + val;
    });
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
        background: "linear-gradient(180deg, #091F38 0%, #061527 40%, #030B14 100%)",
        color: "#FFFFFF",
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
              background: "rgba(6, 21, 39, 0.94)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              borderRadius: 16,
              padding: "10px 14px 11px",
              boxShadow:
                inAppPushNotification.type === "danger"
                  ? "0 12px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(239, 68, 68, 0.35)"
                  : inAppPushNotification.type === "warning"
                  ? "0 12px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(212, 175, 55, 0.4)"
                  : "0 12px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(16, 185, 129, 0.35)",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            {/* Native Header: ACLEDA App Squircle Icon + App Name (Left) & 'now' (Right) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {/* Authentic ACLEDA App Squircle Icon */}
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: "linear-gradient(135deg, #0D2D59 0%, #06182D 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.4)",
                    border: "0.5px solid rgba(212, 175, 55, 0.3)",
                    flexShrink: 0
                  }}
                >
                  <MythicBirdIcon size={11} color="#D4AF37" />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255, 255, 255, 0.7)", letterSpacing: "-0.01em" }}>
                  {inAppPushNotification.badge || "ACLEDA Toanchet"}
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
                      ? "#D4AF37"
                      : "#10B981",
                  boxShadow: `0 0 6px ${
                    inAppPushNotification.type === "danger"
                      ? "rgba(239, 68, 68, 0.7)"
                      : inAppPushNotification.type === "warning"
                      ? "rgba(212, 175, 55, 0.7)"
                      : "rgba(16, 185, 129, 0.7)"
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
          paddingBottom: 68,
          scrollbarWidth: "none"
        }}
      >
        {/* ========================================================= */}
        {/* VIEW 1: ACLEDA HOME                                       */}
        {/* ========================================================= */}
        {activeTab === "home" && (
          <div style={{ padding: "14px 16px 20px" }}>
            {/* Header: ACLEDA Logo with Golden Mythical Bird, Bell & Red QR */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <MythicBirdIcon size={18} color="#0B213F" />
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#FFFFFF", letterSpacing: "0.02em" }}>
                  អេស៊ីលីដា <span style={{ color: "#D4AF37", fontSize: 11 }}>ACLEDA BANK</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("accounts")}
                  style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255, 255, 255, 0.08)", border: "none", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}
                >
                  <Bell style={{ width: 17, height: 17 }} />
                  <span style={{ position: "absolute", top: 8, right: 8, width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }} />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("scan")}
                  style={{ width: 36, height: 36, borderRadius: 10, background: "#E11928", border: "none", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <QrCode style={{ width: 18, height: 18 }} />
                </button>
              </div>
            </div>

            {/* In-App SentinelPay AI Shield Status Pill */}
            <div
              onClick={() => setActiveTab("security_center")}
              style={{
                background: "rgba(212, 175, 55, 0.12)",
                border: "1px solid rgba(212, 175, 55, 0.3)",
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
                <BrandLogo variant="badge" emblemSize={14} color="#D4AF37" inverted />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#D4AF37", letterSpacing: "0.02em" }}>
                  AI Risk Engine: Active (0.03s)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 9.5, color: "rgba(255, 255, 255, 0.7)" }}>Toanchet 99.8%</span>
                <ChevronRight style={{ width: 11, height: 11, color: "rgba(255, 255, 255, 0.5)" }} />
              </div>
            </div>

            {/* User Greeting Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg, #D4AF37, #996515)", padding: 1.5, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#0B213F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#D4AF37" }}>
                  VV
                </div>
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#FFFFFF" }}>Hello, Veasna</div>
                <div style={{ fontSize: 10.5, color: "#94A3B8", display: "flex", alignItems: "center", gap: 2 }}>
                  <span>ACLEDA Toanchet Profile</span>
                  <ChevronRight style={{ width: 11, height: 11 }} />
                </div>
              </div>
            </div>

            {/* ACLEDA Total Balances Card with Circular Gauge */}
            <div
              style={{
                background: "linear-gradient(135deg, #0B2545 0%, #07192F 100%)",
                borderRadius: 18,
                padding: "16px",
                border: "1.5px solid rgba(212, 175, 55, 0.35)",
                boxShadow: "0 10px 24px rgba(0, 0, 0, 0.35)",
                marginBottom: 14,
                display: "grid",
                gridTemplateColumns: "86px 1fr",
                alignItems: "center",
                gap: 14
              }}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab("accounts")}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}
              >
                <div
                  style={{
                    width: 66,
                    height: 66,
                    borderRadius: "50%",
                    background: "conic-gradient(#D4AF37 0deg 260deg, rgba(255,255,255,0.1) 260deg 360deg)",
                    padding: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 12px rgba(212, 175, 55, 0.35)"
                  }}
                >
                  <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#081E38", display: "flex", alignItems: "center", justifyContent: "center", color: "#D4AF37" }}>
                    <Wallet style={{ width: 22, height: 22 }} />
                  </div>
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255, 255, 255, 0.85)", marginTop: 4 }}>Accounts</span>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8" }}>Total Balances</span>
                  <button type="button" onClick={() => setShowBalance(!showBalance)} style={{ background: "none", border: "none", color: "#D4AF37", cursor: "pointer", padding: 2 }}>
                    {showBalance ? <Eye style={{ width: 15, height: 15 }} /> : <EyeOff style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: "#CBD5E1" }}>KHR (៛)</span>
                  <span style={{ fontSize: 14, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#FFFFFF" }}>
                    {showBalance ? `៛ ${khrBalance.toLocaleString()}` : "••••••••"}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 10, color: "#D4AF37", fontWeight: 700 }}>USD ($)</span>
                  <span style={{ fontSize: 18, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#D4AF37" }}>
                    {showBalance ? `$ ${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••••••"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setActiveTab("payments")}
                style={{ background: "rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: "12px", display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(255, 255, 255, 0.12)", color: "#FFFFFF", cursor: "pointer" }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(212, 175, 55, 0.2)", color: "#D4AF37", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText style={{ width: 16, height: 16 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Payments</span>
              </button>

              <button
                type="button"
                onClick={() => handlePickRecipient(ACLEDA_RECIPIENTS[0])}
                style={{ background: "rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: "12px", display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(255, 255, 255, 0.12)", color: "#FFFFFF", cursor: "pointer" }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(0, 198, 255, 0.2)", color: "#38BDF8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Phone style={{ width: 16, height: 16 }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700 }}>Mobile Top-up</span>
              </button>
            </div>

            {/* ACLEDA 3x2 Main Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
              {[
                { label: "Cards", icon: CreditCard, action: () => setActiveTab("cards") },
                { label: "Scan QR", icon: QrCode, action: () => setActiveTab("scan"), highlight: true },
                { label: "Transfers", icon: ArrowLeftRight, action: () => setActiveTab("transfers_menu") },
                { label: "Deposits", icon: TrendingUp, action: () => setActiveTab("accounts") },
                { label: "Loans", icon: Coins, action: () => setActiveTab("accounts") },
                { label: "Quick Cash", icon: Banknote, action: () => handlePickRecipient(ACLEDA_RECIPIENTS[0]) }
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={item.action}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      borderRadius: 14,
                      padding: "14px 8px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      border: item.highlight ? "1.5px solid rgba(212, 175, 55, 0.5)" : "1px solid rgba(255, 255, 255, 0.08)",
                      color: "#FFFFFF",
                      cursor: "pointer"
                    }}
                  >
                    <Icon style={{ width: 22, height: 22, color: item.highlight ? "#D4AF37" : "#CBD5E1" }} />
                    <span style={{ fontSize: 11, fontWeight: 700 }}>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Exchange Rate Strip */}
            <div style={{ background: "rgba(255, 255, 255, 0.06)", borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingUp style={{ width: 14, height: 14, color: "#D4AF37" }} />
                <span style={{ fontSize: 11, color: "#CBD5E1" }}>Indicative FX Rate:</span>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 800, fontFamily: "var(--font-mono)", color: "#D4AF37" }}>
                1 USD = 4,100 KHR
              </span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: TRANSFERS MENU                                     */}
        {/* ========================================================= */}
        {activeTab === "transfers_menu" && (
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#D4AF37" }}>ACLEDA Transfers</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { title: "Transfer to ACLEDA Account", desc: "Instant transfer across ACLEDA Toanchet network", action: () => setActiveTab("select_recipient") },
                { title: "Transfer to Bakong KHQR", desc: "National switch to all Cambodian financial institutions", action: () => setActiveTab("select_recipient") },
                { title: "Cross-Border Remittance", desc: "Fast international payment rails", action: () => setActiveTab("select_recipient") }
              ].map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={opt.action}
                  style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(212, 175, 55, 0.2)", borderRadius: 14, padding: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#FFFFFF", cursor: "pointer", textAlign: "left" }}
                >
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#FFFFFF" }}>{opt.title}</div>
                    <div style={{ fontSize: 10.5, color: "#94A3B8" }}>{opt.desc}</div>
                  </div>
                  <ChevronRight style={{ width: 16, height: 16, color: "#D4AF37" }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: SELECT RECIPIENT                                   */}
        {/* ========================================================= */}
        {activeTab === "select_recipient" && (
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setActiveTab("transfers_menu")}
                style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#D4AF37" }}>Select Payee</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ACLEDA_RECIPIENTS.map((rec, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePickRecipient(rec)}
                  style={{ background: "rgba(255, 255, 255, 0.08)", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 14, padding: "12px", display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer" }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(212, 175, 55, 0.2)", color: "#D4AF37", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Store style={{ width: 18, height: 18 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "#FFFFFF" }}>{rec.name}</div>
                    <div style={{ fontSize: 10.5, color: "#94A3B8" }}>{rec.bank} &bull; {rec.account}</div>
                  </div>
                  <div style={{ textAlign: "right", color: "#D4AF37", fontSize: 11, fontWeight: 800 }}>
                    Select
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: INPUT AMOUNT & KEYPAD                              */}
        {/* ========================================================= */}
        {activeTab === "input_amount" && (
          <div style={{ padding: "14px 16px 16px", display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
            <div>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("select_recipient")}
                  style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <ChevronLeft style={{ width: 18, height: 18 }} />
                </button>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#D4AF37" }}>ACLEDA Transfer</div>
              </div>

              {/* Payee Info */}
              <div style={{ background: "rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, border: "1px solid rgba(212, 175, 55, 0.15)" }}>
                <div>
                  <div style={{ fontSize: 9.5, color: "#94A3B8" }}>To Payee</div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: "#FFFFFF" }}>{selectedRecipient.name}</div>
                  <div style={{ fontSize: 9.5, color: "#D4AF37", fontFamily: "var(--font-mono)" }}>{selectedRecipient.account} &bull; {selectedRecipient.bank}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("select_recipient")}
                  style={{ background: "rgba(212, 175, 55, 0.15)", border: "1px solid rgba(212, 175, 55, 0.3)", color: "#D4AF37", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                >
                  Change
                </button>
              </div>

              {/* Interactive Amount Box */}
              <div style={{ background: "rgba(255, 255, 255, 0.06)", border: "1.5px solid rgba(212, 175, 55, 0.4)", borderRadius: 16, padding: "12px 14px", textAlign: "center", marginBottom: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                {/* Currency Selector Pill */}
                <div style={{ display: "inline-flex", background: "rgba(255, 255, 255, 0.1)", borderRadius: 99, padding: 3, marginBottom: 4 }}>
                  {["USD", "KHR"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTransferCurrency(c)}
                      style={{
                        padding: "3px 12px",
                        borderRadius: 99,
                        border: "none",
                        background: transferCurrency === c ? "#D4AF37" : "transparent",
                        color: transferCurrency === c ? "#091F38" : "#94A3B8",
                        fontSize: 10.5,
                        fontWeight: 800,
                        cursor: "pointer"
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Amount Display */}
                <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#D4AF37", margin: "2px 0" }}>
                  {transferCurrency === "USD" ? `$${customAmountStr}` : `៛${Math.round((parseFloat(customAmountStr) || 0) * 4100).toLocaleString()}`}
                  <span style={{ color: "#D4AF37", opacity: 0.8 }}>|</span>
                </div>

                <div style={{ fontSize: 10, color: "#94A3B8" }}>
                  Available: <strong>${balance.toFixed(2)} USD</strong> (៛{khrBalance.toLocaleString()})
                </div>

                {/* Quick Amount Chips */}
                <div style={{ display: "flex", gap: 5, justifyContent: "center", marginTop: 8 }}>
                  {["8.50", "50", "100", "500", "1500", "1800"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomAmountStr(preset)}
                      style={{
                        padding: "3px 7px",
                        borderRadius: 6,
                        background: customAmountStr === preset ? "rgba(212, 175, 55, 0.25)" : "rgba(255, 255, 255, 0.08)",
                        border: customAmountStr === preset ? "1px solid #D4AF37" : "1px solid rgba(255, 255, 255, 0.12)",
                        fontSize: 9.5,
                        fontWeight: 800,
                        color: customAmountStr === preset ? "#D4AF37" : "#CBD5E1",
                        cursor: "pointer"
                      }}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Remark Field */}
              <div style={{ background: "rgba(255, 255, 255, 0.08)", borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10.5, color: "#94A3B8" }}>Remark:</span>
                <input
                  type="text"
                  value={transferRemark}
                  onChange={(e) => setTransferRemark(e.target.value)}
                  style={{ background: "transparent", border: "none", outline: "none", color: "#FFFFFF", fontSize: 11, width: "100%" }}
                />
              </div>
            </div>

            {/* DOCKED AUTHENTIC MOBILE KEYPAD */}
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
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
                theme="acleda"
              />

              <button
                type="button"
                onClick={handleProceedToReview}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 14,
                  background: "#D4AF37",
                  color: "#091F38",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 900,
                  cursor: "pointer"
                }}
              >
                Continue to Confirmation
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: REVIEW TRANSFER                                    */}
        {/* ========================================================= */}
        {activeTab === "review_transfer" && (
          <div style={{ padding: "14px 16px 20px", display: "flex", flexDirection: "column", minHeight: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setActiveTab("input_amount")}
                style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#D4AF37" }}>Confirm Payment</div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.06)", border: "1.5px solid rgba(212, 175, 55, 0.35)", borderRadius: 16, padding: "16px", textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#94A3B8", textTransform: "uppercase" }}>Total Settlement</div>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#D4AF37" }}>
                ${parseFloat(customAmountStr || 0).toFixed(2)} USD
              </div>
              <div style={{ fontSize: 10, color: "#10B981", fontWeight: 700, marginTop: 2 }}>
                Real-time SentinelPay Screening Active
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: "12px", display: "flex", flexDirection: "column", gap: 8, fontSize: 11.5, marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94A3B8" }}>Payee:</span>
                <strong>{selectedRecipient.name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94A3B8" }}>Bank:</span>
                <span>{selectedRecipient.bank}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#94A3B8" }}>From Account:</span>
                <span>{accountNumber}</span>
              </div>
            </div>

            {/* In-App SentinelPay Real-Time Protection Notice */}
            <div style={{ background: "rgba(212, 175, 55, 0.12)", border: "1px solid rgba(212, 175, 55, 0.3)", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BrandLogo variant="badge" emblemSize={14} color="#D4AF37" inverted />
                <span style={{ fontSize: 10.5, color: "rgba(255, 255, 255, 0.9)" }}>
                  Pre-screened via real-time XGBoost ML &amp; TreeSHAP
                </span>
              </div>
              <span style={{ fontSize: 9.5, color: "#D4AF37", fontWeight: 800, background: "rgba(212, 175, 55, 0.2)", padding: "1px 6px", borderRadius: 4 }}>
                ACTIVE
              </span>
            </div>

            {error && (
              <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#FCA5A5", fontSize: 11, marginBottom: 10 }}>
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
                background: "#D4AF37",
                color: "#0A2240",
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
                  <span>Authorize &amp; Pay ${parseFloat(customAmountStr || 0).toFixed(2)}</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 6: SCAN QR                                            */}
        {/* ========================================================= */}
        {activeTab === "scan" && (
          <div style={{ padding: "14px 16px 20px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#D4AF37" }}>ACLEDA Scan QR</div>
              <div style={{ width: 32 }} />
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => handlePickRecipient(ACLEDA_RECIPIENTS[0])}
              style={{
                width: 220,
                height: 220,
                margin: "0 auto 16px",
                position: "relative",
                background: "rgba(0, 0, 0, 0.4)",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
            >
              <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 10 }}>
                <QrCode style={{ width: 140, height: 140, color: "#0A2240" }} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#CBD5E1" }}>Tap viewfinder to scan sample merchant KHQR</div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 7: ACLEDA ACCOUNTS & PASSBOOK                        */}
        {/* ========================================================= */}
        {activeTab === "accounts" && (
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#D4AF37" }}>Accounts &amp; Passbook</div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentTransactions.map((tx, idx) => {
                const isBlocked = tx.status === "BLOCKED";
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedTxForDetail(tx)}
                    style={{ background: "rgba(255, 255, 255, 0.08)", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                  >
                    <div>
                      <div style={{ fontSize: 11.5, fontWeight: 700 }}>{tx.transaction_token}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8" }}>{tx.payment_method || "KHQR"} &bull; {tx.status}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, fontWeight: 800, fontFamily: "var(--font-mono)", color: isBlocked ? "#F87171" : "#D4AF37" }}>
                        {isBlocked ? "$0.00" : `-$${parseFloat(tx.amount || 0).toFixed(2)}`}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 8: ACLEDA CARDS                                      */}
        {activeTab === "cards" && (
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#D4AF37" }}>ACLEDA Cards</div>
            </div>

            <VirtualCreditCard
              cardholder={cardholderName}
              cardNumber="4024 •••• •••• 9921"
              expiry="12/28"
              cardType="VISA"
              status={cardFrozen ? "BLOCKED" : "ACTIVE"}
            />
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 9: ACLEDA SECURITY CENTER                            */}
        {activeTab === "security_center" && (
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#D4AF37" }}>ACLEDA Security Center</div>
            </div>

            <div style={{ background: "rgba(212, 175, 55, 0.15)", border: "1px solid rgba(212, 175, 55, 0.35)", borderRadius: 14, padding: "14px", color: "#FFFFFF" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#D4AF37", marginBottom: 4 }}>SentinelPay Core Protection</div>
              <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.85)", lineHeight: 1.4 }}>
                Synchronous multi-tenant AI fraud evaluation active on ACLEDA Bank core banking switch.
              </div>
            </div>
          </div>
        )}
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
              background: "rgba(6, 21, 39, 0.95)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              textAlign: "center"
            }}
          >
            <div style={{ position: "relative", width: 72, height: 72, marginBottom: 16 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  border: "3px solid rgba(212, 175, 55, 0.2)",
                  borderTopColor: "#D4AF37"
                }}
              />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck style={{ width: 28, height: 28, color: "#D4AF37" }} />
              </div>
            </div>

            <div style={{ fontSize: 16, fontWeight: 900, color: "#FFFFFF", marginBottom: 4 }}>
              Screening via SentinelPay...
            </div>
            <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.7)", maxWidth: 240, lineHeight: 1.4 }}>
              Verifying ACLEDA transaction against TreeSHAP explainability matrix.
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
        bankCode="ACLEDA"
        bankName="ACLEDA ToanChet"
        amount={customAmountStr}
        currency={transferCurrency}
        recipientName={selectedRecipient?.name || "Merchant"}
        accountNumber={selectedRecipient?.account || "0100-20-842192-1"}
        isSubmitting={isSubmitting}
      />

      {/* ============================================================= */}
      {/* MODAL SHEET: ACLEDA STEP-UP VERIFICATION (MFA REAL SCENARIOS) */}
      {/* ============================================================= */}
      <AnimatePresence>
        {activeSheet === "STEP_UP" && activeGatewayResult && (
          <BankStepUpChallenge
            bankName="ACLEDA Bank"
            bankCode="ACLEDA"
            activeGatewayResult={activeGatewayResult}
            paymentDetails={paymentDetails}
            onResolveStepUp={onResolveStepUp}
            isVerifying={isVerifying}
            onClose={() => setActiveSheet("NONE")}
          />
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* MODAL SHEET: OFFICIAL ACLEDA MOBILE SUCCESS / DECLINE SCREENS */}
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
              background: "#061527",
              display: "flex",
              flexDirection: "column",
              padding: "16px 16px 20px",
              overflowY: "auto"
            }}
          >
            {activeGatewayResult.status === "BLOCKED" ? (
              /* --------------------------------------------------------- */
              /* SCREEN A: REAL ACLEDA TOANCHET PAYMENT DECLINED SCREEN     */
              /* --------------------------------------------------------- */
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                {/* Declined Header Banner */}
                <div style={{ textAlign: "center", padding: "6px 0 12px" }}>
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.8, 1.05, 1] }}
                    transition={{ duration: 0.3 }}
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: "50%",
                      background: "rgba(239, 68, 68, 0.18)",
                      border: "2.5px solid #EF4444",
                      color: "#EF4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 10px",
                      boxShadow: "0 0 24px rgba(239, 68, 68, 0.35)"
                    }}
                  >
                    <ShieldAlert style={{ width: 32, height: 32 }} strokeWidth={2.5} />
                  </motion.div>

                  <div style={{ fontSize: 17, fontWeight: 900, color: "#FFFFFF", marginBottom: 3 }}>
                    Transfer Declined
                  </div>
                  <div style={{ fontSize: 11, color: "#F87171", fontWeight: 700 }}>
                    Funds Protected &bull; $0.00 Debited
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.55)", marginTop: 2 }}>
                    ACLEDA Toanchet Automated Fraud Interception
                  </div>
                </div>

                {/* ACLEDA Security Incident Slip */}
                <div style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(239, 68, 68, 0.35)", borderRadius: 18, padding: "14px", marginBottom: 12 }}>
                  <div style={{ textAlign: "center", paddingBottom: 10, borderBottom: "1px dashed rgba(239, 68, 68, 0.3)", marginBottom: 10 }}>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: "#F87171", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Attempted Transfer
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#EF4444", marginTop: 2 }}>
                      ${parseFloat(activeGatewayResult.amount || 0).toFixed(2)} USD
                    </div>
                    <div style={{ display: "inline-block", marginTop: 4, background: "rgba(239, 68, 68, 0.2)", color: "#FCA5A5", fontSize: 9.5, fontWeight: 800, padding: "2px 8px", borderRadius: 4, border: "1px solid rgba(239, 68, 68, 0.4)" }}>
                      BLOCKED BY FRAUD POLICY &bull; FUNDS SAFE
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94A3B8" }}>Incident Reference</span>
                      <strong style={{ fontFamily: "var(--font-mono)", color: "#FFFFFF" }}>{activeGatewayResult.transaction_token}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94A3B8" }}>Attempted Payee</span>
                      <strong style={{ color: "#FFFFFF" }}>{paymentDetails.merchant}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94A3B8" }}>Origin Account</span>
                      <span>{accountNumber} (Balance Untouched)</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94A3B8" }}>Interception Reason</span>
                      <span style={{ color: "#F87171", fontWeight: 700 }}>SentinelPay Critical Anomaly</span>
                    </div>
                  </div>

                  {/* SentinelPay AI Real-Time Attribution */}
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed rgba(239, 68, 68, 0.3)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <BrandLogo variant="badge" emblemSize={14} color="#D4AF37" inverted />
                      <span style={{ fontSize: 9, fontWeight: 900, padding: "2px 6px", borderRadius: 4, background: "#FEE2E2", color: "#B91C1C" }}>
                        DEFENSE ACTIVE &bull; BLOCKED
                      </span>
                    </div>

                    <div style={{ background: "rgba(0, 0, 0, 0.3)", borderRadius: 10, padding: "8px 10px", fontSize: 10.5, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#94A3B8" }}>Anomaly Probability:</span>
                        <strong style={{ color: "#EF4444" }}>
                          {((activeGatewayResult.fraud_probability || 0.92) * 100).toFixed(1)}% &bull; CRITICAL
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#94A3B8" }}>Device Trust Score:</span>
                        <span style={{ color: "#FCA5A5" }}>{((paymentDetails.deviceTrust || 0.10) * 100).toFixed(0)}% (Untrusted)</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#94A3B8" }}>Location Delta:</span>
                        <span>{paymentDetails.distance || 850} km from regular zone</span>
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
                      background: "rgba(212, 175, 55, 0.15)",
                      border: "1px solid rgba(212, 175, 55, 0.4)",
                      color: "#D4AF37",
                      fontSize: 12.5,
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    Done &bull; Return to ACLEDA Home
                  </button>
                </div>
              </div>
            ) : (
              /* --------------------------------------------------------- */
              /* SCREEN B: REAL ACLEDA TOANCHET PAYMENT SUCCESS E-RECEIPT  */
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
                      background: "rgba(16, 185, 129, 0.2)",
                      border: "2.5px solid #10B981",
                      color: "#10B981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 8px",
                      boxShadow: "0 0 20px rgba(16, 185, 129, 0.3)"
                    }}
                  >
                    <Check style={{ width: 30, height: 30 }} strokeWidth={3} />
                  </motion.div>

                  <div style={{ fontSize: 16, fontWeight: 900, color: "#FFFFFF" }}>
                    {activeGatewayResult.status === "RELEASED"
                      ? "Payment Released (Verified)"
                      : "ACLEDA Payment Successful"}
                  </div>
                  <div style={{ fontSize: 11, color: "#D4AF37", fontWeight: 700 }}>
                    Bakong KHQR National Switch &bull; Settled
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.55)", marginTop: 2 }}>
                    ACLEDA Bank Plc. Official Digital Slip
                  </div>
                </div>

                {/* ACLEDA Official Receipt Slip */}
                <div style={{ background: "rgba(255, 255, 255, 0.06)", border: "1px solid rgba(212, 175, 55, 0.35)", borderRadius: 16, padding: "14px", marginBottom: 12 }}>
                  <div style={{ textAlign: "center", paddingBottom: 10, borderBottom: "1px dashed rgba(212, 175, 55, 0.3)", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#94A3B8", textTransform: "uppercase" }}>Settled Amount</div>
                    <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#D4AF37", marginTop: 2 }}>
                      ${parseFloat(activeGatewayResult.amount || 0).toFixed(2)} USD
                    </div>
                    <div style={{ fontSize: 10.5, color: "rgba(255, 255, 255, 0.6)", marginTop: 2 }}>
                      &asymp; ៛{(Math.round(parseFloat(activeGatewayResult.amount || 0) * 4100)).toLocaleString()} KHR
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94A3B8" }}>Reference Token</span>
                      <strong style={{ fontFamily: "var(--font-mono)", color: "#FFFFFF" }}>{activeGatewayResult.transaction_token}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94A3B8" }}>Payee Beneficiary</span>
                      <strong style={{ color: "#FFFFFF" }}>{paymentDetails.merchant}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94A3B8" }}>Origin Account</span>
                      <span>{accountNumber} (Savings)</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#94A3B8" }}>Date &amp; Time</span>
                      <span>Today &bull; 9:41 AM</span>
                    </div>
                  </div>

                  {/* Practical In-App SentinelPay AI Verification Block */}
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed rgba(212, 175, 55, 0.3)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <BrandLogo variant="badge" emblemSize={14} color="#D4AF37" inverted />
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

                    <div style={{ background: "rgba(0, 0, 0, 0.25)", borderRadius: 8, padding: "8px", fontSize: 10.5, display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#94A3B8" }}>Risk Probability:</span>
                        <strong style={{ color: "#34D399" }}>
                          {((activeGatewayResult.fraud_probability || 0.04) * 100).toFixed(1)}% &bull; {activeGatewayResult.risk_level || "LOW"}
                        </strong>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#94A3B8" }}>Device Trust:</span>
                        <span>{((paymentDetails.deviceTrust || 0.98) * 100).toFixed(0)}%</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#94A3B8" }}>Radial Distance:</span>
                        <span>{paymentDetails.distance || 1.2} km</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Share / Save / Done Buttons */}
                <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => alert("Receipt copied to clipboard!")}
                      style={{
                        flex: 1,
                        padding: "9px",
                        borderRadius: 12,
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#FFFFFF",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
                    >
                      <Share2 style={{ width: 14, height: 14 }} />
                      <span>Share Receipt</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => alert("Official ACLEDA slip saved to photos!")}
                      style={{
                        flex: 1,
                        padding: "9px",
                        borderRadius: 12,
                        background: "rgba(255, 255, 255, 0.1)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        color: "#FFFFFF",
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6
                      }}
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
                      background: "#D4AF37",
                      color: "#0A2240",
                      border: "none",
                      fontSize: 13,
                      fontWeight: 900,
                      cursor: "pointer",
                      boxShadow: "0 4px 14px rgba(212, 175, 55, 0.4)"
                    }}
                  >
                    Done &bull; Back to ACLEDA Home
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* AUTHENTIC ACLEDA MOBILE 5-TAB DOCKED BOTTOM NAVIGATION BAR    */}
      {/* ============================================================= */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: "#061527",
          borderTop: "1px solid rgba(212, 175, 55, 0.25)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          zIndex: 100,
          boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.35)"
        }}
      >
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
            color: activeTab === "home" ? "#D4AF37" : "rgba(255, 255, 255, 0.6)",
            cursor: "pointer"
          }}
        >
          <Home style={{ width: 20, height: 20 }} />
          <span style={{ fontSize: 9.5, fontWeight: activeTab === "home" ? 800 : 600 }}>Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("accounts")}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            color: activeTab === "accounts" ? "#D4AF37" : "rgba(255, 255, 255, 0.6)",
            cursor: "pointer"
          }}
        >
          <Wallet style={{ width: 20, height: 20 }} />
          <span style={{ fontSize: 9.5, fontWeight: activeTab === "accounts" ? 800 : 600 }}>Accounts</span>
        </button>

        {/* Elevated Gold ACLEDA Scan QR Button */}
        <div style={{ position: "relative", top: -14 }}>
          <button
            type="button"
            onClick={() => setActiveTab("scan")}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#D4AF37",
              border: "3px solid #061527",
              color: "#0A2240",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
            title="ACLEDA Scan QR"
          >
            <QrCode style={{ width: 26, height: 26 }} strokeWidth={2.4} />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab("transfers_menu")}
          style={{
            background: "none",
            border: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 3,
            color: activeTab === "transfers_menu" ? "#D4AF37" : "rgba(255, 255, 255, 0.6)",
            cursor: "pointer"
          }}
        >
          <ArrowLeftRight style={{ width: 20, height: 20 }} />
          <span style={{ fontSize: 9.5, fontWeight: activeTab === "transfers_menu" ? 800 : 600 }}>Transfers</span>
        </button>

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
            color: activeTab === "security_center" ? "#D4AF37" : "rgba(255, 255, 255, 0.6)",
            cursor: "pointer"
          }}
        >
          <ShieldCheck style={{ width: 20, height: 20 }} />
          <span style={{ fontSize: 9.5, fontWeight: activeTab === "security_center" ? 800 : 600 }}>Security</span>
        </button>
      </div>
    </div>
  );
}

function MythicBirdIcon({ size = 18, color = "#000000" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z" />
    </svg>
  );
}
