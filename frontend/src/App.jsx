import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar";
import Checkout from "./pages/Checkout";
import TransactionResult from "./pages/TransactionResult";
import Dashboard from "./pages/Dashboard";
import TransactionIntelligence from "./pages/TransactionIntelligence";
import ModelIntelligence from "./pages/ModelIntelligence";
import { checkBackendHealth } from "./services/api";

const pageVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.16, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

export default function App() {
  const [activeTab, setActiveTab] = useState("checkout");
  const [currentTransaction, setCurrentTransaction] = useState(null);
  const [selectedAuditTransaction, setSelectedAuditTransaction] = useState(null);
  const [backendHealthy, setBackendHealthy] = useState(true);

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
    const tx = { ...result, amount: rawPayload.amount, user_id: rawPayload.user_id, distance: rawPayload.distance };
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
      case "checkout":
        return <Checkout key="checkout" onTransactionComplete={handleTransactionComplete} />;
      case "result":
        return <TransactionResult key="result" transaction={currentTransaction} onReset={() => setActiveTab("checkout")} onNavigateToIntelligence={() => setActiveTab("intelligence")} />;
      case "dashboard":
        return <Dashboard key="dashboard" onSelectTransaction={handleSelectFromDashboard} />;
      case "intelligence":
        return <TransactionIntelligence key="intelligence" selectedTransaction={selectedAuditTransaction || currentTransaction} />;
      case "model":
        return <ModelIntelligence key="model" />;
      default:
        return null;
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
      </main>
      <footer style={{ borderTop: "1px solid var(--border)", padding: "14px 0", background: "var(--surface)" }}>
        <div className="page-container" style={{ padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "11px", color: "var(--text-3)", fontFamily: "var(--font-mono)" }}>
          <span>SentinelPay / Risk Evaluation Engine</span>
          <span>XGBoost 45-Tree Ensemble &bull; TreeSHAP</span>
        </div>
      </footer>
    </div>
  );
}
