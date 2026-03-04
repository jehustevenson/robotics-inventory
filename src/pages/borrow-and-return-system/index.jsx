import React, { useState, useEffect, useCallback } from 'react';
import TabNavigation from 'components/ui/TabNavigation';
import LoadingIndicator from 'components/ui/LoadingIndicator';
import Icon from 'components/AppIcon';
import BorrowForm from './components/BorrowForm';
import ReturnList from './components/ReturnList';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_INVENTORY = [
  { id: 'inv-1', name: 'Arduino Uno R3', category: 'Microcontrollers', total: 20, borrowed: 5 },
  { id: 'inv-2', name: 'Raspberry Pi 4 Model B', category: 'Microcontrollers', total: 10, borrowed: 3 },
  { id: 'inv-3', name: 'Ultrasonic Sensor HC-SR04', category: 'Sensors', total: 30, borrowed: 8 },
  { id: 'inv-4', name: 'IR Infrared Sensor Module', category: 'Sensors', total: 25, borrowed: 2 },
  { id: 'inv-5', name: 'DC Motor 6V', category: 'Motors', total: 40, borrowed: 10 },
  { id: 'inv-6', name: 'Servo Motor SG90', category: 'Motors', total: 35, borrowed: 7 },
  { id: 'inv-7', name: 'LEGO Mindstorms EV3 Kit', category: 'Kits', total: 8, borrowed: 2 },
  { id: 'inv-8', name: 'Arduino Starter Kit', category: 'Kits', total: 15, borrowed: 4 },
  { id: 'inv-9', name: 'Temperature & Humidity Sensor DHT11', category: 'Sensors', total: 20, borrowed: 0 },
  { id: 'inv-10', name: 'Stepper Motor 28BYJ-48', category: 'Motors', total: 18, borrowed: 3 },
];

const INITIAL_TRANSACTIONS = [
  { id: 'txn-1', itemId: 'inv-1', itemName: 'Arduino Uno R3', teacherName: 'Ms. Sarah Johnson', quantity: 3, borrowedAt: '2026-02-28T09:15:00', returned: false, returnedAt: null },
  { id: 'txn-2', itemId: 'inv-3', itemName: 'Ultrasonic Sensor HC-SR04', teacherName: 'Mr. David Chen', quantity: 5, borrowedAt: '2026-02-27T14:30:00', returned: false, returnedAt: null },
  { id: 'txn-3', itemId: 'inv-5', itemName: 'DC Motor 6V', teacherName: 'Ms. Emily Rodriguez', quantity: 4, borrowedAt: '2026-02-26T10:00:00', returned: true, returnedAt: '2026-03-01T11:20:00' },
  { id: 'txn-4', itemId: 'inv-2', itemName: 'Raspberry Pi 4 Model B', teacherName: 'Mr. James Wilson', quantity: 2, borrowedAt: '2026-02-25T08:45:00', returned: false, returnedAt: null },
  { id: 'txn-5', itemId: 'inv-7', itemName: 'LEGO Mindstorms EV3 Kit', teacherName: 'Ms. Sarah Johnson', quantity: 2, borrowedAt: '2026-02-24T13:00:00', returned: true, returnedAt: '2026-02-28T15:30:00' },
  { id: 'txn-6', itemId: 'inv-6', itemName: 'Servo Motor SG90', teacherName: 'Mr. David Chen', quantity: 3, borrowedAt: '2026-03-01T09:00:00', returned: false, returnedAt: null },
  { id: 'txn-7', itemId: 'inv-4', itemName: 'IR Infrared Sensor Module', teacherName: 'Ms. Emily Rodriguez', quantity: 2, borrowedAt: '2026-03-02T11:30:00', returned: false, returnedAt: null },
  { id: 'txn-8', itemId: 'inv-8', itemName: 'Arduino Starter Kit', teacherName: 'Mr. James Wilson', quantity: 4, borrowedAt: '2026-03-03T14:00:00', returned: true, returnedAt: '2026-03-04T09:15:00' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const computeInventory = (baseInventory, transactions) =>
  baseInventory?.map(item => {
    const activeBorrowed = transactions?.filter(t => t?.itemId === item?.id && !t?.returned)?.reduce((sum, t) => sum + t?.quantity, 0);
    return { ...item, borrowed: activeBorrowed, available: item?.total - activeBorrowed };
  });

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Page ─────────────────────────────────────────────────────────────────────
const BorrowAndReturnSystem = () => {
  const [baseInventory] = useState(INITIAL_INVENTORY);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [inventory, setInventory] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [returnLoading, setReturnLoading] = useState(false);
  const [returningId, setReturningId] = useState(null);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState('borrow-return');

  // Compute derived inventory whenever transactions change
  useEffect(() => {
    setInventory(computeInventory(baseInventory, transactions));
  }, [baseInventory, transactions]);

  // Simulate initial load
  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleBorrow = useCallback(async ({ itemId, quantity, teacherName }) => {
    setBorrowLoading(true);
    await sleep(700);
    const item = inventory?.find(i => i?.id === itemId);
    if (!item || item?.available < quantity) {
      showToast(`Insufficient stock. Only ${item?.available ?? 0} unit(s) available.`, 'error');
      setBorrowLoading(false);
      return { success: false };
    }
    const newTxn = {
      id: `txn-${Date.now()}`,
      itemId,
      itemName: item?.name,
      teacherName,
      quantity,
      borrowedAt: new Date()?.toISOString(),
      returned: false,
      returnedAt: null,
    };
    setTransactions(prev => [newTxn, ...prev]);
    showToast(`${quantity} x ${item?.name} borrowed successfully!`, 'success');
    setBorrowLoading(false);
    return { success: true };
  }, [inventory, showToast]);

  const handleReturn = useCallback(async (txnId) => {
    setReturnLoading(true);
    setReturningId(txnId);
    await sleep(600);
    setTransactions(prev =>
      prev?.map(t => t?.id === txnId ? { ...t, returned: true, returnedAt: new Date()?.toISOString() } : t)
    );
    const txn = transactions?.find(t => t?.id === txnId);
    showToast(`${txn?.itemName} marked as returned!`, 'success');
    setReturnLoading(false);
    setReturningId(null);
  }, [transactions, showToast]);

  // Stats
  const totalBorrowed = transactions?.filter(t => !t?.returned)?.reduce((s, t) => s + t?.quantity, 0);
  const totalAvailable = inventory?.reduce((s, i) => s + i?.available, 0);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <TabNavigation onTabChange={setActiveTab} />
      <LoadingIndicator isLoading={pageLoading} overlay message="Loading borrow & return system..." />
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] shadow-[var(--shadow-lg)] max-w-sm"
          style={{
            backgroundColor: toast?.type === 'success' ? 'var(--color-success)' : 'var(--color-error)',
            color: 'white',
          }}
          role="alert"
        >
          <Icon name={toast?.type === 'success' ? 'CheckCircle' : 'AlertCircle'} size={18} color="white" strokeWidth={2} />
          <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-caption)' }}>{toast?.message}</span>
          <button onClick={() => setToast(null)} className="ml-auto opacity-80 hover:opacity-100">
            <Icon name="X" size={16} color="white" strokeWidth={2} />
          </button>
        </div>
      )}
      {!pageLoading && (
        <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
          {/* Page Header */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-primary)' }}>
                  Borrow &amp; Return System
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-caption)' }}>
                  Checkout and return robotic teaching equipment
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-caption)' }}>
                <Icon name="RefreshCw" size={12} color="currentColor" strokeWidth={2} />
                Auto-refreshed on action
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
            {[
              { label: 'Total Items', value: inventory?.length, icon: 'Package', color: 'var(--color-primary)' },
              { label: 'Currently Borrowed', value: totalBorrowed, icon: 'PackageMinus', color: 'var(--color-accent)' },
              { label: 'Total Available', value: totalAvailable, icon: 'PackageCheck', color: 'var(--color-secondary)' },
              { label: 'Active Transactions', value: transactions?.filter(t => !t?.returned)?.length, icon: 'ArrowLeftRight', color: 'var(--color-warning)' },
            ]?.map(stat => (
              <div
                key={stat?.label}
                className="bg-[var(--color-card)] rounded-[var(--radius-md)] border border-[var(--color-border)] shadow-[var(--shadow-sm)] p-3 md:p-4 flex items-center gap-3"
              >
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-[var(--radius-sm)] flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${stat?.color}18` }}>
                  <Icon name={stat?.icon} size={18} color={stat?.color} strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold leading-none" style={{ color: stat?.color, fontFamily: 'var(--font-data)' }}>{stat?.value}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-caption)' }}>{stat?.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content: Borrow Form + Return List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <BorrowForm
              inventory={inventory}
              onBorrow={handleBorrow}
              loading={borrowLoading}
            />
            <ReturnList
              transactions={transactions}
              onReturn={handleReturn}
              loading={returnLoading}
              returningId={returningId}
            />
          </div>
        </main>
      )}
    </div>
  );
};

export default BorrowAndReturnSystem;