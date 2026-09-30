/**
 * SentinelPay - API Service Client
 * Connects React frontend to FastAPI multi-tenant risk & integration engine.
 */

const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";
export const API_BASE_URL = import.meta.env.VITE_API_URL || `http://${hostname}:8000`;

// Default Sandbox Credentials for Demo Institutions
export const DEMO_INSTITUTIONS = [
  { id: 1, name: "ABA Bank (Simulated)", code: "ABA", apiKey: "aba_sandbox_live_key_9f83a", currency: "USD", defaultLocation: "Phnom Penh" },
  { id: 2, name: "ACLEDA Bank (Simulated)", code: "ACLEDA", apiKey: "acleda_sandbox_live_key_7c41b", currency: "USD", defaultLocation: "Siem Reap" },
  { id: 3, name: "Wing Bank (Simulated)", code: "WING", apiKey: "wing_sandbox_live_key_2e19d", currency: "KHR", defaultLocation: "Phnom Penh" },
  { id: 4, name: "Canadia Bank (Simulated)", code: "CANADIA", apiKey: "canadia_sandbox_live_key_5a38f", currency: "USD", defaultLocation: "Battambang" },
  { id: 5, name: "Demo Fintech (Simulated)", code: "FINTECH01", apiKey: "fintech_sandbox_live_key_8d24e", currency: "USD", defaultLocation: "Sihanoukville" },
];

// -------------------------------------------------------------
// Enterprise Gateway Endpoints (/api/v1/...)
// -------------------------------------------------------------

export async function gatewayCheckFraud(payload, apiKey = "aba_sandbox_live_key_9f83a", instCode = "ABA") {
  const res = await fetch(`${API_BASE_URL}/api/v1/fraud/check`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
      "X-INSTITUTION-ID": instCode
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Gateway network error" }));
    throw new Error(err.detail || "Gateway transaction screening failed");
  }
  return res.json();
}

export async function gatewaySubmitVerification({ transaction_token, verification = "APPROVED", auth_method = "BANK_OTP", reason = "" }, apiKey = "aba_sandbox_live_key_9f83a", instCode = "ABA") {
  const res = await fetch(`${API_BASE_URL}/api/v1/verification/result`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey,
      "X-INSTITUTION-ID": instCode
    },
    body: JSON.stringify({
      transaction_token,
      verification,
      auth_method,
      reason
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Verification resolution failed" }));
    throw new Error(err.detail || "Step-up verification callback failed");
  }
  return res.json();
}

export async function getGatewayTransaction(token, apiKey = "aba_sandbox_live_key_9f83a") {
  const res = await fetch(`${API_BASE_URL}/api/v1/transactions/${token}`, {
    headers: { "X-API-KEY": apiKey }
  });
  if (!res.ok) throw new Error(`Transaction ${token} not found`);
  return res.json();
}

export async function getInstitutions() {
  const res = await fetch(`${API_BASE_URL}/api/v1/institutions`);
  if (!res.ok) throw new Error("Failed to load institutions");
  return res.json();
}

export async function registerInstitution(data) {
  const res = await fetch(`${API_BASE_URL}/api/v1/institutions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Registration failed" }));
    throw new Error(err.detail || "Failed to register institution");
  }
  return res.json();
}

export async function getInstitutionFieldMappings(code) {
  const res = await fetch(`${API_BASE_URL}/api/v1/institutions/${code}/field-mappings`);
  if (!res.ok) return {};
  return res.json();
}

export async function saveInstitutionFieldMapping(code, data) {
  const res = await fetch(`${API_BASE_URL}/api/v1/institutions/${code}/field-mappings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to save field mapping");
  return res.json();
}

export async function getAuditLogs(institutionId = null, limit = 50) {
  const url = institutionId
    ? `${API_BASE_URL}/api/v1/audit-logs?institution_id=${institutionId}&limit=${limit}`
    : `${API_BASE_URL}/api/v1/audit-logs?limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load audit logs");
  return res.json();
}

// -------------------------------------------------------------
// Real-Time WebSocket Alerts Connection
// -------------------------------------------------------------

export function connectAlertWebSocket({ institutionId = null, onMessage, onError, onOpen, onClose }) {
  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = API_BASE_URL.replace(/^https?:\/\//, "");
  const url = institutionId
    ? `${wsProtocol}//${host}/ws/alerts?institution_id=${institutionId}`
    : `${wsProtocol}//${host}/ws/alerts`;

  let ws = null;
  try {
    ws = new WebSocket(url);
    ws.onopen = () => {
      if (onOpen) onOpen();
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (onMessage) onMessage(data);
      } catch (e) {
        console.error("WS Parse error", e);
      }
    };
    ws.onerror = (err) => {
      if (onError) onError(err);
    };
    ws.onclose = () => {
      if (onClose) onClose();
    };
  } catch (err) {
    console.error("WS Connection init failed", err);
  }
  return ws;
}

// -------------------------------------------------------------
// Legacy & Compatibility Endpoints
// -------------------------------------------------------------

export async function predictTransaction(payload) {
  const res = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Network error" }));
    throw new Error(err.detail || "Transaction authorization failed");
  }
  return res.json();
}

export async function verifyTransaction({ transaction_token, otp_code = "123456", action = "APPROVE" }) {
  const res = await fetch(`${API_BASE_URL}/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transaction_token, otp_code, action })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Verification failed" }));
    throw new Error(err.detail || "Verification challenge failed");
  }
  return res.json();
}

export async function getTransactions(limit = 50, institutionId = null) {
  const url = institutionId
    ? `${API_BASE_URL}/transactions?limit=${limit}&institution_id=${institutionId}`
    : `${API_BASE_URL}/transactions?limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load audit transactions");
  return res.json();
}

export async function getTransaction(token) {
  const res = await fetch(`${API_BASE_URL}/transactions/${token}`);
  if (!res.ok) throw new Error(`Transaction ${token} not found`);
  return res.json();
}

export async function getDashboardStatistics(institutionId = null) {
  const url = institutionId
    ? `${API_BASE_URL}/dashboard/statistics?institution_id=${institutionId}`
    : `${API_BASE_URL}/dashboard/statistics`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to load dashboard metrics");
  return res.json();
}

export async function getModelInfo() {
  const res = await fetch(`${API_BASE_URL}/model/info`);
  if (!res.ok) throw new Error("Failed to load model intelligence");
  return res.json();
}

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
