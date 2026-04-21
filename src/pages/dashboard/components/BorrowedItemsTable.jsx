import React from "react";
import Icon from "components/AppIcon";
import { format } from "date-fns";

const categoryColors = {
  Microcontrollers: "bg-blue-100 text-blue-800",
  Sensors: "bg-purple-100 text-purple-800",
  Motors: "bg-orange-100 text-orange-800",
  Kits: "bg-green-100 text-green-800",
};

// Anything borrowed for more than this many days is flagged overdue.
const OVERDUE_DAYS = 14;

function daysSince(date) {
  const ms = Date.now() - new Date(date).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function isOverdue(borrowDate) {
  if (!borrowDate) return false;
  return daysSince(borrowDate) > OVERDUE_DAYS;
}

const BorrowedItemsTable = ({ borrowedTransactions }) => {
  if (borrowedTransactions?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[var(--color-muted-foreground)]">
        <Icon name="PackageCheck" size={48} color="currentColor" strokeWidth={1.5} />
        <p className="mt-4 text-base font-semibold">No items currently borrowed</p>
        <p className="text-sm mt-1">All equipment is available for use.</p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm" aria-label="Currently borrowed items">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]">
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-muted-foreground)] font-[var(--font-caption)]">Item Name</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-muted-foreground)] font-[var(--font-caption)]">Category</th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--color-muted-foreground)] font-[var(--font-caption)]">Qty</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-muted-foreground)] font-[var(--font-caption)]">Teacher</th>
              <th className="text-left px-4 py-3 font-semibold text-[var(--color-muted-foreground)] font-[var(--font-caption)]">Borrow Date</th>
              <th className="text-center px-4 py-3 font-semibold text-[var(--color-muted-foreground)] font-[var(--font-caption)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {borrowedTransactions?.map((tx, idx) => (
              <tr
                key={tx?.id}
                className={`border-b border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors ${idx % 2 === 0 ? "" : "bg-[var(--color-background)]"}`}
              >
                <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">{tx?.itemName}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${categoryColors?.[tx?.category] || "bg-gray-100 text-gray-700"}`}>
                    {tx?.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-[var(--font-data)] font-semibold text-[var(--color-primary)]">{tx?.quantity}</td>
                <td className="px-4 py-3 text-[var(--color-foreground)]">{tx?.teacherName}</td>
                <td className="px-4 py-3 text-[var(--color-muted-foreground)] font-[var(--font-data)] text-xs">
                  {format(new Date(tx.borrowDate), "MM/dd/yyyy HH:mm")}
                </td>
                <td className="px-4 py-3 text-center">
                  {isOverdue(tx?.borrowDate) ? (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800"
                      title={`Borrowed ${daysSince(tx.borrowDate)} days ago`}
                    >
                      <Icon name="AlertTriangle" size={12} color="currentColor" strokeWidth={2} />
                      Overdue
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      <Icon name="Clock" size={12} color="currentColor" strokeWidth={2} />
                      Borrowed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile Cards */}
      <div className="md:hidden flex flex-col gap-3">
        {borrowedTransactions?.map((tx) => (
          <div key={tx?.id} className="bg-[var(--color-background)] rounded-[var(--radius-md)] p-4 border border-[var(--color-border)]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-foreground)] text-sm line-clamp-1">{tx?.itemName}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${categoryColors?.[tx?.category] || "bg-gray-100 text-gray-700"}`}>
                  {tx?.category}
                </span>
              </div>
              {isOverdue(tx?.borrowDate) ? (
                <span
                  className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800"
                  title={`Borrowed ${daysSince(tx.borrowDate)} days ago`}
                >
                  <Icon name="AlertTriangle" size={11} color="currentColor" strokeWidth={2} />
                  Overdue
                </span>
              ) : (
                <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                  <Icon name="Clock" size={11} color="currentColor" strokeWidth={2} />
                  Borrowed
                </span>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--color-muted-foreground)]">
              <div>
                <span className="font-semibold text-[var(--color-foreground)]">Teacher:</span> {tx?.teacherName}
              </div>
              <div>
                <span className="font-semibold text-[var(--color-foreground)]">Qty:</span>{" "}
                <span className="font-[var(--font-data)] text-[var(--color-primary)] font-bold">{tx?.quantity}</span>
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-[var(--color-foreground)]">Date:</span>{" "}
                <span className="font-[var(--font-data)]">{format(new Date(tx.borrowDate), "MM/dd/yyyy HH:mm")}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default BorrowedItemsTable;