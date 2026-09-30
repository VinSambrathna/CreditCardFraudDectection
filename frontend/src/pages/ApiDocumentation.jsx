import React, { useState } from "react";
import {
  Terminal,
  Copy,
  Check,
  ExternalLink
} from "lucide-react";
import { DEMO_INSTITUTIONS } from "../services/api";

export default function ApiDocumentation() {
  const [selectedInst, setSelectedInst] = useState(DEMO_INSTITUTIONS[0]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const fraudCheckCurl = `curl -X POST "http://localhost:8000/api/v1/fraud/check" \\
  -H "Content-Type: application/json" \\
  -H "X-API-KEY: ${selectedInst.apiKey}" \\
  -H "X-INSTITUTION-ID: ${selectedInst.code}" \\
  -d '{
    "transaction_token": "${selectedInst.code}-TX-10029",
    "amount": 1800.00,
    "currency": "USD",
    "payment_method": "KHQR",
    "distance": 850.0,
    "time_delta": 0.15,
    "merchant_risk": 0.85,
    "device_trust": 0.21
  }'`;

  const verificationCurl = `curl -X POST "http://localhost:8000/api/v1/verification/result" \\
  -H "Content-Type: application/json" \\
  -H "X-API-KEY: ${selectedInst.apiKey}" \\
  -H "X-INSTITUTION-ID: ${selectedInst.code}" \\
  -d '{
    "transaction_token": "${selectedInst.code}-TX-10029",
    "verification": "APPROVED",
    "auth_method": "BANK_OTP",
    "reason": "Customer confirmed 6-digit OTP challenge"
  }'`;

  const fraudCheckResponse = `{
  "transaction_token": "${selectedInst.code}-TX-10029",
  "institution_code": "${selectedInst.code}",
  "fraud_probability": 0.8742,
  "risk_level": "HIGH",
  "action": "STEP_UP_REQUIRED",
  "requires_verification": true,
  "status": "SOFT_BLOCKED",
  "currency": "USD",
  "amount": 1800.0,
  "amount_usd": 1800.0,
  "explanation": [
    {
      "feature": "distance",
      "label": "Distance from Home (km)",
      "contribution": 5.4021,
      "direction": "RISK_INCREASING",
      "value": 850.0
    },
    {
      "feature": "device_trust",
      "label": "Device Trust Score",
      "contribution": 2.4812,
      "direction": "RISK_INCREASING",
      "value": 0.21
    }
  ],
  "processed_at": "2026-09-24T10:15:30.123456Z"
}`;

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span className="section-label">Developer Specification</span>
            <span style={{ fontSize: 11, background: "rgba(37, 99, 235, 0.08)", color: "var(--cobalt)", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
              STANDARDIZED API v1
            </span>
          </div>
          <h1 className="page-title">Enterprise Gateway API Specification</h1>
          <p className="page-subtitle">
            Complete integration contract for connecting commercial core banking, KHQR switches, and payment switches to SentinelPay.
          </p>
        </div>

        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          className="btn-island"
          style={{ textDecoration: "none", fontSize: 12, padding: "8px 14px" }}
        >
          <span>Open Interactive Swagger Docs</span>
          <ExternalLink style={{ width: 13, height: 13 }} />
        </a>
      </div>

      {/* Interactive Institution Context Switcher */}
      <div className="bezel-shell" style={{ marginBottom: 24 }}>
        <div className="bezel-core" style={{ padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Terminal style={{ width: 18, height: 18, color: "var(--cobalt)" }} />
              <div>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-1)" }}>Generate Sandbox cURL Snippets</span>
                <span style={{ display: "block", fontSize: 11, color: "var(--text-3)" }}>Select an institution to pre-fill live sandbox headers</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              {DEMO_INSTITUTIONS.map((inst) => (
                <button
                  key={inst.code}
                  type="button"
                  onClick={() => setSelectedInst(inst)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    border: selectedInst.code === inst.code ? "1.5px solid var(--cobalt)" : "1px solid var(--shell-border)",
                    background: selectedInst.code === inst.code ? "var(--cobalt-light)" : "var(--shell-bg)",
                    color: selectedInst.code === inst.code ? "var(--cobalt)" : "var(--text-2)",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {inst.code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Endpoint 1: POST /api/v1/fraud/check */}
      <div className="surface-card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid var(--shell-bg)", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "#2563EB", color: "#FFFFFF", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800, fontFamily: "var(--font-mono)" }}>
              POST
            </span>
            <code style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", fontFamily: "var(--font-mono)" }}>
              /api/v1/fraud/check
            </code>
          </div>
          <span style={{ fontSize: 11, color: "var(--emerald)", fontWeight: 700 }}>
            Latency: &lt; 15ms P99
          </span>
        </div>

        <p style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 16 }}>
          Evaluates an inbound transaction in real time. Normalizes mapped schema fields, computes inference on the active XGBoost ensemble, calculates local TreeSHAP attributions, logs audit history, and returns a synchronous clearance decision.
        </p>

        {/* cURL Snippet */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>Sample cURL Request</span>
            <button
              type="button"
              onClick={() => copyToClipboard(fraudCheckCurl, 1)}
              style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 4, color: "var(--cobalt)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
            >
              {copiedIndex === 1 ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
              <span>{copiedIndex === 1 ? "Copied" : "Copy cURL"}</span>
            </button>
          </div>
          <pre style={{ background: "#0F172A", color: "#38BDF8", padding: "14px", borderRadius: 8, fontSize: 11, fontFamily: "var(--font-mono)", overflowX: "auto", lineHeight: 1.45 }}>
            {fraudCheckCurl}
          </pre>
        </div>

        {/* Synchronous Response */}
        <div>
          <span style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", marginBottom: 6 }}>
            Synchronous 200 OK Response
          </span>
          <pre style={{ background: "#0F172A", color: "#F8FAFC", padding: "14px", borderRadius: 8, fontSize: 11, fontFamily: "var(--font-mono)", overflowX: "auto", lineHeight: 1.45 }}>
            {fraudCheckResponse}
          </pre>
        </div>
      </div>

      {/* Endpoint 2: POST /api/v1/verification/result */}
      <div className="surface-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid var(--shell-bg)", marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ background: "#10B981", color: "#FFFFFF", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800, fontFamily: "var(--font-mono)" }}>
              POST
            </span>
            <code style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", fontFamily: "var(--font-mono)" }}>
              /api/v1/verification/result
            </code>
          </div>
          <span style={{ fontSize: 11, color: "var(--text-3)" }}>
            State Machine Mutation
          </span>
        </div>

        <p style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5, marginBottom: 16 }}>
          Callback endpoint invoked by the bank after customer step-up authentication (OTP or FaceID). Mutates the transaction state from <code style={{ fontFamily: "var(--font-mono)", color: "var(--amber)" }}>SOFT_BLOCKED</code> to <code style={{ fontFamily: "var(--font-mono)", color: "var(--emerald)" }}>RELEASED</code> or <code style={{ fontFamily: "var(--font-mono)", color: "var(--rose)" }}>BLOCKED</code> without redundant re-scoring.
        </p>

        {/* cURL Snippet */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase" }}>Sample cURL Request</span>
            <button
              type="button"
              onClick={() => copyToClipboard(verificationCurl, 2)}
              style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 4, color: "var(--cobalt)", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
            >
              {copiedIndex === 2 ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
              <span>{copiedIndex === 2 ? "Copied" : "Copy cURL"}</span>
            </button>
          </div>
          <pre style={{ background: "#0F172A", color: "#38BDF8", padding: "14px", borderRadius: 8, fontSize: 11, fontFamily: "var(--font-mono)", overflowX: "auto", lineHeight: 1.45 }}>
            {verificationCurl}
          </pre>
        </div>
      </div>
    </div>
  );
}
