import React, { useMemo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import TabNavigation from "components/ui/TabNavigation";
import LoadingIndicator from "components/ui/LoadingIndicator";
import MetricCard from "./components/MetricCard";
import BorrowedItemsTable from "./components/BorrowedItemsTable";
import QuickActionCard from "./components/QuickActionCard";
import Icon from "components/AppIcon";

const Dashboard = () => {
  const { items, transactions } = useSelector((state) => state?.inventory);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Auto-refresh simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefreshed(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const metrics = useMemo(() => {
    const totalItems = items?.length;
    const activeBorrows = transactions?.filter((t) => !t?.returned);
    const totalBorrowed = activeBorrows?.reduce((sum, t) => sum + t?.quantity, 0);
    const totalAvailable = items?.reduce((sum, item) => {
      const borrowed = activeBorrows?.filter((t) => t?.itemId === item?.id)?.reduce((s, t) => s + t?.quantity, 0);
      return sum + (item?.totalQuantity - borrowed);
    }, 0);
    return { totalItems, totalBorrowed, totalAvailable };
  }, [items, transactions]);

  const borrowedTransactions = useMemo(
    () => transactions?.filter((t) => !t?.returned)?.sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate)),
    [transactions]
  );

  const quickActions = [
    { title: "Inventory", description: "Browse, add, edit, or delete robotic equipment items.", iconName: "Package", route: "/inventory-management", variant: "outline" },
    { title: "Borrow", description: "Check out equipment for your class session.", iconName: "ArrowUpFromLine", route: "/borrow-and-return-system", variant: "default" },
    { title: "Return", description: "Mark borrowed items as returned and update availability.", iconName: "ArrowDownToLine", route: "/borrow-and-return-system", variant: "secondary" },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <TabNavigation onTabChange={setActiveTab} />
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
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted-foreground)] bg-[var(--color-muted)] px-3 py-2 rounded-[var(--radius-sm)]">
            <Icon name="RefreshCw" size={13} color="currentColor" strokeWidth={2} />
            <span>
              Last refreshed:{" "}
              {lastRefreshed?.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {loading ? (
          <LoadingIndicator isLoading message="Loading dashboard data..." />
        ) : (
          <>
            {/* Metric Cards */}
            <section aria-label="Summary metrics" className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
              <MetricCard
                title="Total Items"
                value={metrics?.totalItems}
                iconName="Archive"
                colorClass="text-[var(--color-primary)]"
                bgClass="bg-blue-50"
                description="Unique equipment types"
              />
              <MetricCard
                title="Total Borrowed"
                value={metrics?.totalBorrowed}
                iconName="ArrowUpFromLine"
                colorClass="text-amber-600"
                bgClass="bg-amber-50"
                description="Units currently checked out"
              />
              <MetricCard
                title="Total Available"
                value={metrics?.totalAvailable}
                iconName="PackageCheck"
                colorClass="text-[var(--color-secondary)]"
                bgClass="bg-green-50"
                description="Units ready to borrow"
              />
            </section>

            {/* Quick Actions */}
            <section aria-label="Quick actions" className="mb-6 md:mb-8">
              <h2 className="text-base md:text-lg font-semibold text-[var(--color-foreground)] mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                {quickActions?.map((action) => (
                  <QuickActionCard key={action?.title} {...action} />
                ))}
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
                      {borrowedTransactions?.length}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Showing all unreturned equipment
                  </p>
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