// src/store/inventorySlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../services/sheetsApi";

// ── Async Thunks ──────────────────────────────────────────────

export const fetchDashboard = createAsyncThunk(
  "inventory/fetchDashboard",
  async (_, { rejectWithValue }) => {
    try { return await api.getDashboard(); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const fetchItems = createAsyncThunk(
  "inventory/fetchItems",
  async (_, { rejectWithValue }) => {
    try { return await api.getItems(); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const fetchTransactions = createAsyncThunk(
  "inventory/fetchTransactions",
  async (_, { rejectWithValue }) => {
    try { return await api.getTransactions(); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const addItemThunk = createAsyncThunk(
  "inventory/addItem",
  async (payload, { rejectWithValue }) => {
    try { return await api.addItem(payload); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const updateItemThunk = createAsyncThunk(
  "inventory/updateItem",
  async (payload, { rejectWithValue }) => {
    try { return await api.updateItem(payload); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const deleteItemThunk = createAsyncThunk(
  "inventory/deleteItem",
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteItem(id);
      return id;
    } catch (e) { return rejectWithValue(e.message); }
  }
);

export const borrowItemThunk = createAsyncThunk(
  "inventory/borrowItem",
  async (payload, { rejectWithValue }) => {
    try { return await api.borrowItem(payload); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const returnItemThunk = createAsyncThunk(
  "inventory/returnItem",
  async (id, { rejectWithValue }) => {
    try { return await api.returnItem(id); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

// ── Slice ─────────────────────────────────────────────────────
const inventorySlice = createSlice({
  name: "inventory",
  initialState: {
    items: [],
    transactions: [],
    loading: false,
    actionLoading: false, // for add/edit/delete/borrow/return
    error: null,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {

    // helper to mark loading start/end
    const pending  = (state) => { state.loading = true;  state.error = null; };
    const rejected = (state, action) => {
      state.loading = false;
      state.actionLoading = false;
      state.error = action.payload || "Something went wrong";
    };

    // ── fetchDashboard ────────────────────────────────────────
    builder
      .addCase(fetchDashboard.pending,  pending)
      .addCase(fetchDashboard.rejected, rejected)
      .addCase(fetchDashboard.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items        = payload.items        || [];
        state.transactions = payload.transactions || [];
      });

    // ── fetchItems ────────────────────────────────────────────
    builder
      .addCase(fetchItems.pending,  pending)
      .addCase(fetchItems.rejected, rejected)
      .addCase(fetchItems.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = payload || [];
      });

    // ── fetchTransactions ─────────────────────────────────────
    builder
      .addCase(fetchTransactions.pending,  pending)
      .addCase(fetchTransactions.rejected, rejected)
      .addCase(fetchTransactions.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.transactions = payload || [];
      });

    // ── addItem ───────────────────────────────────────────────
    builder
      .addCase(addItemThunk.pending,  (state) => { state.actionLoading = true; state.error = null; })
      .addCase(addItemThunk.rejected, rejected)
      .addCase(addItemThunk.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.items.push(payload);
      });

    // ── updateItem ────────────────────────────────────────────
    builder
      .addCase(updateItemThunk.pending,  (state) => { state.actionLoading = true; state.error = null; })
      .addCase(updateItemThunk.rejected, rejected)
      .addCase(updateItemThunk.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        const idx = state.items.findIndex(i => i.id === payload.id);
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...payload };
      });

    // ── deleteItem ────────────────────────────────────────────
    builder
      .addCase(deleteItemThunk.pending,  (state) => { state.actionLoading = true; state.error = null; })
      .addCase(deleteItemThunk.rejected, rejected)
      .addCase(deleteItemThunk.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.items = state.items.filter(i => i.id !== payload);
      });

    // ── borrowItem ────────────────────────────────────────────
    builder
      .addCase(borrowItemThunk.pending,  (state) => { state.actionLoading = true; state.error = null; })
      .addCase(borrowItemThunk.rejected, rejected)
      .addCase(borrowItemThunk.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.transactions.unshift(payload);
      });

    // ── returnItem ────────────────────────────────────────────
    builder
      .addCase(returnItemThunk.pending,  (state) => { state.actionLoading = true; state.error = null; })
      .addCase(returnItemThunk.rejected, rejected)
      .addCase(returnItemThunk.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        const idx = state.transactions.findIndex(t => t.id === payload.id);
        if (idx !== -1) {
          state.transactions[idx].returned   = true;
          state.transactions[idx].returnDate = payload.returnDate;
        }
      });
  },
});

export const { clearError } = inventorySlice.actions;
export default inventorySlice.reducer;