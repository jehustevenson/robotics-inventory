// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import inventoryReducer from "./inventorySlice";
import authReducer from "./authSlice";

const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    auth:      authReducer,
  },
});

export default store;