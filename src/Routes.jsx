// src/Routes.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes as RouterRoutes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import ProtectedRoute from "components/ProtectedRoute";
import LoadingIndicator from "components/ui/LoadingIndicator";

// LoginPage stays eager so the login screen renders immediately (no flash
// of the Suspense fallback at auth time). Every other page is lazy, so
// the initial bundle only ships what's needed to sign in.
import LoginPage from "./pages/login";

const Dashboard              = lazy(() => import("./pages/dashboard"));
const InventoryManagement    = lazy(() => import("./pages/inventory-management"));
const BorrowAndReturnSystem  = lazy(() => import("./pages/borrow-and-return-system"));
const UserManagement         = lazy(() => import("./pages/user-management"));
const NotFound               = lazy(() => import("pages/NotFound"));

// Full-page fallback while a route chunk loads. Matches the app's
// background and shows a thin loading bar so the transition feels
// intentional rather than broken.
const RouteFallback = () => (
  <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
    <LoadingIndicator isLoading bar />
  </div>
);

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>
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
            <Route
              path="/user-management"
              element={
                <ProtectedRoute adminOnly>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
