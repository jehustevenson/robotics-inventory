import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import InventoryManagement from './pages/inventory-management';
import Dashboard from './pages/dashboard';
import BorrowAndReturnSystem from './pages/borrow-and-return-system';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      <ScrollToTop />
      <RouterRoutes>
        {/* Define your route here */}
        <Route path="/" element={<BorrowAndReturnSystem />} />
        <Route path="/inventory-management" element={<InventoryManagement />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/borrow-and-return-system" element={<BorrowAndReturnSystem />} />
        <Route path="*" element={<NotFound />} />
      </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
