// src/store/usersSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../services/usersApi";

export const fetchUsers = createAsyncThunk(
  "users/fetch",
  async (_, { rejectWithValue }) => {
    try { return await api.listUsers(); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const createUserThunk = createAsyncThunk(
  "users/create",
  async (payload, { rejectWithValue }) => {
    try { return await api.createUser(payload); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const updateUserThunk = createAsyncThunk(
  "users/update",
  async ({ id, ...patch }, { rejectWithValue }) => {
    try {
      await api.updateUser(id, patch);
      return { id, ...patch };
    } catch (e) { return rejectWithValue(e.message); }
  }
);

export const deleteUserThunk = createAsyncThunk(
  "users/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.deleteUser(id);
      return id;
    } catch (e) { return rejectWithValue(e.message); }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState: {
    items: [],
    loading: false,
    actionLoading: false,
    error: null,
  },
  reducers: {
    clearUsersError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending,   (state) => { state.loading = true; state.error = null; })
      .addCase(fetchUsers.rejected,  (state, { payload }) => { state.loading = false; state.error = payload; })
      .addCase(fetchUsers.fulfilled, (state, { payload }) => { state.loading = false; state.items = payload || []; });

    builder
      .addCase(createUserThunk.pending,   (state) => { state.actionLoading = true; state.error = null; })
      .addCase(createUserThunk.rejected,  (state, { payload }) => { state.actionLoading = false; state.error = payload; })
      .addCase(createUserThunk.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.items.push(payload);
      });

    builder
      .addCase(updateUserThunk.pending,   (state) => { state.actionLoading = true; state.error = null; })
      .addCase(updateUserThunk.rejected,  (state, { payload }) => { state.actionLoading = false; state.error = payload; })
      .addCase(updateUserThunk.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        const idx = state.items.findIndex((u) => u.id === payload.id);
        if (idx !== -1) {
          // Only merge role; password changes aren't reflected in the list.
          if (payload.role !== undefined) state.items[idx].role = payload.role;
        }
      });

    builder
      .addCase(deleteUserThunk.pending,   (state) => { state.actionLoading = true; state.error = null; })
      .addCase(deleteUserThunk.rejected,  (state, { payload }) => { state.actionLoading = false; state.error = payload; })
      .addCase(deleteUserThunk.fulfilled, (state, { payload }) => {
        state.actionLoading = false;
        state.items = state.items.filter((u) => u.id !== payload);
      });
  },
});

export const { clearUsersError } = usersSlice.actions;
export default usersSlice.reducer;
