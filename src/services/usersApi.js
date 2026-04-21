// src/services/usersApi.js
// Admin-only user management. Hits /api/users on the Node proxy, which
// handles bcrypt hashing server-side so plaintext passwords never touch
// Google Sheets or leave the server boundary.
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/users`
  : "/api/users";

function getToken() {
  return localStorage.getItem("rbl_token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, { method = "GET", body } = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { ...authHeaders() };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(`Cannot reach server. Is it running on port 3001? (${err.message})`);
  }

  if (res.status === 401 || res.status === 403) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.message || "Not authorized.");
  }

  const json = await res.json();
  if (json.status === "error") throw new Error(json.message);
  return json.data;
}

export const listUsers   = ()                     => request("");
export const createUser  = ({ username, password, role }) =>
  request("", { method: "POST", body: { username, password, role } });
export const updateUser  = (id, patch)            =>
  request(`/${id}`, { method: "PATCH", body: patch });
export const deleteUser  = (id)                   =>
  request(`/${id}`, { method: "DELETE" });
