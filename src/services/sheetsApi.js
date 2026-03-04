// src/services/sheetsApi.js
// ─────────────────────────────────────────────────────────────
//  Replace SCRIPT_URL with your deployed Apps Script Web App URL
//  e.g. https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
// ─────────────────────────────────────────────────────────────

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || "";

async function get(action, params = {}) {
  const qs = new URLSearchParams({ action, ...params }).toString();
  const url = `${SCRIPT_URL}?${qs}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Network error: ${res.status}`);
  const json = await res.json();
  if (json.status === "error") throw new Error(json.message);
  return json.data;
}

async function post(body) {
  const res = await fetch(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" }, // required for Apps Script CORS
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Network error: ${res.status}`);
  const json = await res.json();
  if (json.status === "error") throw new Error(json.message);
  return json.data;
}

// ── Items ─────────────────────────────────────────────────────
export const getItems = () => get("getItems");

export const addItem = ({ name, category, totalQuantity }) =>
  post({ action: "addItem", name, category, totalQuantity });

export const updateItem = ({ id, name, category, totalQuantity }) =>
  post({ action: "updateItem", id, name, category, totalQuantity });

export const deleteItem = (id) =>
  post({ action: "deleteItem", id });

// ── Transactions ──────────────────────────────────────────────
export const getTransactions = () => get("getTransactions");

export const borrowItem = ({ itemId, itemName, category, quantity, teacherName }) =>
  post({ action: "borrowItem", itemId, itemName, category, quantity, teacherName });

export const returnItem = (id) =>
  post({ action: "returnItem", id });

// ── Dashboard (single combined fetch) ────────────────────────
export const getDashboard = () => get("getDashboard");
