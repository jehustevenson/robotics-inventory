// src/Routes.jsx
import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import ProtectedRoute from "components/ProtectedRoute";
import LoginPage from "./pages/login";
import InventoryManagement from "./pages/inventory-management";
import Dashboard from "./pages/dashboard";
import BorrowAndReturnSystem from "./pages/borrow-and-return-system";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Root → dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />

          {/* Protected — all logged-in users */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/borrow-and-return-system"
            element={
              <ProtectedRoute>
                <BorrowAndReturnSystem />
              </ProtectedRoute>
            }
          />

          {/* Protected — admin only */}
          <Route
            path="/inventory-management"
            element={
              <ProtectedRoute adminOnly>
                <InventoryManagement />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;