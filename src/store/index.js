// src/store/index.js
import { configureStore } from "@reduxjs/toolkit";
import inventoryReducer from "./inventorySlice";
import authReducer from "./authSlice";
import usersReducer from "./usersSlice";

const store = configureStore({
  reducer: {
    inventory: inventoryReducer,
    auth:      authReducer,
    users:     usersReducer,
  },
});

export default store;