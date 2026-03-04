import React, { useState, useMemo, useCallback } from "react";
import TabNavigation from "components/ui/TabNavigation";
import LoadingIndicator from "components/ui/LoadingIndicator";
import Icon from "components/AppIcon";
import InventoryTable from "./components/InventoryTable";
import AddItemForm from "./components/AddItemForm";
import SearchFilterBar from "./components/SearchFilterBar";
import DeleteConfirmModal from "./components/DeleteConfirmModal";

const INITIAL_ITEMS = [
  { id: 1, name: "Arduino Uno R3", category: "Microcontrollers", totalQty: 15, borrowed: 4 },
  { id: 2, name: "Raspberry Pi 4 Model B", category: "Microcontrollers", totalQty: 10, borrowed: 3 },
  { id: 3, name: "Ultrasonic Sensor HC-SR04", category: "Sensors", totalQty: 30, borrowed: 8 },
  { id: 4, name: "IR Infrared Sensor Module", category: "Sensors", totalQty: 25, borrowed: 5 },
  { id: 5, name: "DHT11 Temperature & Humidity Sensor", category: "Sensors", totalQty: 20, borrowed: 2 },
  { id: 6, name: "DC Motor 6V", category: "Motors", totalQty: 18, borrowed: 6 },
  { id: 7, name: "Servo Motor SG90", category: "Motors", totalQty: 22, borrowed: 7 },
  { id: 8, name: "Stepper Motor 28BYJ-48", category: "Motors", totalQty: 12, borrowed: 1 },
  { id: 9, name: "ELEGOO Starter Kit", category: "Kits", totalQty: 8, borrowed: 3 },
  { id: 10, name: "Makeblock mBot Robot Kit", category: "Kits", totalQty: 6, borrowed: 2 },
  { id: 11, name: "LEGO Mindstorms EV3", category: "Kits", totalQty: 5, borrowed: 1 },
  { id: 12, name: "ESP32 Development Board", category: "Microcontrollers", totalQty: 14, borrowed: 0 },
];

let nextId = 13;

const InventoryManagement = () => {
  const [items, setItems] = useState(INITIAL_ITEMS);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("inventory");

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const filteredItems = useMemo(() => {
    return items?.filter((item) => {
      const matchSearch = item?.name?.toLowerCase()?.includes(search?.toLowerCase());
      const matchCat = !categoryFilter || item?.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [items, search, categoryFilter]);

  const handleSave = useCallback(async (formData) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 300));
    if (editItem) {
      setItems((prev) =>
        prev?.map((it) =>
          it?.id === editItem?.id
            ? { ...it, name: formData?.name, category: formData?.category, totalQty: formData?.totalQty }
            : it
        )
      );
      setEditItem(null);
      showToast(`"${formData?.name}" updated successfully.`);
    } else {
      setItems((prev) => [...prev, { id: nextId++, ...formData, borrowed: 0 }]);
      showToast(`"${formData?.name}" added to inventory.`);
    }
    setSaving(false);
  }, [editItem, showToast]);

  const handleDelete = useCallback((id) => {
    const item = items?.find((i) => i?.id === id);
    setItems((prev) => prev?.filter((i) => i?.id !== id));
    setDeleteItem(null);
    showToast(`"${item?.name}" deleted.`, "error");
  }, [items, showToast]);

  const handleCancelEdit = useCallback(() => setEditItem(null), []);

  const stats = useMemo(() => ({
    total: items?.length,
    totalBorrowed: items?.reduce((s, i) => s + i?.borrowed, 0),
    totalAvailable: items?.reduce((s, i) => s + (i?.totalQty - i?.borrowed), 0),
  }), [items]);

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <TabNavigation onTabChange={setActiveTab} />
      {/* Toast */}
      {toast && (
        <div
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium"
          style={{
            background: toast?.type === "error" ? "var(--color-error)" : "var(--color-success)",
            color: "#fff",
            fontFamily: "var(--font-caption)",
            maxWidth: "320px",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <Icon name={toast?.type === "error" ? "Trash2" : "CheckCircle"} size={16} color="#fff" />
          {toast?.message}
        </div>
      )}
      <LoadingIndicator isLoading={saving} bar />
      <main className="px-4 md:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "var(--color-primary)" }}
            >
              <Icon name="Package" size={18} color="#fff" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
              Inventory Management
            </h1>
          </div>
          <p className="text-sm md:text-base ml-12" style={{ color: "var(--color-muted-foreground)" }}>
            Manage robotic teaching equipment catalog — add, edit, and track availability.
          </p>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-6">
          {[
            { label: "Total Items", value: stats?.total, icon: "Layers", color: "var(--color-primary)" },
            { label: "Total Borrowed", value: stats?.totalBorrowed, icon: "ArrowUpRight", color: "var(--color-accent)" },
            { label: "Total Available", value: stats?.totalAvailable, icon: "CheckCircle", color: "var(--color-success)" },
          ]?.map((s) => (
            <div
              key={s?.label}
              className="rounded-xl p-3 md:p-4 flex flex-col gap-1"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex items-center gap-2">
                <Icon name={s?.icon} size={16} color={s?.color} />
                <span className="text-xs md:text-sm" style={{ fontFamily: "var(--font-caption)", color: "var(--color-muted-foreground)" }}>
                  {s?.label}
                </span>
              </div>
              <span className="text-xl md:text-2xl font-bold" style={{ fontFamily: "var(--font-data)", color: s?.color }}>
                {s?.value}
              </span>
            </div>
          ))}
        </div>

        {/* Main Content: Table + Form */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Inventory List */}
          <div className="flex-1 min-w-0">
            <div
              className="rounded-xl p-4 md:p-5"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-md)" }}
            >
              <div className="mb-4">
                <SearchFilterBar
                  search={search}
                  onSearchChange={setSearch}
                  categoryFilter={categoryFilter}
                  onCategoryChange={setCategoryFilter}
                  resultCount={filteredItems?.length}
                  totalCount={items?.length}
                />
              </div>
              <InventoryTable
                items={filteredItems}
                onEdit={setEditItem}
                onDelete={setDeleteItem}
              />
            </div>
          </div>

          {/* Right: Add/Edit Form */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
            <AddItemForm
              editItem={editItem}
              onSave={handleSave}
              onCancelEdit={handleCancelEdit}
            />
          </div>
        </div>
      </main>
      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        item={deleteItem}
        onConfirm={handleDelete}
        onCancel={() => setDeleteItem(null)}
      />
    </div>
  );
};

export default InventoryManagement;