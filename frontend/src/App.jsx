import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Checkout from "./pages/Checkout";
import TransactionResult from "./pages/TransactionResult";
import Dashboard from "./pages/Dashboard";
import TransactionIntelligence from "./pages/TransactionIntelligence";
import ModelIntelligence from "./pages/ModelIntelligence";
import { checkBackendHealth } from "./services/api";

const pageVariants = {
  initial: { opacity: 0, transform: "translateY(6px)" },
  animate: { opacity: 1, transform: "translateY(0px)", transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, transform: "translateY(-4px)", transition: { duration: 0.1 } },
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 480, margin: "80px auto", padding: 24, textAlign: "center" }}>
          <div className="surface-card">
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-1)", marginBottom: 8 }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 20 }}>
              {this.state.error?.message || "An unexpected error occurred in this view."}
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn-island"
              style={{ margin: "0 auto" }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState("checkout");
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [selectedAuditTransaction, setSelectedAuditTransaction] = useState(null);
  const [backendHealthy, setBackendHealthy] = useState(true);

  // Hash-based routing for /pay vs /ops
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#/", "").replace("#", "");
      if (hash === "pay" || hash === "checkout") setActiveTab("checkout");
      else if (hash === "verdict" || hash === "result") setActiveTab("result");
      else if (hash === "ops" || hash === "dashboard") setActiveTab("dashboard");
      else if (hash === "investigate" || hash === "intelligence") setActiveTab("intelligence");
      else if (hash === "model") setActiveTab("model");
      else if (hash === "overview" || hash === "landing") setActiveTab("landing");
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Update hash when activeTab changes (replaceState to avoid history pollution)
  useEffect(() => {
    const hashMap = {
      checkout: "#/pay",
      result: "#/pay/verdict",
      dashboard: "#/ops",
      intelligence: "#/ops/investigate",
      model: "#/ops/model",
      landing: "#/overview",
    };
    const newHash = hashMap[activeTab];
    if (newHash && window.location.hash !== newHash) {
      window.history.replaceState(null, "", newHash);
    }
  }, [activeTab]);

  useEffect(() => {
    async function verifyHealth() {
      const isUp = await checkBackendHealth();
      setBackendHealthy(isUp);
    }
    verifyHealth();
    const interval = setInterval(verifyHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleTransactionComplete = (result, rawPayload) => {
    const isVance = rawPayload.user_id === 1002;
    const tx = {
      ...result,
      amount: rawPayload.amount,
      user_id: rawPayload.user_id,
      distance: rawPayload.distance,
      card_brand: isVance ? "Mastercard World Elite" : "Visa Signature",
      card_last4: isVance ? "1002" : "8821",
      cardholder_name: isVance ? "Jonathan Vance" : "Alex Morgan",
    };
    setCurrentTransaction(tx);
    setSelectedAuditTransaction(tx);
    setActiveTab("result");
  };

  const handleSelectFromDashboard = (tx) => {
    setSelectedAuditTransaction(tx);
    setActiveTab("intelligence");
  };

  const renderPage = () => {
    switch (activeTab) {
      case "landing":
        return (
          <Landing
            key="landing"
            onEnterCustomer={() => setActiveTab("checkout")}
            onEnterOps={() => setActiveTab("dashboard")}
          />
        );
      case "checkout":
        return <Checkout key="checkout" onTransactionComplete={handleTransactionComplete} />;
      case "result":
        return (
          <TransactionResult
            key="result"
            transaction={currentTransaction}
            onReset={() => setActiveTab("checkout")}
            onNavigateToIntelligence={() => setActiveTab("intelligence")}
          />
        );
      case "dashboard":
        return <Dashboard key="dashboard" onSelectTransaction={handleSelectFromDashboard} />;
      case "intelligence":
        return (
          <TransactionIntelligence
            key="intelligence"
            selectedTransaction={selectedAuditTransaction || currentTransaction}
          />
        );
      case "model":
        return <ModelIntelligence key="model" />;
      default:
        return <Checkout key="checkout" onTransactionComplete={handleTransactionComplete} />;
    }
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--canvas)", color: "var(--text-2)" }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTransaction={currentTransaction}
        backendHealthy={backendHealthy}
      />
      <main className="flex-1">
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>
      <footer
        style={{
          borderTop: "1px solid var(--shell-border)",
          padding: "16px 0",
          background: "var(--core-bg)",
          marginTop: "auto",
        }}
      >
        <div
          className="page-container"
          style={{
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            fontSize: "11px",
            color: "var(--text-3)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 700, color: "var(--text-1)" }}>SentinelPay</span>
            <span>/</span>
            <span>Risk Evaluation Engine</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span>XGBoost 45-Tree Ensemble</span>
            <span>&bull;</span>
            <span>Exact TreeSHAP</span>
            <span>&bull;</span>
            <span>SMOTE Calibrated</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
