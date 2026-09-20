import React from "react";
import { motion } from "framer-motion";
import BrandLogo from "./BrandLogo";

export default function Navbar({
  activeTab,
  setActiveTab,
  currentTransaction,
  backendHealthy,
}) {
  const tabs = [
    { id: "checkout", label: "Simulator" },
    {
      id: "result",
      label: "Verdict",
      status: currentTransaction?.status,
    },
    { id: "dashboard", label: "Telemetry" },
    { id: "intelligence", label: "Explainability" },
    { id: "model", label: "Governance" },
  ];

  return (
    <div style={{ position: "sticky", top: 12, zIndex: 50, padding: "0 16px" }}>
      <header className="floating-island-nav">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 48,
          }}
        >
          {/* Brand Mark */}
          <div
            onClick={() => setActiveTab("checkout")}
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              userSelect: "none",
              paddingLeft: 4,
            }}
          >
            <BrandLogo emblemSize={46} />
          </div>

          {/* Floating Tabs */}
          <nav style={{ display: "flex", alignItems: "center", gap: 3 }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const hasVerdict = tab.status;
              const isApproved =
                hasVerdict === "APPROVED" || hasVerdict === "VERIFIED";
              const isReview = hasVerdict === "SOFT_BLOCKED";

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    position: "relative",
                    padding: "6px 14px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? "var(--text-1)" : "var(--text-3)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "color 150ms var(--ease-spring)",
                    outline: "none",
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeIslandTab"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                      }}
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: "var(--radius-pill)",
                        background: "rgba(15, 23, 42, 0.07)",
                        zIndex: 0,
                      }}
                    />
                  )}
                  <span style={{ position: "relative", zIndex: 1 }}>{tab.label}</span>
                  {hasVerdict && (
                    <span
                      style={{
                        position: "relative",
                        zIndex: 1,
                        width: 8,
                        height: 2.5,
                        borderRadius: 1,
                        background: isApproved
                          ? "var(--emerald)"
                          : isReview
                          ? "var(--amber)"
                          : "var(--rose)",
                        boxShadow: `0 0 4px ${
                          isApproved
                            ? "var(--emerald)"
                            : isReview
                            ? "var(--amber)"
                            : "var(--rose)"
                        }`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Clean Engine Status Indicator (Machined Hardware Bar) */}
          <div style={{ paddingRight: 8, display: "flex", alignItems: "center" }}>
            <span
              className={`status-indicator is-live ${
                backendHealthy ? "status-approved" : "status-blocked"
              }`}
              style={{ fontSize: 11 }}
            >
              <span className="status-dot" />
              {backendHealthy ? "Engine operational" : "Engine offline"}
            </span>
          </div>
        </div>
      </header>
    </div>
  );
}
