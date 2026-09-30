import React, { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Code2,
  Cpu,
  Home,
  Lock,
  Menu,
  QrCode,
  Search,
  Shield,
  SlidersHorizontal,
  Smartphone,
  X
} from "lucide-react";
import BrandLogo from "./BrandLogo";

// ─── Navigation Configuration (Grouped by domain, zero duplication, zero emojis) ───

export const PERSPECTIVES = [
  { id: "all", label: "All Views", icon: Building2, allowedSections: ["bank", "analyst", "platform"] },
  { id: "customer", label: "Customer", icon: Smartphone, allowedSections: ["bank"], defaultTab: "simulator" },
  { id: "security", label: "Security SOC", icon: Shield, allowedSections: ["analyst", "platform"], defaultTab: "alerts" }
];

const BANK_TABS = [
  { id: "simulator", label: "Simulator", icon: Smartphone },
  { id: "result", label: "Verdict", icon: CheckCircle2, contextual: true }
];

const ANALYST_TABS = [
  { id: "alerts", label: "Live Alerts", icon: Bell },
  { id: "dashboard", label: "Surveillance Monitor", icon: Activity },
  { id: "intelligence", label: "TreeSHAP Forensics", icon: Search }
];

const PLATFORM_TABS = [
  { id: "model", label: "Model Intelligence", icon: SlidersHorizontal },
  { id: "integration", label: "Bank Integrations", icon: Building2 },
  { id: "api_docs", label: "API Reference", icon: Code2 },
  { id: "privacy", label: "Zero-PII Audit", icon: Lock }
];

const SECTIONS = [
  { key: "bank", label: "Client Simulator", icon: Smartphone, tabs: BANK_TABS },
  { key: "analyst", label: "Risk Operations", icon: Shield, tabs: ANALYST_TABS },
  { key: "platform", label: "Platform & Governance", icon: Building2, tabs: PLATFORM_TABS }
];

const CUSTOMER_TAB_IDS = ["simulator", "checkout", "result", "landing"];

// ─── Sidebar geometry constants ──────────────────────────────────────────────

const SB_MIN = 176;          // narrowest fully-open width
const SB_MAX = 320;          // widest before clamping
const SB_DEFAULT = 228;
const SB_RAIL = 64;          // collapsed icon-rail width
const SB_SNAP = SB_RAIL + 26; // dragging below this snaps to rail
const SB_WIDTH_KEY = "sp.sidebar.width";
const SB_MODE_KEY = "sp.sidebar.mode"; // "open" | "collapsed" | "closed"

function readStored(key, fallback) {
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
}

function verdictDotColor(status) {
  if (status === "APPROVED" || status === "VERIFIED" || status === "RELEASED") return "var(--emerald)";
  if (status === "SOFT_BLOCKED") return "var(--amber)";
  return "var(--rose)";
}

// ─── Collapsible Section (staggered reveal) ─────────────────────────────────

const sectionItemVariants = {
  open: { opacity: 1, x: 0, transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] } },
  closed: { opacity: 0, x: -6, transition: { duration: 0.1 } }
};

function SidebarSection({ section, activeTab, onSelect, currentTransaction, collapsed }) {
  const containsActive = section.tabs.some(
    (t) => activeTab === t.id || (t.id === "simulator" && activeTab === "checkout")
  );

  // Sections with the active page start expanded and stay user-controlled
  const [open, setOpen] = useState(containsActive);
  useEffect(() => {
    if (containsActive) setOpen(true);
  }, [containsActive]);

  const Icon = section.icon;

  return (
    <div className="sidebar-section">
      <button
        type="button"
        className={`sidebar-section-head ${containsActive ? "contains-active" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={collapsed ? section.label : undefined}
      >
        <Icon size={13} strokeWidth={2} />
        <span className="sb-label">{section.label}</span>
        <ChevronDown
          size={13}
          className="sidebar-chevron sb-label"
          style={{
            transform: open ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 240ms var(--ease-spring)"
          }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="section-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: "hidden" }}
          >
            <motion.div
              initial="closed"
              animate="open"
              exit="closed"
              variants={{
                open: { transition: { staggerChildren: 0.04, delayChildren: 0.03 } },
                closed: { transition: { staggerChildren: 0.015, staggerDirection: -1 } }
              }}
            >
              {section.tabs.map((tab) => {
                if (tab.contextual && !currentTransaction) return null;

                const Icon2 = tab.icon;
                const isActive =
                  activeTab === tab.id || (tab.id === "simulator" && activeTab === "checkout");
                const dotColor =
                  tab.contextual && currentTransaction
                    ? verdictDotColor(currentTransaction.status)
                    : null;

                return (
                  <motion.div key={tab.id} variants={sectionItemVariants}>
                    <button
                      type="button"
                      onClick={() => onSelect(tab.id)}
                      className={`sidebar-item ${isActive ? "is-active" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                      title={collapsed ? tab.label : `Go to ${tab.label}`}
                    >
                      {isActive && (
                        <motion.span
                          layoutId="sidebarActivePill"
                          transition={{ type: "spring", stiffness: 480, damping: 36 }}
                          className="sidebar-active-pill"
                        />
                      )}
                      <Icon2
                        size={15}
                        strokeWidth={isActive ? 2.2 : 1.9}
                        style={{ position: "relative", zIndex: 1, flexShrink: 0 }}
                      />
                      <span className="sb-label" style={{ position: "relative", zIndex: 1 }}>
                        {tab.label}
                      </span>
                      {dotColor && (
                        <span
                          className="sidebar-verdict-dot"
                          style={{ background: dotColor, boxShadow: `0 0 4px ${dotColor}` }}
                        />
                      )}
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function AppSidebar({
  activeTab,
  onSelect,
  currentTransaction,
  backendHealthy,
  mobileOpen,
  onClose,
  selectedRole,
  onRoleChange,
  // desktop state
  mode,
  setMode,
  width,
  setWidth,
  resizing,
  onResizeStart,
  isDesktop
}) {
  const isCustomerView = CUSTOMER_TAB_IDS.includes(activeTab);
  const [statusOpen, setStatusOpen] = useState(false);
  const collapsed = isDesktop && mode === "collapsed";
  const activePerspective = PERSPECTIVES.find((p) => p.id === selectedRole) || PERSPECTIVES[0];

  const visibleSections = SECTIONS.filter((section) => {
    return activePerspective.allowedSections.includes(section.key);
  });

  useEffect(() => {
    if (!statusOpen) return undefined;
    const dismiss = () => setStatusOpen(false);
    window.addEventListener("resize", dismiss);
    return () => window.removeEventListener("resize", dismiss);
  }, [statusOpen]);

  const sidebarClasses = [
    "app-sidebar",
    mobileOpen ? "is-open" : "",
    isDesktop && mode === "collapsed" ? "is-collapsed" : "",
    isDesktop && mode === "closed" ? "is-closed" : "",
    resizing ? "is-resizing" : ""
  ]
    .filter(Boolean)
    .join(" ");

  const inlineWidth = isDesktop && mode === "open" ? { width } : undefined;

  return (
    <>
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            key="sidebar-scrim"
            type="button"
            className="sidebar-scrim"
            aria-label="Close navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside
        className={sidebarClasses}
        aria-label="Primary navigation"
        aria-hidden={isDesktop && mode === "closed" ? true : undefined}
        style={inlineWidth}
      >
        {/* Brand */}
        <div className="sidebar-brand">
          <BrandLogo
            variant={collapsed ? "mark" : "horizontal"}
            emblemSize={26}
            onClick={() => onSelect("landing")}
          />
          {isDesktop && mode === "open" && (
            <div style={{ display: "inline-flex", gap: 4 }}>
              <button
                type="button"
                className="icon-btn sidebar-tool"
                onClick={() => setMode("collapsed")}
                aria-label="Collapse sidebar to icon rail"
                title="Collapse (double-click the edge anytime)"
              >
                <ChevronsLeft size={15} />
              </button>
              <button
                type="button"
                className="icon-btn sidebar-tool"
                onClick={() => setMode("closed")}
                aria-label="Close sidebar"
                title="Close sidebar"
              >
                <X size={15} />
              </button>
            </div>
          )}
          {!isDesktop && (
            <button
              type="button"
              className="icon-btn sidebar-close"
              onClick={onClose}
              aria-label="Close navigation"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Perspective Switcher (clean, zero emojis, Linear-style segmented control) */}
        <div className="persona-switch" role="group" aria-label="Perspective view">
          {PERSPECTIVES.map((seg) => {
            const isSelected = (selectedRole || "all") === seg.id;
            const IconComponent = seg.icon;
            return (
              <button
                key={seg.id}
                type="button"
                className={`persona-seg ${isSelected ? "is-active" : ""}`}
                onClick={() => onRoleChange(seg.id)}
                title={collapsed ? seg.label : `Switch to ${seg.label} perspective`}
                aria-label={seg.label}
              >
                {isSelected && (
                  <motion.span
                    layoutId="personaActivePill"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                    className="persona-active-pill"
                  />
                )}
                <IconComponent size={12} strokeWidth={isSelected ? 2.1 : 1.75} style={{ position: "relative", zIndex: 1 }} />
                <span className="sb-label" style={{ position: "relative", zIndex: 1 }}>
                  {seg.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Overview (always visible) */}
        <button
          type="button"
          onClick={() => onSelect("landing")}
          className={`sidebar-item sidebar-item-lead ${activeTab === "landing" ? "is-active" : ""}`}
          aria-current={activeTab === "landing" ? "page" : undefined}
          title={collapsed ? "Overview" : undefined}
        >
          {activeTab === "landing" && (
            <motion.span
              layoutId="sidebarActivePill"
              transition={{ type: "spring", stiffness: 480, damping: 36 }}
              className="sidebar-active-pill"
            />
          )}
          <Home size={15} strokeWidth={activeTab === "landing" ? 2.2 : 1.9} style={{ position: "relative", zIndex: 1, flexShrink: 0 }} />
          <span className="sb-label" style={{ position: "relative", zIndex: 1 }}>Overview</span>
        </button>

        {/* Persona-grouped collapsible sections */}
        {visibleSections.map((section) => (
          <SidebarSection
            key={section.key}
            section={section}
            activeTab={activeTab}
            onSelect={onSelect}
            currentTransaction={currentTransaction}
            collapsed={collapsed}
          />
        ))}

        {/* Backend Gateway Status */}
        <div className="sidebar-status">
          {statusOpen && (
            <button
              type="button"
              className="status-popover-scrim"
              aria-label="Close gateway status"
              onClick={() => setStatusOpen(false)}
            />
          )}
          <button
            type="button"
            className={`status-chip ${statusOpen ? "is-open" : ""}`}
            onClick={() => setStatusOpen((v) => !v)}
            aria-expanded={statusOpen}
            title="Backend gateway status"
          >
            <span className={backendHealthy ? "live-pulse-dot" : "offline-dot"} />
            <span className="status-chip-label sb-label">{backendHealthy ? "Live" : "Offline"}</span>
            <Cpu size={11} className="sb-label" style={{ color: backendHealthy ? "var(--emerald)" : "var(--rose)" }} />
          </button>

          <AnimatePresence initial={false}>
            {statusOpen && (
              <motion.div
                key="status-detail"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div className="status-detail-card">
                  <div className="section-label" style={{ fontSize: 9 }}>Gateway Endpoint</div>
                  <code>POST /api/v1/fraud/check</code>
                  <p>X-API-KEY scoped &bull; multi-tenant isolated</p>
                  <p>
                    Inference + TreeSHAP:{" "}
                    <strong style={{ color: backendHealthy ? "var(--emerald)" : "var(--rose)" }}>
                      {backendHealthy ? "~8ms" : "unreachable"}
                    </strong>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Expand affordance pinned to the rail bottom */}
        {collapsed && (
          <button
            type="button"
            className="icon-btn sidebar-tool sidebar-expand"
            onClick={() => setMode("open")}
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronsRight size={15} />
          </button>
        )}

        {!collapsed && <div className="sidebar-foot sb-label">SentinelPay v2.0.0 · FastAPI Gateway</div>}
      </aside>
    </>
  );
}

export default function AppShell({
  activeTab,
  setActiveTab,
  currentTransaction,
  backendHealthy,
  selectedRole,
  setSelectedRole
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [internalRole, setInternalRole] = useState(() => readStored("sp.stakeholder.role", "all"));
  const role = selectedRole !== undefined ? selectedRole : internalRole;
  const setRole = setSelectedRole !== undefined ? setSelectedRole : setInternalRole;

  const handleRoleChange = (nextRole) => {
    setRole(nextRole);
    try {
      window.localStorage.setItem("sp.stakeholder.role", nextRole);
    } catch {}
    const meta = PERSPECTIVES.find((p) => p.id === nextRole);
    if (meta?.defaultTab) {
      setActiveTab(meta.defaultTab);
    }
  };

  // Desktop sidebar state: "open" | "collapsed" | "closed"
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(min-width: 901px)").matches
  );
  const [mode, setModeState] = useState(() => readStored(SB_MODE_KEY, "open"));
  const [width, setWidthState] = useState(() => {
    const n = parseInt(readStored(SB_WIDTH_KEY, String(SB_DEFAULT)), 10);
    return Number.isFinite(n) ? Math.min(SB_MAX, Math.max(SB_MIN, n)) : SB_DEFAULT;
  });
  const [resizing, setResizing] = useState(false);

  const setMode = useCallback((next) => {
    setModeState(next);
    try {
      window.localStorage.setItem(SB_MODE_KEY, next);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setWidth = useCallback((next) => {
    setWidthState(next);
    try {
      window.localStorage.setItem(SB_WIDTH_KEY, String(next));
    } catch {
      /* storage unavailable */
    }
  }, []);

  // Track desktop breakpoint (mobile keeps the drawer behavior)
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 901px)");
    const onChange = (e) => setIsDesktop(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Drag-to-resize entry point
  const onResizeStart = (e) => {
    if (!isDesktop || e.button !== 0) return;
    e.preventDefault();
    setResizing(true);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // Drag-to-resize: pointer events with global listeners during drag.
  // Sidebar is anchored at x=0, so the pointer's x IS the target width.
  useEffect(() => {
    if (!resizing) return undefined;

    const onMove = (e) => {
      if (e.clientX < SB_SNAP) {
        // cross the threshold → snap to icon rail live
        setModeState("collapsed");
      } else {
        setModeState("open");
        setWidth(Math.min(SB_MAX, Math.max(SB_MIN, e.clientX)));
      }
    };

    const onUp = () => {
      setResizing(false);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      // persist whichever mode we landed in
      setModeState((m) => {
        try {
          window.localStorage.setItem(SB_MODE_KEY, m);
        } catch {
          /* storage unavailable */
        }
        return m;
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [resizing, setWidth]);

  const handleSelect = (tabId) => {
    setActiveTab(tabId);
    setMobileNavOpen(false);
  };

  return (
    <>
      <AppSidebar
        activeTab={activeTab}
        onSelect={handleSelect}
        currentTransaction={currentTransaction}
        backendHealthy={backendHealthy}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        selectedRole={role}
        onRoleChange={handleRoleChange}
        mode={mode}
        setMode={setMode}
        width={width}
        setWidth={setWidth}
        resizing={resizing}
        onResizeStart={onResizeStart}
        isDesktop={isDesktop}
      />

      {/* Drag-to-resize edge — fixed overlay hugging the sidebar's right edge.
          Shown in open mode AND while dragging so you can drag out of the rail. */}
      {isDesktop && (mode === "open" || resizing) && (
        <div
          className={`sidebar-resizer ${resizing ? "is-dragging" : ""}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize sidebar. Drag, or use arrow keys. Press Enter to collapse."
          aria-valuemin={SB_MIN}
          aria-valuemax={SB_MAX}
          aria-valuenow={mode === "collapsed" ? SB_RAIL : width}
          tabIndex={0}
          title="Drag to resize · double-click to collapse"
          style={{ left: (mode === "collapsed" ? SB_RAIL : width) - 5 }}
          onPointerDown={onResizeStart}
          onDoubleClick={() => setMode("collapsed")}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 48 : 16;
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              const next = Math.max(SB_MIN, width - step);
              setWidth(next);
            } else if (e.key === "ArrowRight") {
              e.preventDefault();
              setWidth(Math.min(SB_MAX, width + step));
            } else if (e.key === "Home") {
              e.preventDefault();
              setWidth(SB_MIN);
            } else if (e.key === "End") {
              e.preventDefault();
              setWidth(SB_MAX);
            } else if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setMode("collapsed");
            }
          }}
        >
          <span className="sidebar-resizer-grip" />
        </div>
      )}

      {/* Mobile drawer trigger (<=900px) */}
      <button
        type="button"
        className="icon-btn mobile-nav-trigger"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={16} />
      </button>

      {/* Desktop reopen trigger when the sidebar is fully closed */}
      {isDesktop && mode === "closed" && (
        <button
          type="button"
          className="icon-btn sidebar-reopen"
          onClick={() => setMode("open")}
          aria-label="Show navigation sidebar"
          title="Show sidebar"
        >
          <Menu size={16} />
        </button>
      )}
    </>
  );
}
