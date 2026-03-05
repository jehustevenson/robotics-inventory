// src/pages/inventory-management/index.jsx
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchItems, fetchTransactions,
  addItemThunk, updateItemThunk, deleteItemThunk,
  clearError,
} from "../../store/inventorySlice";
import TabNavigation from "components/ui/TabNavigation";
import LoadingIndicator from "components/ui/LoadingIndicator";
import Icon from "components/AppIcon";
import InventoryTable from "./components/InventoryTable";
import AddItemForm from "./components/AddItemForm";
import SearchFilterBar from "./components/SearchFilterBar";
import DeleteConfirmModal from "./components/DeleteConfirmModal";

const InventoryManagement = () => {
  const dispatch = useDispatch();
  const { items, transactions, loading, actionLoading, error } = useSelector((s) => s.inventory);

  const [search, setSearch]               = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editItem, setEditItem]           = useState(null);
  const [deleteItem, setDeleteItem]       = useState(null);
  const [toast, setToast]                 = useState(null);

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchItems());
    dispatch(fetchTransactions());
  }, [dispatch]);

  // Surface API errors as toast
  useEffect(() => {
    if (error) {
      showToast(error, "error");
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Compute borrowed counts from live transactions
  const itemsWithBorrowed = useMemo(() => {
    const active = transactions.filter((t) => String(t.returned) !== "true");
    return items.map((item) => {
      const borrowed = active
        .filter((t) => t.itemId === item.id)
        .reduce((s, t) => s + Number(t.quantity || 0), 0);
      return { ...item, totalQty: Number(item.totalQuantity), borrowed };
    });
  }, [items, transactions]);

  const filteredItems = useMemo(() =>
    itemsWithBorrowed.filter((item) => {
      const matchSearch = item.name?.toLowerCase().includes(search.toLowerCase());
      const matchCat    = !categoryFilter || item.category === categoryFilter;
      return matchSearch && matchCat;
    }),
  [itemsWithBorrowed, search, categoryFilter]);

  const handleSave = useCallback(async (formData) => {
    const { totalQty, ...rest } = formData;
    const payload = { ...rest, totalQuantity: totalQty ?? formData.totalQuantity };
    if (editItem) {
      const res = await dispatch(updateItemThunk({ id: editItem.id, ...payload }));
      if (!res.error) { showToast(`"${payload.name}" updated.`); setEditItem(null); }
    } else {
      const res = await dispatch(addItemThunk(payload));
      if (!res.error) showToast(`"${payload.name}" added to inventory.`);
    }
  }, [editItem, dispatch, showToast]);

  const handleDelete = useCallback(async (id) => {
    const item = items.find((i) => i.id === id);
    const res  = await dispatch(deleteItemThunk(id));
    if (!res.error) { showToast(`"${item?.name}" deleted.`, "error"); setDeleteItem(null); }
  }, [items, dispatch, showToast]);

  const stats = useMemo(() => ({
    total:          itemsWithBorrowed.length,
    totalBorrowed:  itemsWithBorrowed.reduce((s, i) => s + i.borrowed, 0),
    totalAvailable: itemsWithBorrowed.reduce((s, i) => s + (i.totalQty - i.borrowed), 0),
  }), [itemsWithBorrowed]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <TabNavigation />

      {/* Toast */}
      {toast && (
        <div
          className="fixed top-20 right-4 z-[200] flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium"
          style={{
            background: toast.type === "error" ? "var(--color-error)" : "var(--color-success)",
            color: "#fff", fontFamily: "var(--font-caption)", maxWidth: "320px",
          }}
        >
          <Icon name={toast.type === "error" ? "AlertCircle" : "CheckCircle"} size={16} color="#fff" />
          {toast.message}
        </div>
      )}

      <LoadingIndicator isLoading={loading || actionLoading} bar />

      <main className="px-4 md:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-primary)" }}>
              <Icon name="Package" size={18} color="#fff" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
              Inventory Management
            </h1>
          </div>
          <p className="text-sm md:text-base ml-12" style={{ color: "var(--color-muted-foreground)" }}>
            Manage robotic teaching equipment — add, edit, and track availability.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
          {[
            { label: "Total Items",      value: stats.total,          icon: "Layers",       color: "var(--color-primary)"   },
            { label: "Total Borrowed",   value: stats.totalBorrowed,  icon: "ArrowUpRight", color: "var(--color-accent)"    },
            { label: "Total Available",  value: stats.totalAvailable, icon: "CheckCircle",  color: "var(--color-success)"   },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 md:p-4 flex flex-col gap-1"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
              <div className="flex items-center gap-2">
                <Icon name={s.icon} size={16} color={s.color} />
                <span className="text-xs md:text-sm" style={{ fontFamily: "var(--font-caption)", color: "var(--color-muted-foreground)" }}>{s.label}</span>
              </div>
              <span className="text-xl md:text-2xl font-bold" style={{ fontFamily: "var(--font-data)", color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>

        {loading && items.length === 0 ? (
          <LoadingIndicator isLoading message="Loading inventory from Google Sheets…" />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <div className="rounded-xl p-4 md:p-5"
                style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-md)" }}>
                <div className="mb-4">
                  <SearchFilterBar
                    search={search} onSearchChange={setSearch}
                    categoryFilter={categoryFilter} onCategoryChange={setCategoryFilter}
                    resultCount={filteredItems.length} totalCount={itemsWithBorrowed.length}
                  />
                </div>
                <InventoryTable items={filteredItems} onEdit={setEditItem} onDelete={setDeleteItem} />
              </div>
            </div>
            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
              <AddItemForm editItem={editItem} onSave={handleSave} onCancelEdit={() => setEditItem(null)} loading={actionLoading} />
            </div>
          </div>
        )}
      </main>

      <DeleteConfirmModal item={deleteItem} onConfirm={handleDelete} onCancel={() => setDeleteItem(null)} />
    </div>
  );
};

export default InventoryManagement;