// src/services/sheetsApi.js
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/sheets`
  : "/api/sheets";

function getToken() {
  return localStorage.getItem("rbl_token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function get(action, params = {}) {
  const qs  = new URLSearchParams({ action, ...params }).toString();
  const url = `${API_BASE}?${qs}`;

  let res;
  try {
    res = await fetch(url, { method: "GET", headers: authHeaders() });
  } catch (err) {
    throw new Error(`Cannot reach proxy server. Is it running on port 3001? (${err.message})`);
  }

  if (res.status === 401 || res.status === 403) {
    // Token expired or invalid — clear storage and reload to login
    localStorage.removeItem("rbl_token");
    localStorage.removeItem("rbl_username");
    localStorage.removeItem("rbl_role");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
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
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body:    JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(`Cannot reach proxy server. Is it running on port 3001? (${err.message})`);
  }

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("rbl_token");
    localStorage.removeItem("rbl_username");
    localStorage.removeItem("rbl_role");
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
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