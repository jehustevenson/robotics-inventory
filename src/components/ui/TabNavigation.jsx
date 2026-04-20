// src/components/ui/TabNavigation.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../store/authSlice";
import Icon from "components/AppIcon";

const ALL_TABS = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: "LayoutDashboard",
    ariaLabel: "Go to Dashboard",
    adminOnly: false,
  },
  {
    id: "inventory-management",
    label: "Inventory",
    path: "/inventory-management",
    icon: "Package",
    ariaLabel: "Go to Inventory Management",
    adminOnly: true,
  },
  {
    id: "borrow-and-return-system",
    label: "Borrow & Return",
    path: "/borrow-and-return-system",
    icon: "ArrowLeftRight",
    ariaLabel: "Go to Borrow & Return System",
    adminOnly: false,
  },
];

const TabNavigation = ({ onTabChange }) => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const dispatch  = useDispatch();
  const { role, username } = useSelector((s) => s.auth);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab,      setActiveTab]      = useState("");

  // Filter tabs based on role
  const NAV_TABS = ALL_TABS.filter((t) => !t.adminOnly || role === "admin");

  useEffect(() => {
    const current = NAV_TABS.find((tab) => location.pathname.startsWith(tab.path));
    if (current) setActiveTab(current.id);
  }, [location.pathname]);

  const handleTabClick = useCallback((tab) => {
    setActiveTab(tab.id);
    setMobileMenuOpen(false);
    navigate(tab.path);
    if (onTabChange) onTabChange(tab.id);
  }, [navigate, onTabChange]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate("/login", { replace: true });
  }, [dispatch, navigate]);

  const handleKeyDown = useCallback((e, tab, index) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTabClick(tab);
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = NAV_TABS[(index + 1) % NAV_TABS.length];
      document.getElementById(`tab-${next.id}`)?.focus();
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = NAV_TABS[(index - 1 + NAV_TABS.length) % NAV_TABS.length];
      document.getElementById(`tab-${prev.id}`)?.focus();
    }
  }, [handleTabClick, NAV_TABS]);

  return (
    <nav className="tab-nav" role="navigation" aria-label="Main application navigation">
      <div className="tab-nav-container">
        {/* Brand */}
        <div className="tab-nav-brand">
          <div className="tab-nav-logo" aria-hidden="true">
            <Icon name="Bot" size={20} color="currentColor" strokeWidth={2} />
          </div>
          <span className="tab-nav-brand-text">GIS Robotics Inventory</span>
        </div>

        {/* Desktop Tabs */}
        <div className="tab-nav-tabs" role="tablist" aria-label="Application sections">
          {NAV_TABS.map((tab, index) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-label={tab.ariaLabel}
              tabIndex={activeTab === tab.id ? 0 : -1}
              className={`tab-nav-item${activeTab === tab.id ? " active" : ""}`}
              onClick={() => handleTabClick(tab)}
              onKeyDown={(e) => handleKeyDown(e, tab, index)}
            >
              <Icon name={tab.icon} size={18} color="currentColor" strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right: user info + logout */}
        <div className="tab-nav-actions">
          {/* Username + role badge (desktop) */}
          <div className="hidden md:flex items-center gap-2 pr-2">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: role === "admin" ? "rgba(33,82,33,0.12)" : "rgba(45,90,61,0.10)",
                color: "var(--color-primary)",
                fontFamily: "var(--font-caption)",
              }}
            >
              <Icon name={role === "admin" ? "ShieldCheck" : "User"} size={13} color="currentColor" strokeWidth={2} />
              <span>{username}</span>
              {role === "admin" && (
                <span className="ml-1 opacity-60 text-[10px] uppercase tracking-wide">Admin</span>
              )}
            </div>
          </div>

          {/* Logout button (desktop) */}
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-red-50 hover:text-red-600"
            style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
            aria-label="Sign out"
          >
            <Icon name="LogOut" size={15} color="currentColor" strokeWidth={2} />
            Sign out
          </button>

          {/* Mobile toggle */}
          <button
            className="tab-nav-mobile-toggle"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            <Icon name={mobileMenuOpen ? "X" : "Menu"} size={22} color="currentColor" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-nav-menu"
        className={`tab-nav-mobile-menu${mobileMenuOpen ? " open" : ""}`}
        role="menu"
        aria-label="Mobile navigation menu"
      >
        {/* Mobile user info */}
        <div
          className="flex items-center gap-2 px-4 py-3 mb-1 rounded-lg"
          style={{ backgroundColor: "var(--color-muted)" }}
        >
          <Icon name={role === "admin" ? "ShieldCheck" : "User"} size={16} color="var(--color-primary)" strokeWidth={2} />
          <span className="text-sm font-semibold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-caption)" }}>
            {username}
          </span>
          {role === "admin" && (
            <span
              className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(33,82,33,0.12)", color: "var(--color-primary)" }}
            >
              Admin
            </span>
          )}
        </div>

        {NAV_TABS.map((tab) => (
          <button
            key={tab.id}
            role="menuitem"
            aria-label={tab.ariaLabel}
            className={`tab-nav-mobile-item${activeTab === tab.id ? " active" : ""}`}
            onClick={() => handleTabClick(tab)}
          >
            <Icon name={tab.icon} size={20} color="currentColor" strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <Icon name="Check" size={16} color="currentColor" strokeWidth={2.5} className="ml-auto" />
            )}
          </button>
        ))}

        {/* Mobile logout */}
        <button
          onClick={handleLogout}
          className="tab-nav-mobile-item"
          style={{ color: "var(--color-error)" }}
          role="menuitem"
        >
          <Icon name="LogOut" size={20} color="currentColor" strokeWidth={2} />
          <span>Sign out</span>
        </button>
      </div>
    </nav>
  );
};

export default React.memo(TabNavigation);