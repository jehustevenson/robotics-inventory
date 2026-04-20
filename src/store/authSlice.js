// src/store/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}`
  : "";

// ── Thunks ────────────────────────────────────────────────────
export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (json.status === "error") return rejectWithValue(json.message);
      return json.data;
    } catch (e) {
      return rejectWithValue("Cannot reach server. Is it running?");
    }
  }
);

export const refreshTokenThunk = createAsyncThunk(
  "auth/refresh",
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return rejectWithValue("No token");
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.status === "error") return rejectWithValue(json.message);
      return json.data;
    } catch (e) {
      return rejectWithValue("Refresh failed");
    }
  }
);

// ── Helpers ───────────────────────────────────────────────────
function loadFromStorage() {
  try {
    const token    = localStorage.getItem("rbl_token");
    const username = localStorage.getItem("rbl_username");
    const role     = localStorage.getItem("rbl_role");
    if (token && username && role) return { token, username, role };
  } catch {}
  return { token: null, username: null, role: null };
}

function saveToStorage({ token, username, role }) {
  localStorage.setItem("rbl_token",    token);
  localStorage.setItem("rbl_username", username);
  localStorage.setItem("rbl_role",     role);
}

function clearStorage() {
  localStorage.removeItem("rbl_token");
  localStorage.removeItem("rbl_username");
  localStorage.removeItem("rbl_role");
}

// ── Slice ─────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState: {
    ...loadFromStorage(),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.token    = null;
      state.username = null;
      state.role     = null;
      state.error    = null;
      clearStorage();
    },
    clearAuthError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(loginThunk.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginThunk.rejected, (state, { payload }) => { state.loading = false; state.error = payload; })
      .addCase(loginThunk.fulfilled, (state, { payload }) => {
        state.loading  = false;
        state.token    = payload.token;
        state.username = payload.username;
        state.role     = payload.role;
        state.error    = null;
        saveToStorage(payload);
      });

    // refresh
    builder
      .addCase(refreshTokenThunk.fulfilled, (state, { payload }) => {
        state.token    = payload.token;
        state.username = payload.username;
        state.role     = payload.role;
        saveToStorage(payload);
      })
      .addCase(refreshTokenThunk.rejected, (state) => {
        // refresh failed — force logout
        state.token    = null;
        state.username = null;
        state.role     = null;
        clearStorage();
      });
  },
});

export const { logout, clearAuthError } = authSlice.actions;
export default authSlice.reducer;