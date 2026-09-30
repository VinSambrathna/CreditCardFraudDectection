import React, { useState, useEffect } from "react";
import {
  Building2,
  KeyRound,
  Copy,
  Check,
  Plus,
  Send,
  Sliders,
  ArrowRight
} from "lucide-react";
import {
  DEMO_INSTITUTIONS,
  getInstitutions,
  registerInstitution,
  getInstitutionFieldMappings,
  saveInstitutionFieldMapping,
  gatewayCheckFraud
} from "../services/api";

export default function InstitutionIntegration() {
  const [institutions, setInstitutions] = useState(DEMO_INSTITUTIONS);
  const [selectedInst, setSelectedInst] = useState(DEMO_INSTITUTIONS[0]);
  const [activeTab, setActiveTab] = useState("credentials"); // credentials, mappings, sandbox, register
  const [copiedKey, setCopiedKey] = useState(false);

  // Field Mapping state
  const [mappings, setMappings] = useState({});
  const [newSourceField, setNewSourceField] = useState("");
  const [newTargetField, setNewTargetField] = useState("amount");
  const [isSavingMapping, setIsSavingMapping] = useState(false);

  // Sandbox Tester state
  const [testPayload, setTestPayload] = useState(JSON.stringify({
    transaction_token: "TEST-PING-001",
    amount: 15.00,
    currency: "USD",
    payment_method: "KHQR",
    distance: 1.5,
    time_delta: 12.0,
    merchant_risk: 0.08,
    device_trust: 0.98
  }, null, 2));
  const [testResponse, setTestResponse] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testLatency, setTestLatency] = useState(null);

  // New Institution registration form
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState("BANK");
  const [isRegistering, setIsRegistering] = useState(false);
  const [regSuccess, setRegSuccess] = useState(null);

  // Load institutions and mappings from backend
  useEffect(() => {
    async function loadData() {
      try {
        const instList = await getInstitutions();
        if (instList && instList.length > 0) {
          // Merge API keys from DEMO_INSTITUTIONS
          const merged = instList.map((inst) => {
            const demo = DEMO_INSTITUTIONS.find((d) => d.code === inst.institution_code);
            return {
              ...inst,
              apiKey: demo ? demo.apiKey : `${inst.institution_code.toLowerCase()}_sandbox_key_active`,
              code: inst.institution_code
            };
          });
          setInstitutions(merged);
        }
      } catch (err) {
        console.error("Failed to load institutions", err);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    async function loadMappings() {
      if (!selectedInst) return;
      try {
        const data = await getInstitutionFieldMappings(selectedInst.code || selectedInst.institution_code);
        setMappings(data || {});
      } catch (err) {
        console.error("Failed to load mappings", err);
      }
    }
    loadMappings();
  }, [selectedInst]);

  const handleCopyKey = () => {
    if (selectedInst?.apiKey) {
      navigator.clipboard.writeText(selectedInst.apiKey);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleAddMapping = async (e) => {
    e.preventDefault();
    if (!newSourceField.trim()) return;
    setIsSavingMapping(true);
    try {
      await saveInstitutionFieldMapping(selectedInst.code || selectedInst.institution_code, {
        source_field: newSourceField.trim(),
        sentinelpay_field: newTargetField
      });
      setMappings((prev) => ({ ...prev, [newSourceField.trim()]: newTargetField }));
      setNewSourceField("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingMapping(false);
    }
  };

  const handleRunSandboxTest = async () => {
    setIsTesting(true);
    setTestResponse(null);
    setTestLatency(null);
    const start = performance.now();
    try {
      const parsed = JSON.parse(testPayload);
      const res = await gatewayCheckFraud(parsed, selectedInst.apiKey, selectedInst.code || selectedInst.institution_code);
      const elapsed = Math.round(performance.now() - start);
      setTestResponse(res);
      setTestLatency(elapsed);
    } catch (err) {
      setTestResponse({ error: err.message || "Failed to execute test check" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!newName || !newCode) return;
    setIsRegistering(true);
    setRegSuccess(null);
    try {
      const created = await registerInstitution({
        name: newName,
        institution_code: newCode.toUpperCase(),
        institution_type: newType,
        environment: "SANDBOX"
      });
      const newInstObj = {
        ...created,
        code: created.institution_code,
        apiKey: `${created.institution_code.toLowerCase()}_sandbox_key_${Math.floor(Date.now() / 1000) % 10000}`
      };
      setInstitutions((prev) => [...prev, newInstObj]);
      setSelectedInst(newInstObj);
      setRegSuccess(`Successfully onboarded ${newName} into SentinelPay Sandbox.`);
      setNewName("");
      setNewCode("");
      setActiveTab("credentials");
    } catch (err) {
      alert(err.message);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="section-label">Enterprise B2B Integration</span>
            <span style={{ fontSize: 11, background: "rgba(37, 99, 235, 0.08)", color: "var(--cobalt)", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
              INSTITUTION PORTAL
            </span>
          </div>
          <h1 className="page-title">Institution Onboarding &amp; API Integration</h1>
          <p className="page-subtitle">
            Configure financial institutions, issue API credentials, manage schema field normalization, and test live Gateway connections.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setActiveTab("register")}
          className="btn-island"
          style={{ fontSize: 12, padding: "7px 14px" }}
        >
          <Plus style={{ width: 14, height: 14 }} />
          <span>Onboard New Institution</span>
        </button>
      </div>

      {/* Institution Selector Pills */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 20 }}>
        {institutions.map((inst) => {
          const isSelected = (selectedInst.code || selectedInst.institution_code) === (inst.code || inst.institution_code);
          return (
            <button
              key={inst.id || inst.code}
              type="button"
              onClick={() => setSelectedInst(inst)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: isSelected ? "1.5px solid var(--cobalt)" : "1px solid var(--shell-border)",
                background: isSelected ? "#FFFFFF" : "var(--shell-bg)",
                boxShadow: isSelected ? "0 2px 8px rgba(37, 99, 235, 0.1)" : "none",
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                whiteSpace: "nowrap",
                fontSize: 12,
                fontWeight: isSelected ? 700 : 500,
                color: isSelected ? "var(--text-1)" : "var(--text-2)"
              }}
            >
              <Building2 style={{ width: 14, height: 14, color: isSelected ? "var(--cobalt)" : "var(--text-3)" }} />
              <span>{inst.name}</span>
              <span style={{ fontSize: 10, fontFamily: "var(--font-mono)", background: "rgba(15, 23, 42, 0.05)", padding: "1px 5px", borderRadius: 4 }}>
                {inst.code || inst.institution_code}
              </span>
            </button>
          );
        })}
      </div>

      {/* Institution Status Card */}
      <div className="bezel-shell" style={{ marginBottom: 20 }}>
        <div className="bezel-core" style={{ padding: "18px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "var(--cobalt-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--cobalt)" }}>
                <Building2 style={{ width: 20, height: 20 }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-1)" }}>
                  {selectedInst.name}
                </h3>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11.5, color: "var(--text-3)" }}>
                  <span>Code: <strong style={{ fontFamily: "var(--font-mono)", color: "var(--text-1)" }}>{selectedInst.code || selectedInst.institution_code}</strong></span>
                  <span>&bull;</span>
                  <span>Environment: <strong>{selectedInst.environment || "SANDBOX"}</strong></span>
                  <span>&bull;</span>
                  <span>Status: <strong style={{ color: "var(--emerald)" }}>ACTIVE</strong></span>
                </div>
              </div>
            </div>

            {/* Health Strip */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11.5, color: "var(--text-2)", background: "var(--shell-bg)", padding: "6px 14px", borderRadius: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span className="live-pulse-dot" />
                <span>API Gateway: <strong>Connected</strong></span>
              </div>
              <span>&bull;</span>
              <div>ML Engine: <strong>Healthy</strong></div>
              <span>&bull;</span>
              <div>State Machine: <strong>Operational</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div style={{ display: "flex", gap: 6, borderBottom: "1px solid var(--shell-border)", paddingBottom: 10, marginBottom: 20 }}>
        {[
          { id: "credentials", label: "API Credentials", icon: KeyRound },
          { id: "mappings", label: "Schema Field Mapping", icon: Sliders },
          { id: "sandbox", label: "Sandbox Connection Test", icon: Send },
          { id: "register", label: "Onboard Institution", icon: Plus },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: isActive ? "var(--cobalt-light)" : "transparent",
                color: isActive ? "var(--cobalt)" : "var(--text-2)",
                fontSize: 12.5,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <Icon style={{ width: 14, height: 14 }} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: API Credentials */}
      {activeTab === "credentials" && (
        <div className="surface-card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
            Sandbox Integration Credentials
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>
            Use these credentials to authenticate calls from the bank's core payment system to the SentinelPay Integration Gateway.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 650 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
                Institution Code (Tenant ID)
              </label>
              <input
                type="text"
                readOnly
                value={selectedInst.code || selectedInst.institution_code}
                className="input-machined"
                style={{ fontFamily: "var(--font-mono)", fontWeight: 700, background: "var(--shell-bg)" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
                Active Sandbox API Key
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  readOnly
                  value={selectedInst.apiKey || "aba_sandbox_live_key_9f83a"}
                  className="input-machined"
                  style={{ fontFamily: "var(--font-mono)", fontSize: 12, paddingRight: 90, background: "var(--shell-bg)" }}
                />
                <button
                  type="button"
                  onClick={handleCopyKey}
                  style={{
                    position: "absolute",
                    right: 6,
                    top: "50%",
                    transform: "translateY(-50%)",
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--shell-border)",
                    background: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  {copiedKey ? <Check style={{ width: 12, height: 12, color: "var(--emerald)" }} /> : <Copy style={{ width: 12, height: 12 }} />}
                  <span>{copiedKey ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <span style={{ display: "block", fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>
                Transmit in HTTP header: <code style={{ fontFamily: "var(--font-mono)", color: "var(--cobalt)" }}>X-API-KEY: {selectedInst.apiKey || "aba_sandbox_live_key_9f83a"}</code>
              </span>
            </div>

            <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(37, 99, 235, 0.04)", border: "1px solid rgba(37, 99, 235, 0.12)", fontSize: 11.5, color: "var(--text-2)" }}>
              <strong style={{ color: "var(--text-1)" }}>Security Note:</strong> Keys are tenant-isolated. Requests using this API key will only read and write data scoped to <strong>{selectedInst.name}</strong>, preventing IDOR vulnerabilities.
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Schema Field Mapping */}
      {activeTab === "mappings" && (
        <div className="surface-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>
                Schema Field Normalization Mappings
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                Translate bank-specific payload JSON keys into standardized SentinelPay ML feature vectors.
              </p>
            </div>
          </div>

          {/* Current Mappings Table */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "8px 12px", background: "var(--shell-bg)", borderRadius: 8, fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>
              <span>Bank Source Field (Inbound JSON)</span>
              <span>SentinelPay Standard Feature</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
              {Object.keys(mappings).length === 0 ? (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>
                  No custom field mappings defined yet. Standard SentinelPay schema fields apply.
                </div>
              ) : (
                Object.entries(mappings).map(([src, tgt]) => (
                  <div key={src} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "8px 12px", background: "#FFFFFF", border: "1px solid var(--shell-border)", borderRadius: 8, fontSize: 12 }}>
                    <code style={{ fontFamily: "var(--font-mono)", color: "var(--text-1)" }}>{src}</code>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--cobalt)", fontWeight: 600 }}>
                      <span aria-hidden="true">→</span>
                      <code style={{ fontFamily: "var(--font-mono)" }}>{tgt}</code>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Add Mapping Form */}
          <form onSubmit={handleAddMapping} style={{ display: "grid", gridTemplateColumns: "1.5fr 1.5fr 1fr", gap: 10, alignItems: "flex-end", borderTop: "1px solid var(--shell-bg)", paddingTop: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
                Inbound Source Field
              </label>
              <input
                type="text"
                value={newSourceField}
                onChange={(e) => setNewSourceField(e.target.value)}
                placeholder="e.g. transactionAmount"
                className="input-machined"
                style={{ fontSize: 12 }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
                Map To SentinelPay Feature
              </label>
              <select
                value={newTargetField}
                onChange={(e) => setNewTargetField(e.target.value)}
                className="input-machined"
                style={{ fontSize: 12 }}
              >
                <option value="amount">amount (Transaction Amount)</option>
                <option value="currency">currency (ISO Currency)</option>
                <option value="payment_method">payment_method (KHQR/Card)</option>
                <option value="distance">distance (Geolocation Delta km)</option>
                <option value="time_delta">time_delta (Hours Inactive)</option>
                <option value="merchant_risk">merchant_risk (Merchant Category Risk)</option>
                <option value="device_trust">device_trust (Device Trust Confidence)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSavingMapping}
              className="btn-island"
              style={{ height: 38, justifyContent: "center" }}
            >
              <span>{isSavingMapping ? "Saving..." : "Add Mapping"}</span>
              <Plus style={{ width: 14, height: 14 }} />
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Sandbox Connection Test */}
      {activeTab === "sandbox" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Request Payload Editor */}
          <div className="surface-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                Inbound Test Request Payload
              </h3>
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--cobalt)" }}>
                POST /api/v1/fraud/check
              </span>
            </div>

            <textarea
              rows={12}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="input-machined"
              style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, resize: "vertical", lineHeight: 1.5 }}
            />

            <button
              type="button"
              onClick={handleRunSandboxTest}
              disabled={isTesting}
              className="btn-island"
              style={{ width: "100%", marginTop: 12, justifyContent: "center" }}
            >
              <Send style={{ width: 14, height: 14 }} />
              <span>{isTesting ? "Executing API Screening..." : `Execute Sandbox Check (${selectedInst.code})`}</span>
            </button>
          </div>

          {/* Response Inspector */}
          <div className="surface-card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}>
                Gateway Synchronous Response
              </h3>
              {testLatency && (
                <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--emerald)", fontWeight: 700 }}>
                  Roundtrip: {testLatency}ms
                </span>
              )}
            </div>

            {testResponse ? (
              <pre
                style={{
                  background: "#0F172A",
                  color: "#38BDF8",
                  padding: "14px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  maxHeight: 290,
                  overflowY: "auto",
                  lineHeight: 1.4
                }}
              >
                {JSON.stringify(testResponse, null, 2)}
              </pre>
            ) : (
              <div style={{ padding: "40px 10px", textAlign: "center", color: "var(--text-3)", fontSize: 12 }}>
                Click "Execute Sandbox Check" to test live API communication with the SentinelPay gateway using {selectedInst.name}'s credentials.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Onboard New Institution Form */}
      {activeTab === "register" && (
        <div className="surface-card" style={{ maxWidth: 540 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
            Register New Financial Institution
          </h3>
          <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 16 }}>
            Onboard a simulated commercial bank or fintech processor into the SentinelPay platform.
          </p>

          {regSuccess && (
            <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--emerald-light)", color: "var(--emerald)", fontSize: 12, fontWeight: 600, marginBottom: 16 }}>
              {regSuccess}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
                Institution Official Name
              </label>
              <input
                type="text"
                placeholder="e.g. Sathapana Bank"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="input-machined"
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
                Unique Institution Code
              </label>
              <input
                type="text"
                placeholder="e.g. SATHAPANA"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="input-machined"
                style={{ fontFamily: "var(--font-mono)" }}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-1)", marginBottom: 4 }}>
                Institution Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="input-machined"
              >
                <option value="BANK">Commercial Bank</option>
                <option value="FINTECH">Digital Wallet / Fintech</option>
                <option value="PAYMENT_PROCESSOR">Payment Gateway Processor</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="btn-island"
              style={{ marginTop: 6, justifyContent: "center" }}
            >
              <span>{isRegistering ? "Provisioning Sandbox..." : "Provision Institution Sandbox"}</span>
              <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
