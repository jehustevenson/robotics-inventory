// src/pages/borrow-and-return-system/index.jsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchItems, fetchTransactions,
  borrowItemThunk, returnItemThunk,
  clearError,
} from "../../store/inventorySlice";
import TabNavigation from "components/ui/TabNavigation";
import LoadingIndicator from "components/ui/LoadingIndicator";
import Icon from "components/AppIcon";
import BorrowForm from "./components/BorrowForm";
import ReturnList from "./components/ReturnList";

const BorrowAndReturnSystem = () => {
  const dispatch = useDispatch();
  const { items, transactions, loading, actionLoading, error } = useSelector((s) => s.inventory);
  const [toast, setToast]       = useState(null);
  const [returningId, setReturningId] = useState(null);

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchItems());
    dispatch(fetchTransactions());
  }, [dispatch]);

  // Surface API errors
  useEffect(() => {
    if (error) { showToast(error, "error"); dispatch(clearError()); }
  }, [error, dispatch]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Compute availability
  const inventory = useMemo(() => {
    const active = transactions.filter((t) => String(t.returned) !== "true");
    return items.map((item) => {
      const borrowed = active
        .filter((t) => t.itemId === item.id)
        .reduce((s, t) => s + Number(t.quantity || 0), 0);
      return {
        ...item,
        id:       item.id,
        name:     item.name,
        category: item.category,
        total:    Number(item.totalQuantity),
        borrowed,
        available: Number(item.totalQuantity) - borrowed,
      };
    });
  }, [items, transactions]);

  const handleBorrow = useCallback(async ({ itemId, quantity, teacherName }) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return { success: false };
    if (item.available < quantity) {
      showToast(`Only ${item.available} unit(s) available.`, "error");
      return { success: false };
    }
    const res = await dispatch(borrowItemThunk({
      itemId, quantity, teacherName,
      itemName: item.name, category: item.category,
    }));
    if (res.error) return { success: false };
    showToast(`${quantity} × ${item.name} borrowed!`);
    return { success: true };
  }, [inventory, dispatch, showToast]);

  const handleReturn = useCallback(async (txnId) => {
    setReturningId(txnId);
    const res = await dispatch(returnItemThunk(txnId));
    setReturningId(null);
    if (!res.error) {
      const txn = transactions.find((t) => t.id === txnId);
      showToast(`${txn?.itemName || "Item"} marked as returned!`);
    }
  }, [transactions, dispatch, showToast]);

  // Stats
  const active       = transactions.filter((t) => String(t.returned) !== "true");
  const totalBorrowed   = active.reduce((s, t) => s + Number(t.quantity || 0), 0);
  const totalAvailable  = inventory.reduce((s, i) => s + i.available, 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--color-background)" }}>
      <TabNavigation />
      <LoadingIndicator isLoading={loading} bar />

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] max-w-sm"
          style={{ backgroundColor: toast.type === "success" ? "var(--color-success)" : "var(--color-error)", color: "white" }}
          role="alert"
        >
          <Icon name={toast.type === "success" ? "CheckCircle" : "AlertCircle"} size={18} color="white" strokeWidth={2} />
          <span className="text-sm font-medium" style={{ fontFamily: "var(--font-caption)" }}>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto opacity-80 hover:opacity-100">
            <Icon name="X" size={16} color="white" strokeWidth={2} />
          </button>
        </div>
      )}

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingIndicator isLoading message="Loading from Google Sheets…" />
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          {/* Header */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-primary)" }}>
              Borrow &amp; Return System
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
              Checkout and return robotic teaching equipment
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            {[
              { label: "Total Items",          value: inventory.length, icon: "Package",        color: "var(--color-primary)"   },
              { label: "Currently Borrowed",   value: totalBorrowed,    icon: "PackageMinus",   color: "var(--color-accent)"    },
              { label: "Total Available",      value: totalAvailable,   icon: "PackageCheck",   color: "var(--color-secondary)" },
              { label: "Active Transactions",  value: active.length,    icon: "ArrowLeftRight", color: "var(--color-warning)"   },
            ].map((stat) => (
              <div key={stat.label}
                className="bg-[var(--color-card)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-3 md:p-4 flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${stat.color}18` }}>
                  <Icon name={stat.icon} size={18} color={stat.color} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold leading-none" style={{ color: stat.color, fontFamily: "var(--font-data)" }}>{stat.value}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <BorrowForm inventory={inventory} onBorrow={handleBorrow} loading={actionLoading} />
            <ReturnList transactions={transactions} onReturn={handleReturn} loading={actionLoading} returningId={returningId} />
          </div>
        </main>
      )}
    </div>
  );
};

export default BorrowAndReturnSystem;