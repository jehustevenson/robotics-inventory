import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { deleteItem } from "../../../store/inventorySlice";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";
import Input from "components/ui/Input";

const categoryColors = {
  Microcontrollers: "bg-blue-100 text-blue-800",
  Sensors: "bg-purple-100 text-purple-800",
  Motors: "bg-orange-100 text-orange-800",
  Kits: "bg-green-100 text-green-800",
};

const InventoryList = ({ onEdit }) => {
  const dispatch = useDispatch();
  const { items, transactions } = useSelector((s) => s?.inventory);
  const [search, setSearch] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const activeBorrows = useMemo(() => transactions?.filter((t) => !t?.returned), [transactions]);

  const getAvailable = (itemId, total) => {
    const borrowed = activeBorrows?.filter((t) => t?.itemId === itemId)?.reduce((s, t) => s + t?.quantity, 0);
    return total - borrowed;
  };

  const filtered = useMemo(() =>
    items?.filter((item) =>
      item?.name?.toLowerCase()?.includes(search?.toLowerCase()) ||
      item?.category?.toLowerCase()?.includes(search?.toLowerCase())
    ), [items, search]);

  const handleDelete = (id) => {
    dispatch(deleteItem(id));
    setDeleteConfirm(null);
  };

  return (
    <div>
      <div className="mb-4">
        <Input
          type="search"
          placeholder="Search by name or category..."
          value={search}
          onChange={(e) => setSearch(e?.target?.value)}
        />
      </div>
      {filtered?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--color-muted-foreground)]">
          <Icon name="SearchX" size={40} color="currentColor" strokeWidth={1.5} />
          <p className="mt-3 font-semibold">No items found</p>
          <p className="text-sm">Try a different search term or add a new item.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm" aria-label="Inventory items">
              <thead>
                <tr className="bg-[var(--color-muted)] border-b border-[var(--color-border)]">
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-muted-foreground)] font-[var(--font-caption)]">#</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-muted-foreground)] font-[var(--font-caption)]">Item Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-[var(--color-muted-foreground)] font-[var(--font-caption)]">Category</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--color-muted-foreground)] font-[var(--font-caption)]">Total</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--color-muted-foreground)] font-[var(--font-caption)]">Borrowed</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--color-muted-foreground)] font-[var(--font-caption)]">Available</th>
                  <th className="text-center px-4 py-3 font-semibold text-[var(--color-muted-foreground)] font-[var(--font-caption)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((item, idx) => {
                  const borrowed = activeBorrows?.filter((t) => t?.itemId === item?.id)?.reduce((s, t) => s + t?.quantity, 0);
                  const available = item?.totalQuantity - borrowed;
                  return (
                    <tr key={item?.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors">
                      <td className="px-4 py-3 text-[var(--color-muted-foreground)] font-[var(--font-data)]">{idx + 1}</td>
                      <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">{item?.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${categoryColors?.[item?.category] || "bg-gray-100 text-gray-700"}`}>
                          {item?.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-[var(--font-data)] font-semibold">{item?.totalQuantity}</td>
                      <td className="px-4 py-3 text-center font-[var(--font-data)] font-semibold text-amber-600">{borrowed}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`font-[var(--font-data)] font-bold text-sm ${available === 0 ? "text-[var(--color-error)]" : "text-[var(--color-secondary)]"}`}>
                          {available}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => onEdit(item)} aria-label={`Edit ${item?.name}`}>
                            <Icon name="Pencil" size={15} color="currentColor" strokeWidth={2} />
                          </Button>
                          {deleteConfirm === item?.id ? (
                            <div className="flex items-center gap-1">
                              <Button variant="danger" size="xs" onClick={() => handleDelete(item?.id)}>Confirm</Button>
                              <Button variant="ghost" size="xs" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(item?.id)} aria-label={`Delete ${item?.name}`}>
                              <Icon name="Trash2" size={15} color="var(--color-error)" strokeWidth={2} />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-3">
            {filtered?.map((item) => {
              const borrowed = activeBorrows?.filter((t) => t?.itemId === item?.id)?.reduce((s, t) => s + t?.quantity, 0);
              const available = item?.totalQuantity - borrowed;
              return (
                <div key={item?.id} className="bg-[var(--color-background)] rounded-[var(--radius-md)] p-4 border border-[var(--color-border)]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[var(--color-foreground)] line-clamp-1">{item?.name}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${categoryColors?.[item?.category] || "bg-gray-100 text-gray-700"}`}>
                        {item?.category}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(item)} aria-label={`Edit ${item?.name}`}>
                        <Icon name="Pencil" size={15} color="currentColor" strokeWidth={2} />
                      </Button>
                      {deleteConfirm === item?.id ? (
                        <div className="flex gap-1">
                          <Button variant="danger" size="xs" onClick={() => handleDelete(item?.id)}>Yes</Button>
                          <Button variant="ghost" size="xs" onClick={() => setDeleteConfirm(null)}>No</Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => setDeleteConfirm(item?.id)} aria-label={`Delete ${item?.name}`}>
                          <Icon name="Trash2" size={15} color="var(--color-error)" strokeWidth={2} />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    {[["Total", item?.totalQuantity, "text-[var(--color-foreground)]"], ["Borrowed", borrowed, "text-amber-600"], ["Available", available, available === 0 ? "text-[var(--color-error)]" : "text-[var(--color-secondary)]"]]?.map(([label, val, cls]) => (
                      <div key={label} className="bg-[var(--color-muted)] rounded-[var(--radius-sm)] py-2">
                        <p className={`text-base font-bold font-[var(--font-data)] ${cls}`}>{val}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

export default InventoryList;