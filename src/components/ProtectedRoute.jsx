// src/components/ProtectedRoute.jsx
import React, { useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Navigate } from "react-router-dom";
import { logout, refreshTokenThunk } from "../store/authSlice";

const INACTIVITY_MS = 30 * 60 * 1000; // 30 minutes
const REFRESH_MS    = 20 * 60 * 1000; // refresh token every 20 min

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const dispatch      = useDispatch();
  const { token, role } = useSelector((s) => s.auth);
  const inactivityTimer = useRef(null);
  const refreshTimer    = useRef(null);

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const resetInactivityTimer = useCallback(() => {
    clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(handleLogout, INACTIVITY_MS);
  }, [handleLogout]);

  useEffect(() => {
    if (!token) return;

    // Start inactivity timer
    resetInactivityTimer();

    // Listen for activity
    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, resetInactivityTimer, { passive: true })
    );

    // Periodically refresh the token
    refreshTimer.current = setInterval(() => {
      dispatch(refreshTokenThunk());
    }, REFRESH_MS);

    return () => {
      clearTimeout(inactivityTimer.current);
      clearInterval(refreshTimer.current);
      ACTIVITY_EVENTS.forEach((ev) =>
        window.removeEventListener(ev, resetInactivityTimer)
      );
    };
  }, [token, resetInactivityTimer, dispatch]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;