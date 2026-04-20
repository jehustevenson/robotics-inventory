// src/pages/dashboard/index.jsx
import React, { useMemo, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchDashboard } from "../../store/inventorySlice";
import TabNavigation from "components/ui/TabNavigation";
import LoadingIndicator from "components/ui/LoadingIndicator";
import MetricCard from "./components/MetricCard";
import BorrowedItemsTable from "./components/BorrowedItemsTable";
import QuickActionCard from "./components/QuickActionCard";
import Icon from "components/AppIcon";

const Dashboard = () => {
  const dispatch = useDispatch();
  const { items, transactions, loading, error } = useSelector((s) => s.inventory);
  const { role } = useSelector((s) => s.auth);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  useEffect(() => {
    dispatch(fetchDashboard());
  }, [dispatch]);

  // Auto-refresh every 30 s
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(fetchDashboard());
      setLastRefreshed(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const metrics = useMemo(() => {
    const activeBorrows = transactions.filter((t) => String(t.returned) !== "true");
    const totalBorrowed = activeBorrows.reduce((s, t) => s + Number(t.quantity || 0), 0);
    const totalAvailable = items.reduce((sum, item) => {
      const borrowed = activeBorrows
        .filter((t) => t.itemId === item.id)
        .reduce((s, t) => s + Number(t.quantity || 0), 0);
      return sum + (Number(item.totalQuantity) - borrowed);
    }, 0);
    return { totalItems: items.length, totalBorrowed, totalAvailable };
  }, [items, transactions]);

  const borrowedTransactions = useMemo(
    () =>
      transactions
        .filter((t) => String(t.returned) !== "true")
        .sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate)),
    [transactions]
  );

  const quickActions = [
    { title: "Inventory",  description: "Browse, add, edit, or delete robotic equipment items.", iconName: "Package",         route: "/inventory-management",      variant: "outline",   adminOnly: true },
    { title: "Borrow",     description: "Check out equipment for your class session.",            iconName: "ArrowUpFromLine", route: "/borrow-and-return-system",  variant: "default"    },
    { title: "Return",     description: "Mark borrowed items as returned and update availability.", iconName: "ArrowDownToLine",route: "/borrow-and-return-system",  variant: "secondary"  },
  ].filter((a) => !a.adminOnly || role === "admin");

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <TabNavigation />
      <LoadingIndicator isLoading={loading} bar />

      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
              Dashboard
            </h1>
            <p className="text-sm text-[var(--color-muted-foreground)] mt-1">
              Overview of robotic equipment availability and borrowing activity
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { dispatch(fetchDashboard()); setLastRefreshed(new Date()); }}
              className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-muted)] hover:bg-[var(--color-border)] px-3 py-2 rounded-[var(--radius-sm)] transition-colors"
            >
              <Icon name="RefreshCw" size={13} color="currentColor" strokeWidth={2} />
              <span>Refresh · {lastRefreshed.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 rounded-[var(--radius-md)] bg-red-50 border border-red-200 text-red-700 text-sm">
            <Icon name="AlertCircle" size={18} color="currentColor" strokeWidth={2} />
            <span><strong>Could not load data:</strong> {error}. Check your Apps Script URL in <code>.env</code>.</span>
          </div>
        )}

        {loading && items.length === 0 ? (
          <LoadingIndicator isLoading message="Loading dashboard data…" />
        ) : (
          <>
            {/* Metric Cards */}
            <section aria-label="Summary metrics" className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              <MetricCard title="Total Items"     value={metrics.totalItems}     iconName="Archive"       colorClass="text-[var(--color-primary)]"   bgClass="bg-blue-50"   description="Unique equipment types"      />
              <MetricCard title="Total Borrowed"  value={metrics.totalBorrowed}  iconName="ArrowUpFromLine" colorClass="text-amber-600"              bgClass="bg-amber-50"  description="Units currently checked out" />
              <MetricCard title="Total Available" value={metrics.totalAvailable} iconName="PackageCheck"  colorClass="text-[var(--color-secondary)]" bgClass="bg-green-50"  description="Units ready to borrow"       />
            </section>

            {/* Quick Actions */}
            <section aria-label="Quick actions" className="mb-6 md:mb-8">
              <h2 className="text-base md:text-lg font-semibold text-[var(--color-foreground)] mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                {quickActions.map((a) => <QuickActionCard key={a.title} {...a} />)}
              </div>
            </section>

            {/* Currently Borrowed Items */}
            <section aria-label="Currently borrowed items">
              <div className="bg-[var(--color-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-md)] overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 md:px-6 py-4 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <Icon name="ClipboardList" size={20} color="var(--color-primary)" strokeWidth={2} />
                    <h2 className="text-base md:text-lg font-semibold text-[var(--color-foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
                      Currently Borrowed Items
                    </h2>
                    <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {borrowedTransactions.length}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Showing all unreturned equipment</p>
                </div>
                <div className="p-4 md:p-0">
                  <BorrowedItemsTable borrowedTransactions={borrowedTransactions} />
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;