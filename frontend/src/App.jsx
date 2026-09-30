import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AppShell from "./components/AppShell";
import Landing from "./pages/Landing";
import BankSimulator from "./pages/BankSimulator";
import TransactionResult from "./pages/TransactionResult";
import Dashboard from "./pages/Dashboard";
import TransactionIntelligence from "./pages/TransactionIntelligence";
import ModelIntelligence from "./pages/ModelIntelligence";
import FraudAlerts from "./pages/FraudAlerts";
import InstitutionIntegration from "./pages/InstitutionIntegration";
import DataPrivacy from "./pages/DataPrivacy";
import ApiDocumentation from "./pages/ApiDocumentation";
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
  const [activeTab, setActiveTab] = useState("simulator");
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [selectedAuditTransaction, setSelectedAuditTransaction] = useState(null);
  const [backendHealthy, setBackendHealthy] = useState(true);
  const [selectedRole, setSelectedRole] = useState(() => {
    try {
      return window.localStorage.getItem("sp.stakeholder.role") || "all";
    } catch {
      return "all";
    }
  });

  // Hash-based routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#/", "").replace("#", "");
      if (hash === "mobile" || hash === "phone") setActiveTab("mobile");
      else if (hash === "simulator" || hash === "pay" || hash === "checkout") setActiveTab("simulator");
      else if (hash === "verdict" || hash === "result") setActiveTab("result");
      else if (hash === "alerts" || hash === "feed") setActiveTab("alerts");
      else if (hash === "ops" || hash === "dashboard") setActiveTab("dashboard");
      else if (hash === "investigate" || hash === "intelligence") setActiveTab("intelligence");
      else if (hash === "model") setActiveTab("model");
      else if (hash === "integration" || hash === "institutions") setActiveTab("integration");
      else if (hash === "docs" || hash === "api_docs") setActiveTab("api_docs");
      else if (hash === "privacy") setActiveTab("privacy");
      else if (hash === "overview" || hash === "landing") setActiveTab("landing");
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Sync window hash when activeTab changes
  useEffect(() => {
    const hashMap = {
      landing: "#/overview",
      mobile: "#/mobile",
      simulator: "#/simulator",
      checkout: "#/simulator",
      result: "#/verdict",
      alerts: "#/alerts",
      dashboard: "#/dashboard",
      intelligence: "#/investigate",
      model: "#/model",
      integration: "#/integration",
      api_docs: "#/docs",
      privacy: "#/privacy"
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
    const tx = {
      ...result,
      amount: rawPayload.amount,
      user_id: rawPayload.user_id || 1001,
      currency: rawPayload.currency || "USD",
      payment_method: rawPayload.payment_method || "KHQR",
      cardholder_name: "Sophea Sok (Customer)",
      card_brand: rawPayload.payment_method === "KHQR" ? "KHQR (Bakong)" : "Visa Signature",
      card_last4: "8821"
    };
    setCurrentTransaction(tx);
    setSelectedAuditTransaction(tx);
    // Stay in Bank Simulator so user views the authentic mobile app screen/receipt directly on phone
  };

  const handleSelectTransactionForForensics = (tx) => {
    setSelectedAuditTransaction(tx);
    setActiveTab("intelligence");
  };

  const renderPage = () => {
    switch (activeTab) {
      case "landing":
        return (
          <Landing
            key="landing"
            onEnterCustomer={() => {
              setSelectedRole("customer");
              try { window.localStorage.setItem("sp.stakeholder.role", "customer"); } catch {}
              setActiveTab("simulator");
            }}
            onEnterOps={() => {
              setSelectedRole("analyst");
              try { window.localStorage.setItem("sp.stakeholder.role", "analyst"); } catch {}
              setActiveTab("alerts");
            }}
            onEnterIntegration={() => {
              setSelectedRole("platform");
              try { window.localStorage.setItem("sp.stakeholder.role", "platform"); } catch {}
              setActiveTab("integration");
            }}
            onEnterPrivacy={() => {
              setSelectedRole("executive");
              try { window.localStorage.setItem("sp.stakeholder.role", "executive"); } catch {}
              setActiveTab("privacy");
            }}
          />
        );
      case "simulator":
      case "checkout":
        return (
          <BankSimulator
            key="simulator"
            onTransactionComplete={handleTransactionComplete}
            onNavigateToIntelligence={() => setActiveTab("intelligence")}
          />
        );
      case "result":
        return (
          <TransactionResult
            key="result"
            transaction={currentTransaction}
            onReset={() => setActiveTab("simulator")}
            onNavigateToIntelligence={() => setActiveTab("intelligence")}
          />
        );
      case "alerts":
        return (
          <FraudAlerts
            key="alerts"
            onSelectTransaction={handleSelectTransactionForForensics}
          />
        );
      case "dashboard":
        return (
          <Dashboard
            key="dashboard"
            onSelectTransaction={handleSelectTransactionForForensics}
          />
        );
      case "intelligence":
        return (
          <TransactionIntelligence
            key="intelligence"
            selectedTransaction={selectedAuditTransaction || currentTransaction}
          />
        );
      case "model":
        return <ModelIntelligence key="model" />;
      case "integration":
        return <InstitutionIntegration key="integration" />;
      case "api_docs":
        return <ApiDocumentation key="api_docs" />;
      case "privacy":
        return <DataPrivacy key="privacy" />;
      default:
        return (
          <BankSimulator
            key="simulator"
            onTransactionComplete={handleTransactionComplete}
            onNavigateToIntelligence={() => setActiveTab("intelligence")}
          />
        );
    }
  };

  if (activeTab === "mobile") {
    return (
      <div className="standalone-mobile-container">
        <ErrorBoundary>
          <BankSimulator
            standalone={true}
            onTransactionComplete={handleTransactionComplete}
            onNavigateToIntelligence={() => {
              window.location.hash = "#/investigate";
            }}
          />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="app-frame">
      <AppShell
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentTransaction={currentTransaction}
        backendHealthy={backendHealthy}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
      />
      <main className="app-main">
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
    </div>
  );
}
