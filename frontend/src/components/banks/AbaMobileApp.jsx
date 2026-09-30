import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  QrCode,
  ArrowLeftRight,
  Banknote,
  Grid,
  TrendingUp,
  PlusCircle,
  Bell,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  XCircle,
  RotateCw,
  Fingerprint,
  ChevronRight,
  ChevronLeft,
  Copy,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  Bus,
  Film,
  Globe,
  Flashlight,
  Image as ImageIcon,
  Search,
  Bookmark,
  Users,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Building,
  Store,
  Share2,
  Download,
  AlertTriangle,
  Info,
  Sliders,
  PhoneCall,
  CheckCheck,
  Home,
  CreditCard
} from "lucide-react";
import VirtualCreditCard from "../VirtualCreditCard";
import MobileBankingKeypad from "./MobileBankingKeypad";
import BrandLogo, { EmblemMark } from "../BrandLogo";
import BankStepUpChallenge from "./BankStepUpChallenge";
import PrimaryPinModal from "./PrimaryPinModal";

const DEMO_RECIPIENTS = [
  { name: "Phnom Penh Coffee (BKK1)", account: "001 294 812", bank: "ABA Bank", category: "Coffee & Food", city: "Phnom Penh", defaultAmount: 8.50, risk: 0.08, trust: 0.98, dist: 1.2 },
  { name: "Cambodia Electronics Mall", account: "000 551 920", bank: "ABA Bank", category: "Electronics", city: "Siem Reap", defaultAmount: 1500.00, risk: 0.65, trust: 0.88, dist: 310.0 },
  { name: "Poipet Border Duty Free", account: "010 882 104", bank: "Bakong Network", category: "Border Retail", city: "Poipet", defaultAmount: 1800.00, risk: 0.92, trust: 0.10, dist: 850.0 },
  { name: "Lucky Supermarket (BKK)", account: "002 918 331", bank: "ABA Bank", category: "Supermarket", city: "Phnom Penh", defaultAmount: 900.00, risk: 0.45, trust: 0.35, dist: 25.0 },
  { name: "Online Gaming & FX Liquidity", account: "019 332 990", bank: "Bakong Switch", category: "Gaming & FX", city: "Sihanoukville", defaultAmount: 2000.00, risk: 0.96, trust: 0.40, dist: 120.0 }
];

export default function AbaMobileApp({
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
  // Navigation stack: "home" | "transfers_menu" | "select_recipient" | "input_amount" | "review_transfer" | "scan" | "accounts" | "cards" | "my_qr" | "exchange_rate" | "security_center" | "notifications"
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

  // Selected Recipient for Transfer Flow
  const [selectedRecipient, setSelectedRecipient] = useState(DEMO_RECIPIENTS[0]);
  const [customAmountStr, setCustomAmountStr] = useState(paymentDetails?.amount ? String(paymentDetails.amount) : "8.50");
  const [transferRemark, setTransferRemark] = useState("Payment via ABA Mobile");
  const [transferCurrency, setTransferCurrency] = useState(paymentDetails?.currency || "USD");

  const accountNumber = "000 842 192";
  const cardholderName = "SOVANNA SOK";

  // Watch for scenario injection from outside (CONFIRM_PAYMENT)
  useEffect(() => {
    if (activeSheet === "CONFIRM_PAYMENT") {
      setCustomAmountStr(String(paymentDetails.amount || 8.50));
      setTransferCurrency(paymentDetails.currency || "USD");
      setActiveTab("review_transfer");
    }
  }, [activeSheet, paymentDetails]);

  // Sync incoming payment details if amount changes
  useEffect(() => {
    if (paymentDetails?.amount) {
      setCustomAmountStr(String(paymentDetails.amount));
    }
    if (paymentDetails?.currency) {
      setTransferCurrency(paymentDetails.currency);
    }
    if (paymentDetails?.merchant) {
      const match = DEMO_RECIPIENTS.find(r => r.name.toLowerCase().includes(paymentDetails.merchant.toLowerCase()));
      if (match) setSelectedRecipient(match);
    }
  }, [paymentDetails]);

  // Trigger simulated native In-App Push Notifications whenever SentinelPay evaluates a transaction
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
          badge: "ABA Mobile",
          title: "Transfer Successful",
          message: `Sent $${formattedAmt} to ${merchantName} via Bakong KHQR.`,
          time: "now"
        };
      } else if (isStepUp) {
        notification = {
          type: "warning",
          badge: "ABA Mobile",
          title: "Verification Required",
          message: `Authorize $${formattedAmt} to ${merchantName} with PIN or Face ID.`,
          time: "now"
        };
      } else if (isBlocked) {
        notification = {
          type: "danger",
          badge: "ABA Mobile",
          title: "Payment Blocked",
          message: `Suspicious payment of $${formattedAmt} at ${merchantName} was declined.`,
          time: "now"
        };
      }

      if (notification) {
        setInAppPushNotification(notification);
        const timer = setTimeout(() => {
          setInAppPushNotification(null);
        }, 6500);
        return () => clearTimeout(timer);
      }
    }
  }, [activeGatewayResult, paymentDetails.merchant]);

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

  // On-screen Numpad for Amount Input
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

  // Choose a recipient and proceed to Screen 2: Input Amount
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

  // Proceed from Screen 2 (Amount) to Screen 3 (Review Transfer)
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
        background: "linear-gradient(180deg, #004B6E 0%, #002D42 28%, #001B29 100%)",
        color: "#FFFFFF",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        overflow: "hidden"
      }}
    >
      {/* ============================================================= */}
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
              background: "rgba(10, 24, 38, 0.92)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              borderRadius: 16,
              padding: "10px 14px 11px",
              boxShadow:
                inAppPushNotification.type === "danger"
                  ? "0 12px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(239, 68, 68, 0.35)"
                  : inAppPushNotification.type === "warning"
                  ? "0 12px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(245, 158, 11, 0.35)"
                  : "0 12px 30px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(16, 185, 129, 0.35)",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            {/* Native Header: Bank App Squircle Icon + App Name (Left) & 'now' (Right) */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                {/* Authentic ABA App Squircle Icon */}
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 5,
                    background: "linear-gradient(135deg, #004D73 0%, #002235 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.4)",
                    border: "0.5px solid rgba(255, 255, 255, 0.15)",
                    flexShrink: 0
                  }}
                >
                  <span style={{ fontSize: 7.5, fontWeight: 900, color: "#00A3E0", letterSpacing: "-0.04em", fontFamily: "var(--font-sans)" }}>
                    ABA
                  </span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255, 255, 255, 0.7)", letterSpacing: "-0.01em" }}>
                  {inAppPushNotification.badge || "ABA Mobile"}
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
                      : "#10B981",
                  boxShadow: `0 0 6px ${
                    inAppPushNotification.type === "danger"
                      ? "rgba(239, 68, 68, 0.7)"
                      : inAppPushNotification.type === "warning"
                      ? "rgba(245, 158, 11, 0.7)"
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
      {/* SCROLLABLE MAIN SCREEN VIEWPORT                               */}
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
        {/* VIEW 1: ABA HOME DASHBOARD (Exact Match to User Image)    */}
        {/* ========================================================= */}
        {activeTab === "home" && (
          <div style={{ padding: "14px 16px 20px" }}>
            {/* Header: Avatar, Greeting, Notification & Red KHQR Scan */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Glowing Avatar */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #00C6FF, #0072FF)",
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
                      background: "#002235",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 14,
                      color: "#38BDF8"
                    }}
                  >
                    SS
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
                    Hello, Sovanna!
                  </div>
                  <div
                    onClick={() => setActiveTab("security_center")}
                    style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.65)", cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}
                  >
                    <span>View Profile</span>
                    <ChevronRight style={{ width: 12, height: 12 }} />
                  </div>
                </div>
              </div>

              {/* Header Right Icons: Notification Bell & Red Bakong/ABA Scan Icon */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("notifications")}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.12)",
                    border: "none",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    position: "relative"
                  }}
                  title="Notifications"
                >
                  <Bell style={{ width: 17, height: 17 }} />
                  <span style={{ position: "absolute", top: 8, right: 8, width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }} />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("scan")}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: "#E11928",
                    border: "none",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer"
                  }}
                  title="ABA Scan"
                >
                  <QrCode style={{ width: 18, height: 18 }} />
                </button>
              </div>
            </div>

            {/* Practical In-App SentinelPay AI Shield Status Pill */}
            <div
              onClick={() => setActiveTab("security_center")}
              style={{
                background: "rgba(0, 163, 224, 0.12)",
                border: "1px solid rgba(0, 163, 224, 0.3)",
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
                <BrandLogo variant="badge" emblemSize={14} color="#38BDF8" inverted />
                <span style={{ fontSize: 10.5, fontWeight: 700, color: "#38BDF8", letterSpacing: "0.02em" }}>
                  AI Risk Engine: Active (0.03s)
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 9.5, color: "rgba(255, 255, 255, 0.7)" }}>Core Defense 99.8%</span>
                <ChevronRight style={{ width: 11, height: 11, color: "rgba(255, 255, 255, 0.5)" }} />
              </div>
            </div>

            {/* Signature White ABA Account Balance Card (Exact Match to User Screenshot) */}
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 22,
                padding: "16px 18px",
                color: "#0F172A",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.22)",
                marginBottom: 14,
                position: "relative"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ background: "rgba(0, 163, 224, 0.12)", color: "#0284C7", fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 4, letterSpacing: "0.04em" }}>
                    Default
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#64748B" }}>Savings</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBalance(!showBalance)}
                  style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
                >
                  {showBalance ? <Eye style={{ width: 16, height: 16 }} /> : <EyeOff style={{ width: 16, height: 16 }} />}
                </button>
              </div>

              {/* Balance Display */}
              <div style={{ fontSize: 28, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#0F172A", letterSpacing: "-0.03em", marginBottom: 4 }}>
                {showBalance ? `$${balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "••••••••••"}
              </div>

              {/* Account Number with Copy */}
              <div
                role="button"
                tabIndex={0}
                onClick={handleCopyAccount}
                style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontFamily: "var(--font-mono)", color: "#64748B", marginBottom: 14, cursor: "pointer" }}
              >
                <span>{accountNumber}</span>
                {copiedAccount ? <Check style={{ width: 12, height: 12, color: "#10B981" }} /> : <Copy style={{ width: 12, height: 12 }} />}
              </div>

              {/* Two Signature ABA Action Pills: Receive Money & Send Money */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("my_qr")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "9px 12px",
                    borderRadius: 99,
                    background: "#E0F7FA",
                    border: "none",
                    color: "#00838F",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "transform 100ms ease"
                  }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#00838F", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ArrowDownLeft style={{ width: 12, height: 12 }} />
                  </div>
                  <span>Receive Money</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("transfers_menu")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "9px 12px",
                    borderRadius: 99,
                    background: "#FEE2E2",
                    border: "none",
                    color: "#B91C1C",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "transform 100ms ease"
                  }}
                >
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#B91C1C", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ArrowUpRight style={{ width: 12, height: 12 }} />
                  </div>
                  <span>Send Money</span>
                </button>
              </div>
            </div>

            {/* ABA Core 3x2 Grid (Exact Match to User Screenshot) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setActiveTab("accounts")}
                style={{ background: "#FFFFFF", borderRadius: 16, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", boxShadow: "0 6px 14px rgba(0,0,0,0.14)" }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(0, 163, 224, 0.12)", color: "#0096C7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 7 }}>
                  <AbaWalletIcon size={22} color="#0096C7" />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1E293B" }}>Accounts</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("cards")}
                style={{ background: "#FFFFFF", borderRadius: 16, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", boxShadow: "0 6px 14px rgba(0,0,0,0.14)" }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(6, 182, 212, 0.12)", color: "#0891B2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 7 }}>
                  <AbaCardIcon size={22} color="#0891B2" />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1E293B" }}>Cards</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("select_recipient")}
                style={{ background: "#FFFFFF", borderRadius: 16, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", boxShadow: "0 6px 14px rgba(0,0,0,0.14)" }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(16, 185, 129, 0.12)", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 7 }}>
                  <AbaPaymentIcon size={22} color="#059669" />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1E293B" }}>Payments</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("scan")}
                style={{ background: "#FFFFFF", borderRadius: 16, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", boxShadow: "0 6px 14px rgba(0,0,0,0.14)", position: "relative" }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(0, 163, 224, 0.14)", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 7 }}>
                  <QrCode style={{ width: 22, height: 22 }} />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1E293B" }}>ABA Scan</span>
                <span style={{ position: "absolute", top: 6, right: 6, background: "#EF4444", color: "#FFFFFF", fontSize: 8, fontWeight: 900, padding: "1px 4px", borderRadius: 4 }}>
                  %
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("transfers_menu")}
                style={{ background: "#FFFFFF", borderRadius: 16, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", boxShadow: "0 6px 14px rgba(0,0,0,0.14)" }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(14, 165, 233, 0.12)", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 7 }}>
                  <ArrowLeftRight style={{ width: 21, height: 21 }} />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1E293B" }}>Transfers</span>
              </button>

              <button
                type="button"
                onClick={() => handlePickRecipient(DEMO_RECIPIENTS[0])}
                style={{ background: "#FFFFFF", borderRadius: 16, padding: "14px 10px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", boxShadow: "0 6px 14px rgba(0,0,0,0.14)" }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(16, 185, 129, 0.12)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 7 }}>
                  <Banknote style={{ width: 22, height: 22 }} />
                </div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: "#1E293B" }}>E-cash</span>
              </button>
            </div>

            {/* Quick Pills (Exact Match to User Screenshot) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
              {[
                { label: "Services", icon: Grid, action: () => setActiveTab("security_center") },
                { label: "Exchange Rate", icon: TrendingUp, action: () => setActiveTab("exchange_rate") },
                { label: "New Account", icon: PlusCircle, action: () => setActiveTab("accounts") }
              ].map((btn, idx) => {
                const Icon = btn.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={btn.action}
                    style={{ background: "rgba(255, 255, 255, 0.12)", borderRadius: 12, padding: "8px 6px", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, border: "none", color: "#FFFFFF", fontSize: 10.5, fontWeight: 600, cursor: "pointer" }}
                  >
                    <Icon style={{ width: 13, height: 13, color: "#38BDF8" }} />
                    <span style={{ whiteSpace: "nowrap" }}>{btn.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Explore Services (Exact Match to User Screenshot) */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF" }}>Explore Services</span>
                <span onClick={() => setActiveTab("security_center")} style={{ fontSize: 11, color: "#38BDF8", fontWeight: 700, cursor: "pointer" }}>View All &gt;</span>
              </div>

              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
                {[
                  { name: "Ebook", color: "#F59E0B", icon: BookIcon },
                  { name: "SpaciaNet", color: "#3B82F6", icon: CubeIcon },
                  { name: "Domain .kh", color: "#06B6D4", icon: Globe },
                  { name: "Cinema", color: "#EC4899", icon: Film },
                  { name: "VET Express", color: "#10B981", icon: Bus }
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={i}
                      onClick={() => handlePickRecipient(DEMO_RECIPIENTS[i % DEMO_RECIPIENTS.length])}
                      style={{ minWidth: 62, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, cursor: "pointer" }}
                    >
                      <div style={{ width: 46, height: 46, borderRadius: 14, background: item.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", position: "relative" }}>
                        <Icon style={{ width: 22, height: 22 }} />
                      </div>
                      <span style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.8)", textAlign: "center" }}>{item.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* News & Promotions Banner (Exact Match to User Screenshot) */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#FFFFFF", marginBottom: 8 }}>News &amp; Promotions</div>
              <div style={{ background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 6px 16px rgba(0,0,0,0.2)" }}>
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: "#BAE6FD", textTransform: "uppercase" }}>BAKONG KHQR PROMO</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#FFFFFF" }}>Instant zero-fee payments</div>
                  <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.75)" }}>Scan any merchant nationwide</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("scan")}
                  style={{ background: "#FFFFFF", color: "#0369A1", border: "none", borderRadius: 8, padding: "6px 10px", fontSize: 10.5, fontWeight: 800, cursor: "pointer" }}
                >
                  Scan Now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: ABA TRANSFERS MENU                                */}
        {/* ========================================================= */}
        {activeTab === "transfers_menu" && (
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 900 }}>ABA<span style={{ color: "#EF4444" }}>'</span></span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Transfers</span>
              </div>
            </div>

            {/* Blue Banner with Two-way Circular Arrow */}
            <div style={{ background: "linear-gradient(135deg, #004D73 0%, #002D44 100%)", borderRadius: 16, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div style={{ maxWidth: 220 }}>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 3 }}>Transfers</div>
                <div style={{ fontSize: 10.5, color: "rgba(255, 255, 255, 0.7)", lineHeight: 1.3 }}>
                  Transfer money instantly via Bakong KHQR network with SentinelPay AI protection.
                </div>
              </div>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(0, 163, 224, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#38BDF8" }}>
                <ArrowLeftRight style={{ width: 22, height: 22 }} />
              </div>
            </div>

            {/* Transfer Categories List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { title: "Transfer to other ABA account", desc: "Free instant transfer to any ABA user", icon: ArrowLeftRight, color: "#EF4444", action: () => setActiveTab("select_recipient") },
                { title: "Transfer to Local Banks & Wallets", desc: "Bakong KHQR network across Cambodia", icon: Building, color: "#0284C7", action: () => setActiveTab("select_recipient") },
                { title: "Choose from Favorites", desc: "Transfer to friends from your favorite list", icon: Bookmark, color: "#64748B", action: () => setActiveTab("select_recipient") },
                { title: "Send money to ABA ATM's", desc: "Make cardless cash withdrawal at any ABA ATM", icon: Banknote, color: "#10B981", action: () => setActiveTab("select_recipient") },
                { title: "International Transfers", desc: "SWIFT, Ria, MoneyGram to 150+ countries", icon: Globe, color: "#EA580C", action: () => setActiveTab("select_recipient") }
              ].map((opt, i) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={opt.action}
                    style={{ background: "#FFFFFF", borderRadius: 14, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12, border: "none", color: "#0F172A", textAlign: "left", cursor: "pointer", boxShadow: "0 3px 10px rgba(0,0,0,0.12)" }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: `${opt.color}15`, color: opt.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 18, height: 18 }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1E293B" }}>{opt.title}</div>
                      <div style={{ fontSize: 10, color: "#64748B" }}>{opt.desc}</div>
                    </div>
                    <ChevronRight style={{ width: 14, height: 14, color: "#94A3B8" }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 3: CHOOSE RECIPIENT                                   */}
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
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 900 }}>ABA<span style={{ color: "#EF4444" }}>'</span></span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Choose Recipient</span>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Search style={{ width: 15, height: 15, color: "#94A3B8" }} />
              <input
                type="text"
                placeholder="Enter ABA account or Bakong phone..."
                style={{ border: "none", outline: "none", width: "100%", fontSize: 12, color: "#0F172A" }}
              />
            </div>

            <div style={{ fontSize: 11, fontWeight: 800, color: "#38BDF8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Saved &amp; Recent Payees
            </div>

            {/* List of Demo Recipients */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {DEMO_RECIPIENTS.map((rec, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handlePickRecipient(rec)}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: 14,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    border: "none",
                    textAlign: "left",
                    cursor: "pointer",
                    boxShadow: "0 3px 8px rgba(0,0,0,0.08)"
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0, 163, 224, 0.15)", color: "#0284C7", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                    <Store style={{ width: 18, height: 18 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0F172A" }}>{rec.name}</div>
                    <div style={{ fontSize: 10.5, color: "#64748B", fontFamily: "var(--font-mono)" }}>
                      {rec.bank} &bull; {rec.account}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#0284C7" }}>Select</div>
                    <div style={{ fontSize: 9.5, color: "#94A3B8" }}>{rec.city}</div>
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
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 900 }}>ABA<span style={{ color: "#EF4444" }}>'</span></span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Enter Amount</span>
                </div>
              </div>

              {/* Beneficiary Strip */}
              <div style={{ background: "rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 9.5, color: "rgba(255, 255, 255, 0.6)" }}>To Beneficiary</div>
                  <div style={{ fontSize: 12.5, fontWeight: 800, color: "#FFFFFF" }}>{selectedRecipient.name}</div>
                  <div style={{ fontSize: 9.5, color: "#38BDF8", fontFamily: "var(--font-mono)" }}>{selectedRecipient.account} &bull; {selectedRecipient.bank}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("select_recipient")}
                  style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                >
                  Change
                </button>
              </div>

              {/* Interactive Amount Box */}
              <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "12px 14px", textAlign: "center", color: "#0F172A", marginBottom: 8, boxShadow: "0 6px 16px rgba(0,0,0,0.15)" }}>
                {/* Currency Selector Pill */}
                <div style={{ display: "inline-flex", background: "#F1F5F9", borderRadius: 99, padding: 3, marginBottom: 4 }}>
                  {["USD", "KHR"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setTransferCurrency(c)}
                      style={{
                        padding: "3px 12px",
                        borderRadius: 99,
                        border: "none",
                        background: transferCurrency === c ? "#0284C7" : "transparent",
                        color: transferCurrency === c ? "#FFFFFF" : "#64748B",
                        fontSize: 10.5,
                        fontWeight: 800,
                        cursor: "pointer"
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {/* Amount Display with blinking cursor */}
                <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#0F172A", margin: "2px 0" }}>
                  {transferCurrency === "USD" ? `$${customAmountStr}` : `៛${Math.round((parseFloat(customAmountStr) || 0) * 4100).toLocaleString()}`}
                  <span style={{ color: "#00A3E0", opacity: 0.8 }}>|</span>
                </div>

                <div style={{ fontSize: 10, color: "#64748B" }}>
                  From Savings: <strong>${balance.toFixed(2)} USD</strong> available
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
                        background: customAmountStr === preset ? "rgba(0, 163, 224, 0.15)" : "#F1F5F9",
                        border: customAmountStr === preset ? "1px solid #00A3E0" : "1px solid #E2E8F0",
                        fontSize: 9.5,
                        fontWeight: 800,
                        color: customAmountStr === preset ? "#0284C7" : "#334155",
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
                <span style={{ fontSize: 10.5, color: "rgba(255, 255, 255, 0.6)" }}>Remark:</span>
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
                theme="aba"
              />

              <button
                type="button"
                onClick={handleProceedToReview}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: 14,
                  background: "#00A3E0",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Continue &bull; Review Transfer
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: REVIEW & CONFIRM TRANSFER                          */}
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
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 900 }}>ABA<span style={{ color: "#EF4444" }}>'</span></span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Review Transfer</span>
              </div>
            </div>

            {/* Bakong KHQR Ribbon */}
            <div style={{ background: "#E11928", borderRadius: 10, padding: "6px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: "#FFFFFF" }}>KHQR &bull; BAKONG TRANSFER</span>
              <span style={{ fontSize: 9.5, color: "#FFFFFF", background: "rgba(0,0,0,0.25)", padding: "1px 6px", borderRadius: 4 }}>NBC RAIL</span>
            </div>

            {/* Total Amount Box */}
            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "16px", textAlign: "center", color: "#0F172A", marginBottom: 12, boxShadow: "0 6px 16px rgba(0,0,0,0.15)" }}>
              <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", fontWeight: 700 }}>Transfer Settlement</div>
              <div style={{ fontSize: 32, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#0F172A" }}>
                ${parseFloat(customAmountStr || 0).toFixed(2)} <span style={{ fontSize: 14, color: "#64748B" }}>{transferCurrency}</span>
              </div>
              <div style={{ fontSize: 10.5, color: "#10B981", fontWeight: 700, marginTop: 2 }}>
                Fee: $0.00 &bull; Real-time SentinelPay Screening
              </div>
            </div>

            {/* Full Transfer Details */}
            <div style={{ background: "rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8, fontSize: 11.5, marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255, 255, 255, 0.65)" }}>
                <span>From Account</span>
                <strong style={{ color: "#FFFFFF" }}>{accountNumber} (Savings)</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255, 255, 255, 0.65)" }}>
                <span>To Beneficiary</span>
                <strong style={{ color: "#38BDF8" }}>{selectedRecipient.name}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255, 255, 255, 0.65)" }}>
                <span>Destination Bank</span>
                <strong style={{ color: "#FFFFFF" }}>{selectedRecipient.bank}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(255, 255, 255, 0.65)" }}>
                <span>Remark</span>
                <span style={{ color: "#FFFFFF" }}>{transferRemark}</span>
              </div>
            </div>

            {/* In-App SentinelPay Real-Time Protection Notice */}
            <div style={{ background: "rgba(0, 163, 224, 0.12)", border: "1px solid rgba(0, 163, 224, 0.3)", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BrandLogo variant="badge" emblemSize={14} color="#38BDF8" inverted />
                <span style={{ fontSize: 10.5, color: "rgba(255, 255, 255, 0.9)" }}>
                  Pre-screened via real-time XGBoost ML &amp; TreeSHAP
                </span>
              </div>
              <span style={{ fontSize: 9.5, color: "#38BDF8", fontWeight: 800, background: "rgba(0, 163, 224, 0.2)", padding: "1px 6px", borderRadius: 4 }}>
                ACTIVE
              </span>
            </div>

            {error && (
              <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#FCA5A5", fontSize: 11, marginBottom: 10 }}>
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowPrimaryPin(true)}
                style={{
                  padding: "14px",
                  borderRadius: 14,
                  background: "#00A3E0",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 800,
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
                    <span>Confirm &amp; Transfer ${parseFloat(customAmountStr || 0).toFixed(2)}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("input_amount")}
                style={{ padding: "8px", background: "transparent", border: "none", color: "rgba(255, 255, 255, 0.6)", fontSize: 11.5, cursor: "pointer" }}
              >
                Back to Edit Amount
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 6: ABA SCAN (Camera Viewfinder)                       */}
        {/* ========================================================= */}
        {activeTab === "scan" && (
          <div style={{ padding: "14px 16px 20px", display: "flex", flexDirection: "column", minHeight: "100%", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 900 }}>ABA<span style={{ color: "#EF4444" }}>'</span></span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Scan KHQR</span>
              </div>
              <div style={{ width: 32 }} />
            </div>

            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>Scan Merchant KHQR</div>
            <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.65)", marginBottom: 14 }}>
              Align frame with any Bakong merchant QR code
            </div>

            {/* Viewfinder with Green Corners */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handlePickRecipient(DEMO_RECIPIENTS[0])}
              style={{
                width: 220,
                height: 220,
                margin: "0 auto 16px",
                position: "relative",
                background: "rgba(0, 0, 0, 0.35)",
                borderRadius: 16,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
              title="Click to simulate scan"
            >
              <div style={{ position: "absolute", top: 0, left: 0, width: 24, height: 24, borderTop: "3px solid #22C55E", borderLeft: "3px solid #22C55E", borderTopLeftRadius: 10 }} />
              <div style={{ position: "absolute", top: 0, right: 0, width: 24, height: 24, borderTop: "3px solid #22C55E", borderRight: "3px solid #22C55E", borderTopRightRadius: 10 }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, width: 24, height: 24, borderBottom: "3px solid #22C55E", borderLeft: "3px solid #22C55E", borderBottomLeftRadius: 10 }} />
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderBottom: "3px solid #22C55E", borderRight: "3px solid #22C55E", borderBottomRightRadius: 10 }} />

              <div style={{ background: "#FFFFFF", padding: 10, borderRadius: 10 }}>
                <QrCode style={{ width: 140, height: 140, color: "#002438" }} />
              </div>

              <motion.div
                animate={{ y: [-70, 70, -70] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute",
                  left: 10,
                  right: 10,
                  height: 2,
                  background: "linear-gradient(90deg, transparent, #22C55E, transparent)",
                  boxShadow: "0 0 8px #22C55E"
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 36, marginBottom: 20 }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => setFlashOn(!flashOn)}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}
              >
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: flashOn ? "#FACC15" : "rgba(255, 255, 255, 0.15)", color: flashOn ? "#000000" : "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Flashlight style={{ width: 20, height: 20 }} />
                </div>
                <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.8)" }}>Flash</span>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => handlePickRecipient(DEMO_RECIPIENTS[1])}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}
              >
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255, 255, 255, 0.15)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ImageIcon style={{ width: 20, height: 20 }} />
                </div>
                <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.8)" }}>Upload QR</span>
              </div>
            </div>

            <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexWrap: "wrap", opacity: 0.85 }}>
              <span style={{ background: "#10B981", color: "#FFFFFF", fontSize: 8.5, fontWeight: 900, padding: "2px 5px", borderRadius: 3 }}>E-CASH</span>
              <span style={{ background: "#0284C7", color: "#FFFFFF", fontSize: 8.5, fontWeight: 900, padding: "2px 5px", borderRadius: 3 }}>CASH IN</span>
              <span style={{ background: "#003853", color: "#38BDF8", fontSize: 8.5, fontWeight: 900, padding: "2px 5px", borderRadius: 3, border: "1px solid #38BDF8" }}>ABA PAY</span>
              <span style={{ background: "#E11928", color: "#FFFFFF", fontSize: 8.5, fontWeight: 900, padding: "2px 5px", borderRadius: 3 }}>KHQR</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 7: ABA ACCOUNTS & RECENT ACTIVITY                    */}
        {/* ========================================================= */}
        {activeTab === "accounts" && (
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 900 }}>ABA<span style={{ color: "#EF4444" }}>'</span></span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Accounts &amp; Passbook</span>
              </div>
            </div>

            {/* Primary Savings Card */}
            <div style={{ background: "#FFFFFF", borderRadius: 18, padding: "16px", color: "#0F172A", marginBottom: 14, boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800 }}>Primary Savings Account</div>
                  <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#64748B" }}>{accountNumber}</div>
                </div>
                <span style={{ background: "#E0F2FE", color: "#0284C7", fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 4 }}>DEFAULT</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#0F172A", margin: "10px 0" }}>
                ${balance.toFixed(2)} <span style={{ fontSize: 13, color: "#64748B" }}>USD</span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("select_recipient")}
                  style={{ flex: 1, padding: "9px", borderRadius: 8, background: "#0284C7", color: "#FFFFFF", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  Pay via KHQR
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("my_qr")}
                  style={{ flex: 1, padding: "9px", borderRadius: 8, background: "#F1F5F9", color: "#334155", border: "none", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                >
                  My QR Code
                </button>
              </div>
            </div>

            {/* Recent Activity with Click-to-Inspect SentinelPay Audit */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: "#FFFFFF" }}>Recent Transaction Passbook</div>
              <span style={{ fontSize: 10, color: "#38BDF8" }}>Tap for SentinelPay Audit</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentTransactions.map((tx, idx) => {
                const isBlocked = tx.status === "BLOCKED";
                const isReleased = tx.status === "RELEASED";
                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedTxForDetail(tx)}
                    style={{
                      background: "rgba(255, 255, 255, 0.08)",
                      borderRadius: 12,
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      border: "1px solid rgba(255, 255, 255, 0.08)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: isBlocked ? "rgba(239, 68, 68, 0.2)" : "rgba(16, 185, 129, 0.2)",
                          color: isBlocked ? "#EF4444" : "#10B981",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        }}
                      >
                        {isBlocked ? <XCircle style={{ width: 16, height: 16 }} /> : <CheckCircle2 style={{ width: 16, height: 16 }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: 11.5, fontWeight: 700, color: "#FFFFFF" }}>{tx.transaction_token}</div>
                        <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.6)" }}>
                          {tx.created_at || "Recent"} &bull; {tx.payment_method || "KHQR"}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12.5, fontWeight: 800, fontFamily: "var(--font-mono)", color: isBlocked ? "#F87171" : "#FFFFFF" }}>
                        {isBlocked ? "$0.00" : `-$${parseFloat(tx.amount || 0).toFixed(2)}`}
                      </div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          padding: "1px 5px",
                          borderRadius: 4,
                          background: isBlocked ? "rgba(239, 68, 68, 0.2)" : isReleased ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.2)",
                          color: isBlocked ? "#FCA5A5" : isReleased ? "#FCD34D" : "#86EFAC"
                        }}
                      >
                        {tx.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 8: ABA CARDS                                          */}
        {/* ========================================================= */}
        {activeTab === "cards" && (
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("home")}
                  style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                >
                  <ChevronLeft style={{ width: 18, height: 18 }} />
                </button>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 900 }}>ABA<span style={{ color: "#EF4444" }}>'</span></span>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>Cards</span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <VirtualCreditCard
                cardholder={cardholderName}
                cardNumber="4532 •••• •••• 8821"
                expiry="09/28"
                cardType="VISA"
                status={cardFrozen ? "BLOCKED" : "ACTIVE"}
              />
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "14px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>Freeze Card Instantly</div>
                  <div style={{ fontSize: 10.5, color: "rgba(255, 255, 255, 0.55)" }}>Lock debit card from unauthorized usage</div>
                </div>
                <input
                  type="checkbox"
                  checked={cardFrozen}
                  onChange={(e) => setCardFrozen(e.target.checked)}
                  style={{ cursor: "pointer", width: 18, height: 18, accentColor: "#0284C7" }}
                />
              </div>

              <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)" }} />

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700 }}>Bakong KHQR Shield</div>
                  <div style={{ fontSize: 10.5, color: "rgba(255, 255, 255, 0.55)" }}>Real-time SentinelPay protection active</div>
                </div>
                <span style={{ color: "#34D399", fontWeight: 800, fontSize: 11 }}>PROTECTED</span>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 9: ABA MY KHQR                                        */}
        {/* ========================================================= */}
        {activeTab === "my_qr" && (
          <div style={{ padding: "14px 16px 20px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 900 }}>ABA<span style={{ color: "#EF4444" }}>'</span></span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>My KHQR</span>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "20px", color: "#0F172A", maxWidth: 290, width: "100%", margin: "0 auto", boxShadow: "0 12px 28px rgba(0,0,0,0.25)" }}>
              <div style={{ background: "#E11928", borderRadius: 10, padding: "6px 12px", color: "#FFFFFF", fontWeight: 900, fontSize: 13, marginBottom: 14 }}>
                KHQR &bull; BAKONG
              </div>
              <div style={{ fontSize: 14, fontWeight: 800 }}>{cardholderName}</div>
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#64748B", marginBottom: 12 }}>{accountNumber}</div>

              <div style={{ width: 170, height: 170, margin: "0 auto 14px", background: "#F8FAFC", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", border: "1px solid #E2E8F0" }}>
                <QrCode style={{ width: 140, height: 140, color: "#0F172A" }} />
                <div style={{ position: "absolute", width: 32, height: 32, borderRadius: 8, background: "#003853", border: "2px solid #FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", color: "#38BDF8", fontWeight: 900, fontSize: 11 }}>
                  ABA
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ width: "100%", padding: "10px", borderRadius: 10, background: "#0284C7", color: "#FFFFFF", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                Close QR Code
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 10: IN-APP SENTINELPAY SECURITY CENTER               */}
        {/* ========================================================= */}
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
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 900 }}>ABA<span style={{ color: "#EF4444" }}>'</span></span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Security Center</span>
              </div>
            </div>

            {/* SentinelPay Core AI Status Card */}
            <div style={{ background: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)", borderRadius: 16, padding: "16px", color: "#FFFFFF", marginBottom: 14, boxShadow: "0 8px 20px rgba(0,0,0,0.25)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <ShieldCheck style={{ width: 22, height: 22, color: "#FFFFFF" }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>SentinelPay Core Defense</div>
                  <div style={{ fontSize: 10.5, color: "#E0F2FE" }}>Institution ID: ABA Bank Core Gateway</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.9)", lineHeight: 1.4, marginTop: 4 }}>
                Every transaction initiated in ABA Mobile is screened synchronously using XGBoost ML &amp; TreeSHAP explainability in under 20 milliseconds.
              </div>
            </div>

            {/* Defense Modules List */}
            <div style={{ fontSize: 12, fontWeight: 800, color: "#38BDF8", textTransform: "uppercase", marginBottom: 8 }}>
              Active Protection Layers
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { title: "Bakong KHQR Interceptor", desc: "Instant screening on NBC national KHQR rails", status: "ONLINE", color: "#10B981" },
                { title: "Device Fingerprint Verifier", desc: "Zero-PII device confidence modeling", status: "ACTIVE", color: "#10B981" },
                { title: "Radial Geolocation Guard", desc: "Detects impossible speed anomalies across Cambodia", status: "ACTIVE", color: "#10B981" },
                { title: "TreeSHAP Local Explainability", desc: "Generates mathematical feature attributions for auditors", status: "READY", color: "#00A3E0" }
              ].map((layer, idx) => (
                <div key={idx} style={{ background: "rgba(255, 255, 255, 0.08)", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{layer.title}</div>
                    <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.6)" }}>{layer.desc}</div>
                  </div>
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: layer.color, background: `${layer.color}20`, padding: "2px 6px", borderRadius: 4 }}>
                    {layer.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 11: EXCHANGE RATE MODAL                               */}
        {/* ========================================================= */}
        {activeTab === "exchange_rate" && (
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 900 }}>ABA<span style={{ color: "#EF4444" }}>'</span></span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Exchange Rates</span>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "16px", color: "#0F172A", marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#64748B", marginBottom: 4 }}>Official NBC Indicative Rate</div>
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#003853" }}>
                1 USD = 4,100 KHR
              </div>
              <div style={{ fontSize: 10, color: "#10B981", fontWeight: 700, marginTop: 4 }}>
                Zero commission on internal conversion
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 12: NOTIFICATIONS CENTER                              */}
        {/* ========================================================= */}
        {activeTab === "notifications" && (
          <div style={{ padding: "14px 16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <button
                type="button"
                onClick={() => setActiveTab("home")}
                style={{ background: "rgba(255, 255, 255, 0.12)", border: "none", color: "#FFFFFF", width: 32, height: 32, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                <ChevronLeft style={{ width: 18, height: 18 }} />
              </button>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 16, fontWeight: 900 }}>ABA<span style={{ color: "#EF4444" }}>'</span></span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>Notifications</span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ background: "rgba(255, 255, 255, 0.08)", borderRadius: 12, padding: "12px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#38BDF8", marginBottom: 2 }}>SentinelPay Protection Alert</div>
                <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.8)", lineHeight: 1.3 }}>
                  Your account is protected by SentinelPay real-time AI gateway across all KHQR merchants.
                </div>
                <div style={{ fontSize: 9.5, color: "#94A3B8", marginTop: 4 }}>Today, 09:41 AM</div>
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
              background: "rgba(0, 32, 51, 0.95)",
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
                  border: "3px solid rgba(0, 163, 224, 0.2)",
                  borderTopColor: "#00A3E0"
                }}
              />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldCheck style={{ width: 28, height: 28, color: "#00A3E0" }} />
              </div>
            </div>

            <div style={{ fontSize: 16, fontWeight: 900, color: "#FFFFFF", marginBottom: 4 }}>
              Screening via SentinelPay...
            </div>
            <div style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.7)", maxWidth: 240, lineHeight: 1.4 }}>
              Evaluating XGBoost Risk Probability, Radial Distance &amp; TreeSHAP Feature Attributions.
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
        bankCode="ABA"
        bankName="ABA Mobile"
        amount={customAmountStr}
        currency={transferCurrency}
        recipientName={selectedRecipient?.name || "Merchant"}
        accountNumber={selectedRecipient?.account || "001 294 812"}
        isSubmitting={isSubmitting}
      />

      {/* ============================================================= */}
      {/* MODAL SHEET: ABA STEP-UP VERIFICATION (MFA REAL SCENARIOS)   */}
      {/* ============================================================= */}
      <AnimatePresence>
        {activeSheet === "STEP_UP" && activeGatewayResult && (
          <BankStepUpChallenge
            bankName="ABA Bank"
            bankCode="ABA"
            activeGatewayResult={activeGatewayResult}
            paymentDetails={paymentDetails}
            onResolveStepUp={onResolveStepUp}
            isVerifying={isVerifying}
            onClose={() => setActiveSheet("NONE")}
          />
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* MODAL SHEET: OFFICIAL ABA TRANSFER SLIP WITH SENTINELPAY      */}
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
              background: "#002033",
              display: "flex",
              flexDirection: "column",
              padding: "16px 16px 24px",
              overflowY: "auto"
            }}
          >
            {/* Status Icon & Title */}
            <div style={{ textAlign: "center", padding: "8px 0 10px" }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background:
                    activeGatewayResult.status === "APPROVED" || activeGatewayResult.status === "RELEASED"
                      ? "rgba(16, 185, 129, 0.2)"
                      : "rgba(239, 68, 68, 0.2)",
                  border: `2px solid ${
                    activeGatewayResult.status === "APPROVED" || activeGatewayResult.status === "RELEASED"
                      ? "#10B981"
                      : "#EF4444"
                  }`,
                  color:
                    activeGatewayResult.status === "APPROVED" || activeGatewayResult.status === "RELEASED"
                      ? "#10B981"
                      : "#EF4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 8px"
                }}
              >
                {activeGatewayResult.status === "APPROVED" || activeGatewayResult.status === "RELEASED" ? (
                  <Check style={{ width: 28, height: 28 }} strokeWidth={3} />
                ) : (
                  <ShieldAlert style={{ width: 28, height: 28 }} strokeWidth={2.5} />
                )}
              </div>

              <div style={{ fontSize: 16, fontWeight: 900, color: "#FFFFFF" }}>
                {activeGatewayResult.status === "APPROVED"
                  ? "ABA Transfer Successful"
                  : activeGatewayResult.status === "RELEASED"
                  ? "Payment Released via Step-Up"
                  : "Transfer Declined"}
              </div>
              <div style={{ fontSize: 11, color: activeGatewayResult.status === "BLOCKED" ? "#F87171" : "rgba(255, 255, 255, 0.75)", fontWeight: activeGatewayResult.status === "BLOCKED" ? 700 : 400, marginTop: 2 }}>
                {activeGatewayResult.status === "BLOCKED"
                  ? "Funds Protected \u2022 $0.00 Debited"
                  : "Bakong KHQR National Switch \u2022 Settled"}
              </div>
              {activeGatewayResult.status === "BLOCKED" && (
                <div style={{ fontSize: 10, color: "rgba(255, 255, 255, 0.55)", marginTop: 2 }}>
                  ABA Mobile Automated Fraud Interception
                </div>
              )}
            </div>

            {/* ABA Official Slip Card */}
            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "14px", color: "#0F172A", marginBottom: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}>
              <div style={{ textAlign: "center", paddingBottom: 10, borderBottom: "1px dashed #CBD5E1", marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#64748B", textTransform: "uppercase" }}>
                  {activeGatewayResult.status === "BLOCKED" ? "Attempted Transfer" : "Settled Amount"}
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, fontFamily: "var(--font-mono)", color: activeGatewayResult.status === "BLOCKED" ? "#DC2626" : "#0F172A" }}>
                  ${parseFloat(activeGatewayResult.amount || 0).toFixed(2)} USD
                </div>
                {activeGatewayResult.status === "BLOCKED" && (
                  <span style={{ fontSize: 9.5, background: "#FEE2E2", color: "#B91C1C", padding: "2px 8px", borderRadius: 4, fontWeight: 800 }}>
                    TRANSACTION REJECTED &bull; FUNDS SAFE
                  </span>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Reference ID</span>
                  <strong style={{ fontFamily: "var(--font-mono)" }}>{activeGatewayResult.transaction_token}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Beneficiary</span>
                  <strong>{paymentDetails.merchant}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Origin Account</span>
                  <span>{accountNumber} (Savings)</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Date &amp; Time</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>

              {/* EMBEDDED PRACTICAL SENTINELPAY RESULT SECTION */}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px dashed #CBD5E1" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <BrandLogo variant="badge" emblemSize={14} color="var(--cobalt)" />
                  <span
                    style={{
                      fontSize: 9.5,
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: activeGatewayResult.status === "BLOCKED" ? "#FEE2E2" : "#DCFCE7",
                      color: activeGatewayResult.status === "BLOCKED" ? "#B91C1C" : "#059669"
                    }}
                  >
                    {activeGatewayResult.status === "BLOCKED" ? "BLOCKED" : "CLEARED"}
                  </span>
                </div>

                <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px", fontSize: 10.5, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>ML Fraud Probability:</span>
                    <strong style={{ color: activeGatewayResult.status === "BLOCKED" ? "#DC2626" : "#059669" }}>
                      {((activeGatewayResult.fraud_probability || 0.04) * 100).toFixed(1)}% &bull; {activeGatewayResult.risk_level || "LOW"} Risk
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Device Trust Score:</span>
                    <strong style={{ color: "#0F172A" }}>{((paymentDetails.deviceTrust || 0.98) * 100).toFixed(0)}%</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748B" }}>Radial Distance:</span>
                    <strong style={{ color: "#0F172A" }}>{paymentDetails.distance || 1.2} km</strong>
                  </div>

                  {/* Expandable TreeSHAP Contributions */}
                  <div style={{ marginTop: 4, paddingTop: 4, borderTop: "1px solid #E2E8F0" }}>
                    <button
                      type="button"
                      onClick={() => setShowShapDetails(!showShapDetails)}
                      style={{ background: "none", border: "none", color: "#0284C7", fontSize: 10, fontWeight: 700, cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 3 }}
                    >
                      <span>{showShapDetails ? "Hide" : "View"} SentinelPay TreeSHAP Attributions</span>
                      <ChevronRight style={{ width: 11, height: 11, transform: showShapDetails ? "rotate(90deg)" : "none" }} />
                    </button>

                    {showShapDetails && (
                      <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
                        {(activeGatewayResult.explanation || [
                          { feature: "distance", shap_value: paymentDetails.distance > 100 ? 5.4 : -0.32, impact: paymentDetails.distance > 100 ? "INCREASES_FRAUD_RISK" : "DECREASES_FRAUD_RISK" },
                          { feature: "device_trust", shap_value: paymentDetails.deviceTrust < 0.5 ? 2.3 : -0.45, impact: paymentDetails.deviceTrust < 0.5 ? "INCREASES_FRAUD_RISK" : "DECREASES_FRAUD_RISK" },
                          { feature: "merchant_risk", shap_value: paymentDetails.merchantRisk > 0.5 ? 1.8 : -0.21, impact: paymentDetails.merchantRisk > 0.5 ? "INCREASES_FRAUD_RISK" : "DECREASES_FRAUD_RISK" }
                        ]).slice(0, 3).map((item, k) => (
                          <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5 }}>
                            <span style={{ color: "#64748B" }}>{item.feature}:</span>
                            <span style={{ fontWeight: 700, color: item.impact?.includes("INCREASE") || item.shap_value > 0 ? "#DC2626" : "#059669" }}>
                              {item.shap_value > 0 ? `+${item.shap_value.toFixed(2)}` : item.shap_value.toFixed(2)} log-odds
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Blocked Advisory Action Buttons */}
            {activeGatewayResult.status === "BLOCKED" ? (
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => {
                    setCardFrozen(true);
                    setActiveSheet("NONE");
                    setActiveTab("cards");
                  }}
                  style={{
                    padding: "12px",
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
                  <span>Freeze Account &amp; Visa Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveSheet("NONE");
                    setActiveTab("home");
                  }}
                  style={{ padding: "10px", borderRadius: 12, background: "rgba(255, 255, 255, 0.1)", color: "#FFFFFF", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  Return to ABA Home
                </button>
              </div>
            ) : (
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(`ABA Transfer Receipt: $${activeGatewayResult.amount} to ${paymentDetails.merchant} (Ref: ${activeGatewayResult.transaction_token})`);
                      alert("Receipt copied to clipboard!");
                    }}
                    style={{ flex: 1, padding: "10px", borderRadius: 12, background: "rgba(255, 255, 255, 0.12)", color: "#FFFFFF", border: "none", fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
                  >
                    <Share2 style={{ width: 14, height: 14 }} />
                    <span>Share Receipt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("my_qr")}
                    style={{ flex: 1, padding: "10px", borderRadius: 12, background: "rgba(255, 255, 255, 0.12)", color: "#FFFFFF", border: "none", fontSize: 11.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
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
                    padding: "13px",
                    borderRadius: 14,
                    background: "#00A3E0",
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Done &bull; Back to ABA Home
                </button>
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
              zIndex: 110,
              background: "#002033",
              display: "flex",
              flexDirection: "column",
              padding: "16px 16px 24px",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 800 }}>Transaction Forensics</span>
              <button
                type="button"
                onClick={() => setSelectedTxForDetail(null)}
                style={{ background: "rgba(255, 255, 255, 0.15)", border: "none", color: "#FFFFFF", width: 28, height: 28, borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                &times;
              </button>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: 16, padding: "14px", color: "#0F172A", marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#64748B" }}>Transaction Token</div>
              <div style={{ fontSize: 16, fontWeight: 900, fontFamily: "var(--font-mono)", color: "#003853", marginBottom: 10 }}>
                {selectedTxForDetail.transaction_token}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11.5 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Settlement Status:</span>
                  <strong style={{ color: selectedTxForDetail.status === "BLOCKED" ? "#DC2626" : "#059669" }}>
                    {selectedTxForDetail.status}
                  </strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Payment Rail:</span>
                  <span>{selectedTxForDetail.payment_method || "Bakong KHQR"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>Ingested Value:</span>
                  <strong style={{ fontFamily: "var(--font-mono)" }}>${parseFloat(selectedTxForDetail.amount || 0).toFixed(2)} USD</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#64748B" }}>SentinelPay Shield:</span>
                  <span style={{ color: "#0284C7", fontWeight: 700 }}>XGBoost + TreeSHAP Active</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTxForDetail(null)}
              style={{ marginTop: "auto", padding: "12px", borderRadius: 12, background: "#00A3E0", color: "#FFFFFF", border: "none", fontSize: 12.5, fontWeight: 800, cursor: "pointer" }}
            >
              Close Forensic Details
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* AUTHENTIC ABA MOBILE 5-TAB DOCKED BOTTOM NAVIGATION BAR       */}
      {/* ============================================================= */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: "#001D2E",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          zIndex: 100,
          boxShadow: "0 -4px 16px rgba(0, 0, 0, 0.3)"
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
            color: activeTab === "home" ? "#00A3E0" : "rgba(255, 255, 255, 0.6)",
            cursor: "pointer"
          }}
        >
          <Home style={{ width: 20, height: 20 }} />
          <span style={{ fontSize: 9.5, fontWeight: activeTab === "home" ? 800 : 600 }}>Home</span>
        </button>

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
            color: activeTab === "cards" ? "#00A3E0" : "rgba(255, 255, 255, 0.6)",
            cursor: "pointer"
          }}
        >
          <CreditCard style={{ width: 20, height: 20 }} />
          <span style={{ fontSize: 9.5, fontWeight: activeTab === "cards" ? 800 : 600 }}>Cards</span>
        </button>

        {/* Elevated Red ABA Scan Button */}
        <div style={{ position: "relative", top: -14 }}>
          <button
            type="button"
            onClick={() => setActiveTab("scan")}
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              background: "#E11928",
              border: "3px solid #001D2E",
              color: "#FFFFFF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer"
            }}
            title="ABA Scan KHQR"
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
            color: activeTab === "transfers_menu" ? "#00A3E0" : "rgba(255, 255, 255, 0.6)",
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
            color: activeTab === "security_center" ? "#38BDF8" : "rgba(255, 255, 255, 0.6)",
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

// Mini Helper Icons matching real ABA Mobile app
function AbaWalletIcon({ size = 22, color = "#0096C7" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M21 7.28V5c0-1.1-.9-2-2-2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-2.28c.59-.35 1-.98 1-1.72V9c0-.74-.41-1.37-1-1.72zM20 12c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  );
}

function AbaCardIcon({ size = 22, color = "#0891B2" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
    </svg>
  );
}

function AbaPaymentIcon({ size = 22, color = "#059669" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-1c-1.66 0-3-1.34-3-3h2c0 .55.45 1 1 1h2c.55 0 1-.45 1-1 0-.9-1.2-1.3-2.5-1.7C10.1 11.9 8 11.1 8 9c0-1.66 1.34-3 3-3V5h2v1c1.66 0 3 1.34 3 3h-2c0-.55-.45-1-1-1h-2c-.55 0-1 .45-1 1 0 .9 1.2 1.3 2.5 1.7 1.4.5 3.5 1.3 3.5 3.3 0 1.66-1.34 3-3 3v1z" />
    </svg>
  );
}

function BookIcon(props) {
  return (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function CubeIcon(props) {
  return (
    <svg width={props.size || 20} height={props.size || 20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}
