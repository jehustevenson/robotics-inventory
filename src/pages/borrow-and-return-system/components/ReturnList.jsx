// src/pages/borrow-and-return-system/components/ReturnList.jsx
import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { format } from 'date-fns';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Input from 'components/ui/Input';

const STATUS_FILTERS = [
  { key: 'unreturned', label: 'Not Returned', icon: 'Clock'        },
  { key: 'returned',   label: 'Returned',     icon: 'CheckCircle'  },
  { key: 'all',        label: 'All',          icon: 'List'         },
];

// Anything borrowed for more than this many days is flagged overdue.
const OVERDUE_DAYS = 14;

function daysSince(date) {
  const ms = Date.now() - new Date(date).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function safeDate(val) {
  try {
    const d = new Date(val);
    return isNaN(d) ? '—' : format(d, 'MM/dd/yyyy hh:mm a');
  } catch { return '—'; }
}

// Memoized row — when the parent re-renders (e.g. filter or search
// changes) only rows whose props actually change will re-render.
const TxnRow = React.memo(function TxnRow({
  t, canReturn, isConfirming, isThisReturning, loading,
  onConfirmOpen, onConfirmCancel, onConfirmReturn,
}) {
  const isReturned = String(t.returned) === 'true';
  const daysOut    = t.borrowDate ? daysSince(t.borrowDate) : 0;
  const overdue    = !isReturned && daysOut > OVERDUE_DAYS;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 md:p-4 rounded-[var(--radius-md)] border transition-all"
      style={{
        borderColor:     overdue ? 'rgba(220,38,38,0.35)' : isReturned ? 'var(--color-border)' : 'rgba(232,90,79,0.25)',
        backgroundColor: overdue ? 'rgba(220,38,38,0.05)' : isReturned ? 'var(--color-background)' : 'rgba(232,90,79,0.04)',
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="font-semibold text-sm truncate" style={{ color: 'var(--color-foreground)', fontFamily: 'var(--font-heading)' }}>
            {t.itemName}
          </span>
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              backgroundColor: isReturned ? 'rgba(34,197,94,0.12)' : 'rgba(232,90,79,0.12)',
              color:           isReturned ? 'var(--color-success)'  : 'var(--color-accent)',
              fontFamily: 'var(--font-caption)',
            }}
          >
            <Icon name={isReturned ? 'CheckCircle' : 'Clock'} size={11} color="currentColor" strokeWidth={2.5} />
            {isReturned ? 'Returned' : 'Not Returned'}
          </span>
          {overdue && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800"
              title={`Borrowed ${daysOut} days ago — overdue by ${daysOut - OVERDUE_DAYS} day(s)`}
              style={{ fontFamily: 'var(--font-caption)' }}
            >
              <Icon name="AlertTriangle" size={11} color="currentColor" strokeWidth={2.5} />
              Overdue
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-caption)' }}>
            <Icon name="User" size={12} color="currentColor" strokeWidth={2} />
            {t.teacherName}
          </span>
          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-caption)' }}>
            <Icon name="Hash" size={12} color="currentColor" strokeWidth={2} />
            Qty: <strong style={{ color: 'var(--color-foreground)' }}>{t.quantity}</strong>
          </span>
          <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-caption)' }}>
            <Icon name="Calendar" size={12} color="currentColor" strokeWidth={2} />
            Borrowed: {safeDate(t.borrowDate)}
          </span>
          {isReturned && t.returnDate && (
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-caption)' }}>
              <Icon name="RotateCcw" size={12} color="currentColor" strokeWidth={2} />
              Returned: {safeDate(t.returnDate)}
            </span>
          )}
        </div>
      </div>

      {!isReturned && canReturn && (
        <div className="flex-shrink-0">
          {isConfirming ? (
            <div className="flex gap-2">
              <Button
                variant="success"
                size="sm"
                loading={isThisReturning}
                disabled={loading}
                onClick={() => onConfirmReturn(t.id)}
              >
                Confirm
              </Button>
              <Button variant="ghost" size="sm" onClick={onConfirmCancel}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="success"
              size="sm"
              disabled={loading}
              iconName="RotateCcw"
              iconPosition="left"
              onClick={() => onConfirmOpen(t.id)}
            >
              Mark Returned
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

const ReturnList = ({ transactions, onReturn, loading, returningId }) => {
  const { username, role } = useSelector((s) => s.auth);
  const isAdmin = role === 'admin';

  const [filterStatus, setFilterStatus] = useState('unreturned');
  const [search,       setSearch]       = useState('');
  const [confirmId,    setConfirmId]    = useState(null);

  // Admin can return anything; teachers can only return what they borrowed.
  // Fallback to teacherName for legacy rows created before the borrowedBy
  // column existed.
  const canReturnTxn = useCallback((t) => {
    if (isAdmin) return true;
    const owner = t.borrowedBy || t.teacherName;
    return String(owner) === String(username);
  }, [isAdmin, username]);

  const filtered = transactions?.filter(t => {
    const matchStatus =
      filterStatus === 'all'        ? true :
      filterStatus === 'returned'   ? String(t.returned) === 'true' :
                                      String(t.returned) !== 'true';
    const matchSearch = !search.trim() ||
      t.itemName?.toLowerCase().includes(search.toLowerCase()) ||
      t.teacherName?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  }) ?? [];

  // Stable handlers so TxnRow's React.memo can actually skip re-renders.
  // Without useCallback each parent render would produce new function
  // identities, defeating memoization entirely.
  const onConfirmOpen = useCallback((id) => setConfirmId(id), []);
  const onConfirmCancel = useCallback(() => setConfirmId(null), []);
  const onConfirmReturn = useCallback(async (id) => {
    await onReturn(id);
    setConfirmId(null);
  }, [onReturn]);

  return (
    <div className="bg-[var(--color-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-md)] p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center" style={{ backgroundColor: 'var(--color-secondary)' }}>
          <Icon name="PackageCheck" size={18} color="white" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}>
            Transaction Records
          </h2>
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-caption)' }}>
            Manage returns and view borrow history
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 p-1 rounded-[var(--radius-sm)]" style={{ backgroundColor: 'var(--color-muted)' }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${filterStatus === f.key ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
              style={{
                fontFamily: 'var(--font-caption)',
                color: filterStatus === f.key ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
              }}
            >
              <Icon name={f.icon} size={13} color="currentColor" strokeWidth={2} />
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search by item or teacher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Icon name="PackageSearch" size={40} color="var(--color-muted-foreground)" strokeWidth={1.5} />
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-caption)' }}>
            No transactions found.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
          {filtered.map(t => (
            <TxnRow
              key={t.id}
              t={t}
              canReturn={canReturnTxn(t)}
              isConfirming={confirmId === t.id}
              isThisReturning={loading && returningId === t.id}
              loading={loading}
              onConfirmOpen={onConfirmOpen}
              onConfirmCancel={onConfirmCancel}
              onConfirmReturn={onConfirmReturn}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReturnList;