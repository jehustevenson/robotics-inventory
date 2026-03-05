import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Icon from 'components/AppIcon';

const NAV_TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: 'LayoutDashboard',
    ariaLabel: 'Go to Dashboard - view availability metrics and borrowing activity',
  },
  {
    id: 'inventory-management',
    label: 'Inventory',
    path: '/inventory-management',
    icon: 'Package',
    ariaLabel: 'Go to Inventory Management - browse and manage equipment catalog',
  },
  {
    id: 'borrow-and-return-system',
    label: 'Borrow & Return',
    path: '/borrow-and-return-system',
    icon: 'ArrowLeftRight',
    ariaLabel: 'Go to Borrow & Return System - checkout and return equipment',
  },
];

const TabNavigation = ({ onTabChange }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    const current = NAV_TABS?.find(tab => location?.pathname?.startsWith(tab?.path));
    if (current) {
      setActiveTab(current?.id);
    }
  }, [location?.pathname]);

  const handleTabClick = useCallback((tab) => {
    setActiveTab(tab?.id);
    setMobileMenuOpen(false);
    navigate(tab?.path);
    if (onTabChange) onTabChange(tab?.id);
  }, [navigate, onTabChange]);

  const handleKeyDown = useCallback((e, tab, index) => {
    if (e?.key === 'Enter' || e?.key === ' ') {
      e?.preventDefault();
      handleTabClick(tab);
    }
    if (e?.key === 'ArrowRight') {
      e?.preventDefault();
      const next = NAV_TABS?.[(index + 1) % NAV_TABS?.length];
      document.getElementById(`tab-${next?.id}`)?.focus();
    }
    if (e?.key === 'ArrowLeft') {
      e?.preventDefault();
      const prev = NAV_TABS?.[(index - 1 + NAV_TABS?.length) % NAV_TABS?.length];
      document.getElementById(`tab-${prev?.id}`)?.focus();
    }
  }, [handleTabClick]);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  return (
    <nav
      className="tab-nav"
      role="navigation"
      aria-label="Main application navigation"
    >
      {/* Top bar */}
      <div className="tab-nav-container">
        {/* Brand / Logo */}
        <div className="tab-nav-brand">
          <div className="tab-nav-logo" aria-hidden="true">
            <Icon name="Bot" size={20} color="currentColor" strokeWidth={2} />
          </div>
          <span className="tab-nav-brand-text">GIS Robotics Inventory</span>
        </div>

        {/* Desktop Tabs */}
        <div
          className="tab-nav-tabs"
          role="tablist"
          aria-label="Application sections"
        >
          {NAV_TABS?.map((tab, index) => (
            <button
              key={tab?.id}
              id={`tab-${tab?.id}`}
              role="tab"
              aria-selected={activeTab === tab?.id}
              aria-label={tab?.ariaLabel}
              tabIndex={activeTab === tab?.id ? 0 : -1}
              className={`tab-nav-item${activeTab === tab?.id ? ' active' : ''}`}
              onClick={() => handleTabClick(tab)}
              onKeyDown={(e) => handleKeyDown(e, tab, index)}
            >
              <Icon
                name={tab?.icon}
                size={18}
                color="currentColor"
                strokeWidth={activeTab === tab?.id ? 2.5 : 2}
              />
              <span>{tab?.label}</span>
            </button>
          ))}
        </div>

        {/* Right actions area */}
        <div className="tab-nav-actions">
          <button
            className="tab-nav-mobile-toggle"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
            onClick={toggleMobileMenu}
          >
            <Icon
              name={mobileMenuOpen ? 'X' : 'Menu'}
              size={22}
              color="currentColor"
              strokeWidth={2}
            />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        id="mobile-nav-menu"
        className={`tab-nav-mobile-menu${mobileMenuOpen ? ' open' : ''}`}
        role="menu"
        aria-label="Mobile navigation menu"
      >
        {NAV_TABS?.map((tab) => (
          <button
            key={tab?.id}
            role="menuitem"
            aria-label={tab?.ariaLabel}
            className={`tab-nav-mobile-item${activeTab === tab?.id ? ' active' : ''}`}
            onClick={() => handleTabClick(tab)}
          >
            <Icon
              name={tab?.icon}
              size={20}
              color="currentColor"
              strokeWidth={activeTab === tab?.id ? 2.5 : 2}
            />
            <span>{tab?.label}</span>
            {activeTab === tab?.id && (
              <Icon
                name="Check"
                size={16}
                color="currentColor"
                strokeWidth={2.5}
                className="ml-auto"
              />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default React.memo(TabNavigation);