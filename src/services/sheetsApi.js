// src/services/sheetsApi.js
// ─────────────────────────────────────────────────────────────
//  Apps Script CORS fix:
//  - GET requests work fine cross-origin with redirect: "follow"
//  - POST requests must use Content-Type: text/plain (NOT application/json)
//  - Both must use redirect: "follow" — Apps Script issues a redirect
// ─────────────────────────────────────────────────────────────

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_SCRIPT_URL || "";

if (!SCRIPT_URL) {
  console.error("[sheetsApi] VITE_GOOGLE_SCRIPT_URL is not set in your .env file");
}

async function get(action, params = {}) {
  const qs  = new URLSearchParams({ action, ...params }).toString();
  const url = `${SCRIPT_URL}?${qs}`;

  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
  });

  if (!res.ok) throw new Error(`Network error: ${res.status}`);

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error("Invalid JSON from Apps Script: " + text.slice(0, 200)); }

  if (json.status === "error") throw new Error(json.message);
  return json.data;
}

async function post(body) {
  const res = await fetch(SCRIPT_URL, {
    method:   "POST",
    redirect: "follow",
    headers:  { "Content-Type": "text/plain;charset=utf-8" },
    body:     JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Network error: ${res.status}`);

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); }
  catch { throw new Error("Invalid JSON from Apps Script: " + text.slice(0, 200)); }

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