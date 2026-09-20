/**
 * SentinelPay - API Service Client
 * Connects React frontend directly to FastAPI risk engine.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

export async function getTransactions(limit = 50) {
  const res = await fetch(`${API_BASE_URL}/transactions?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to load audit transactions");
  return res.json();
}

export async function getTransaction(token) {
  const res = await fetch(`${API_BASE_URL}/transactions/${token}`);
  if (!res.ok) throw new Error(`Transaction ${token} not found`);
  return res.json();
}

export async function getDashboardStatistics() {
  const res = await fetch(`${API_BASE_URL}/dashboard/statistics`);
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
