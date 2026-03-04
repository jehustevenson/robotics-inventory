import React from "react";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";

const categoryColors = {
  Microcontrollers: "bg-blue-100 text-blue-800",
  Sensors: "bg-green-100 text-green-800",
  Motors: "bg-orange-100 text-orange-800",
  Kits: "bg-purple-100 text-purple-800",
};

const InventoryTable = ({ items, onEdit, onDelete }) => {
  if (items?.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Icon name="PackageOpen" size={48} color="var(--color-muted-foreground)" />
        <p className="mt-4 text-base font-semibold" style={{ color: "var(--color-muted-foreground)" }}>
          No items found
        </p>
        <p className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)" }}>
          Try adjusting your search or filter, or add a new item.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border)", background: "var(--color-muted)" }}>
              <th className="text-left px-4 py-3 font-semibold" style={{ fontFamily: "var(--font-caption)", color: "var(--color-muted-foreground)" }}>Item Name</th>
              <th className="text-left px-4 py-3 font-semibold" style={{ fontFamily: "var(--font-caption)", color: "var(--color-muted-foreground)" }}>Category</th>
              <th className="text-center px-4 py-3 font-semibold" style={{ fontFamily: "var(--font-caption)", color: "var(--color-muted-foreground)" }}>Total Qty</th>
              <th className="text-center px-4 py-3 font-semibold" style={{ fontFamily: "var(--font-caption)", color: "var(--color-muted-foreground)" }}>Borrowed</th>
              <th className="text-center px-4 py-3 font-semibold" style={{ fontFamily: "var(--font-caption)", color: "var(--color-muted-foreground)" }}>Available</th>
              <th className="text-center px-4 py-3 font-semibold" style={{ fontFamily: "var(--font-caption)", color: "var(--color-muted-foreground)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items?.map((item, idx) => {
              const available = item?.totalQty - item?.borrowed;
              return (
                <tr
                  key={item?.id}
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                    background: idx % 2 === 0 ? "var(--color-card)" : "var(--color-muted)",
                  }}
                  className="hover:opacity-90 transition-opacity"
                >
                  <td className="px-4 py-3 font-medium" style={{ color: "var(--color-foreground)" }}>{item?.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${categoryColors?.[item?.category] || "bg-gray-100 text-gray-700"}`}>
                      {item?.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-mono" style={{ color: "var(--color-foreground)" }}>{item?.totalQty}</td>
                  <td className="px-4 py-3 text-center font-mono" style={{ color: "var(--color-accent)" }}>{item?.borrowed}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="font-mono font-bold px-2 py-0.5 rounded"
                      style={{
                        background: available > 0 ? "rgba(34,197,94,0.12)" : "rgba(220,38,38,0.10)",
                        color: available > 0 ? "var(--color-success)" : "var(--color-error)",
                      }}
                    >
                      {available}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" iconName="Pencil" iconPosition="left" onClick={() => onEdit(item)}>
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" iconName="Trash2" iconPosition="left" onClick={() => onDelete(item)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Mobile Card Layout */}
      <div className="md:hidden flex flex-col gap-3">
        {items?.map((item) => {
          const available = item?.totalQty - item?.borrowed;
          return (
            <div
              key={item?.id}
              className="rounded-lg p-4"
              style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-base" style={{ color: "var(--color-foreground)" }}>{item?.name}</p>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold mt-1 inline-block ${categoryColors?.[item?.category] || "bg-gray-100 text-gray-700"}`}>
                    {item?.category}
                  </span>
                </div>
                <span
                  className="font-mono font-bold text-lg px-2 py-0.5 rounded"
                  style={{
                    background: available > 0 ? "rgba(34,197,94,0.12)" : "rgba(220,38,38,0.10)",
                    color: available > 0 ? "var(--color-success)" : "var(--color-error)",
                  }}
                >
                  {available} avail.
                </span>
              </div>
              <div className="flex gap-4 text-sm mb-3" style={{ color: "var(--color-muted-foreground)" }}>
                <span>Total: <strong style={{ color: "var(--color-foreground)" }}>{item?.totalQty}</strong></span>
                <span>Borrowed: <strong style={{ color: "var(--color-accent)" }}>{item?.borrowed}</strong></span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" iconName="Pencil" iconPosition="left" onClick={() => onEdit(item)}>Edit</Button>
                <Button variant="destructive" size="sm" iconName="Trash2" iconPosition="left" onClick={() => onDelete(item)}>Delete</Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default InventoryTable;