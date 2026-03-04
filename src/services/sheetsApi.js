// src/services/sheetsApi.js
// ─────────────────────────────────────────────────────────────
//  All requests go to the Express proxy server (/api/sheets)
//  The proxy forwards them to Apps Script server-side,
//  so there are zero CORS issues in the browser.
//
//  Dev:  proxy runs at http://localhost:3001
//  Prod: set VITE_API_URL to your deployed server URL
// ─────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/sheets`
  : "/api/sheets";

console.log("[sheetsApi] API_BASE:", API_BASE);

async function get(action, params = {}) {
  const qs  = new URLSearchParams({ action, ...params }).toString();
  const url = `${API_BASE}?${qs}`;

  let res;
  try {
    res = await fetch(url, { method: "GET" });
  } catch (err) {
    throw new Error(
      `Cannot reach proxy server. Is it running on port 3001? (${err.message})`
    );
  }

  if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);

  const json = await res.json();
  if (json.status === "error") throw new Error(json.message);
  return json.data;
}

async function post(body) {
  let res;
  try {
    res = await fetch(API_BASE, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      `Cannot reach proxy server. Is it running on port 3001? (${err.message})`
    );
  }

  if (!res.ok) throw new Error(`Server error: ${res.status} ${res.statusText}`);

  const json = await res.json();
  if (json.status === "error") throw new Error(json.message);
  return json.data;
}

export const getItems        = ()        => get("getItems");
export const addItem         = (payload) => post({ action: "addItem",    ...payload });
export const updateItem      = (payload) => post({ action: "updateItem", ...payload });
export const deleteItem      = (id)      => post({ action: "deleteItem", id });
export const getTransactions = ()        => get("getTransactions");
export const borrowItem      = (payload) => post({ action: "borrowItem", ...payload });
export const returnItem      = (id)      => post({ action: "returnItem", id });
export const getDashboard    = ()        => get("getDashboard");