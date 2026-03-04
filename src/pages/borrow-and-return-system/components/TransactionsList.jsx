import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { returnItem } from "../../../store/inventorySlice";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import { format } from "date-fns";

const categoryColors = {
  Microcontrollers: "bg-blue-100 text-blue-800",
  Sensors: "bg-purple-100 text-purple-800",
  Motors: "bg-orange-100 text-orange-800",
  Kits: "bg-green-100 text-green-800",
};

const FILTER_OPTIONS = [
  { value: "all", label: "All Transactions" },
  { value: "borrowed", label: "Not Returned" },
  { value: "returned", label: "Returned" },
];

const TransactionsList = () => {
  const dispatch = useDispatch();
  const { transactions } = useSelector((s) => s?.inventory);
  const [filter, setFilter] = useState("borrowed");
  const [returningId, setReturningId] = useState(null);
  const [confirmReturn, setConfirmReturn] = useState(null);

  const filtered = useMemo(() => {
    let list = [...transactions]?.sort((a, b) => new Date(b.borrowDate) - new Date(a.borrowDate));
    if (filter === "borrowed") return list?.filter((t) => !t?.returned);
    if (filter === "returned") return list?.filter((t) => t?.returned);
    return list;
  }, [transactions, filter]);

  const handleReturn = (id) => {
    setReturningId(id);
    setTimeout(() => {
      dispatch(returnItem(id));
      setReturningId(null);
      setConfirmReturn(null);
    }, 600);
  };

  return (
    <div className="bg-[var(--color-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-md)] overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 md:px-6 py-4 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <Icon name="ClipboardList" size={20} color="var(--color-primary)" strokeWidth={2} />
          <h2 className="text-base md:text-lg font-semibold text-[var(--color-foreground)]" style={{ fontFamily: "var(--font-heading)" }}>
            Transactions
          </h2>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
            {filtered?.length}
          </span>
        </div>
        {/* Filter Tabs */}
        <div className="flex gap-1 bg-[var(--color-muted)] rounded-[var(--radius-md)] p-1">
          {FILTER_OPTIONS?.map((opt) => (
            <button
              key={opt?.value}
              onClick={() => setFilter(opt?.value)}
              className={`px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-colors whitespace-nowrap ${
                filter === opt?.value
                  ? "bg-[var(--color-card)] text-[var(--color-primary)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              }`}
            >
              {opt?.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4 md:p-0">
        {filtered?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--color-muted-foreground)]">
            <Icon name="FileX" size={40} color="currentColor" strokeWidth={1.5} />
            <p className="mt-3 font-semibold">No transactions found</p>
            <p className="text-sm">Try a different filter.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm" aria-label="Transactions list">
                <thead>
                  <tr className="bg-[var(--color-muted)] border-b border-[var(--color-border)]">
                    {["Item Name", "Category", "Qty", "Teacher", "Borrow Date", "Return Date", "Status", "Action"]?.map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-[var(--color-muted-foreground)] font-[var(--font-caption)] whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered?.map((tx) => (
                    <tr key={tx?.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors">
                      <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">{tx?.itemName}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${categoryColors?.[tx?.category] || "bg-gray-100 text-gray-700"}`}>
                          {tx?.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-[var(--font-data)] font-bold text-[var(--color-primary)]">{tx?.quantity}</td>
                      <td className="px-4 py-3 text-[var(--color-foreground)]">{tx?.teacherName}</td>
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)] font-[var(--font-data)] text-xs whitespace-nowrap">
                        {format(new Date(tx.borrowDate), "MM/dd/yyyy HH:mm")}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)] font-[var(--font-data)] text-xs whitespace-nowrap">
                        {tx?.returnDate ? format(new Date(tx.returnDate), "MM/dd/yyyy HH:mm") : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {tx?.returned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <Icon name="CheckCircle" size={12} color="currentColor" strokeWidth={2} />
                            Returned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                            <Icon name="Clock" size={12} color="currentColor" strokeWidth={2} />
                            Borrowed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!tx?.returned && (
                          confirmReturn === tx?.id ? (
                            <div className="flex items-center gap-1">
                              <Button variant="success" size="xs" loading={returningId === tx?.id} onClick={() => handleReturn(tx?.id)}>
                                Confirm
                              </Button>
                              <Button variant="ghost" size="xs" onClick={() => setConfirmReturn(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <Button variant="outline" size="xs" iconName="ArrowDownToLine" iconPosition="left" onClick={() => setConfirmReturn(tx?.id)}>
                              Return
                            </Button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col gap-3">
              {filtered?.map((tx) => (
                <div key={tx?.id} className="bg-[var(--color-background)] rounded-[var(--radius-md)] p-4 border border-[var(--color-border)]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[var(--color-foreground)] line-clamp-1">{tx?.itemName}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${categoryColors?.[tx?.category] || "bg-gray-100 text-gray-700"}`}>
                        {tx?.category}
                      </span>
                    </div>
                    {tx?.returned ? (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                        <Icon name="CheckCircle" size={11} color="currentColor" strokeWidth={2} />
                        Returned
                      </span>
                    ) : (
                      <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                        <Icon name="Clock" size={11} color="currentColor" strokeWidth={2} />
                        Borrowed
                      </span>
                    )}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[var(--color-muted-foreground)]">
                    <div><span className="font-semibold text-[var(--color-foreground)]">Teacher:</span> {tx?.teacherName}</div>
                    <div><span className="font-semibold text-[var(--color-foreground)]">Qty:</span> <span className="font-[var(--font-data)] text-[var(--color-primary)] font-bold">{tx?.quantity}</span></div>
                    <div><span className="font-semibold text-[var(--color-foreground)]">Borrowed:</span> <span className="font-[var(--font-data)]">{format(new Date(tx.borrowDate), "MM/dd/yyyy")}</span></div>
                    {tx?.returnDate && <div><span className="font-semibold text-[var(--color-foreground)]">Returned:</span> <span className="font-[var(--font-data)]">{format(new Date(tx.returnDate), "MM/dd/yyyy")}</span></div>}
                  </div>
                  {!tx?.returned && (
                    <div className="mt-3">
                      {confirmReturn === tx?.id ? (
                        <div className="flex gap-2">
                          <Button variant="success" size="sm" loading={returningId === tx?.id} onClick={() => handleReturn(tx?.id)} fullWidth>
                            Confirm Return
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setConfirmReturn(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button variant="outline" size="sm" iconName="ArrowDownToLine" iconPosition="left" onClick={() => setConfirmReturn(tx?.id)} fullWidth>
                          Mark as Returned
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionsList;