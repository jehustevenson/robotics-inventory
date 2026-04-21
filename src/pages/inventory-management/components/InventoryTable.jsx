import React from "react";
import Icon from "components/AppIcon";
import Button from "components/ui/Button";

const categoryColors = {
  Microcontrollers: "bg-blue-100 text-blue-800",
  Sensors: "bg-green-100 text-green-800",
  Motors: "bg-orange-100 text-orange-800",
  Kits: "bg-purple-100 text-purple-800",
};

// Render order for school sections. Items with no section fall under "Unassigned".
const SECTION_ORDER = ["Infant School", "Junior School", "Secondary School", "Unassigned"];

// Flag an item as "low stock" when available < 20% of totalQty (and > 0;
// an availability of 0 already has its own out-of-stock treatment).
const LOW_STOCK_RATIO = 0.2;
function isLowStock(available, totalQty) {
  if (!totalQty || totalQty <= 0) return false;
  return available > 0 && available / totalQty < LOW_STOCK_RATIO;
}

const LowStockBadge = () => (
  <span
    className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold align-middle"
    style={{ background: "rgba(234,179,8,0.15)", color: "#a16207", fontFamily: "var(--font-caption)" }}
    title="Low stock — less than 20% available"
  >
    <Icon name="AlertTriangle" size={10} color="currentColor" strokeWidth={2.5} />
    Low
  </span>
);

const sectionIcon = {
  "Infant School":    "Baby",
  "Junior School":    "School",
  "Secondary School": "GraduationCap",
  "Unassigned":       "HelpCircle",
};

function groupBySection(items) {
  const groups = {};
  for (const item of items || []) {
    const key = item?.section && SECTION_ORDER.includes(item.section) ? item.section : "Unassigned";
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return SECTION_ORDER
    .filter((name) => groups[name]?.length)
    .map((name) => ({ name, items: groups[name] }));
}

// Memoized so row-level re-renders only fire when this specific item,
// its index parity, or the edit/delete handlers actually change. Big
// win when the parent re-renders for unrelated reasons (search input,
// modal toggles, etc.) with dozens of rows mounted.
const ItemRow = React.memo(function ItemRow({ item, idx, onEdit, onDelete }) {
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
        {isLowStock(available, item?.totalQty) && <LowStockBadge />}
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
});

const MobileCard = React.memo(function MobileCard({ item, onEdit, onDelete }) {
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
        <div className="flex flex-col items-end gap-1">
          <span
            className="font-mono font-bold text-lg px-2 py-0.5 rounded"
            style={{
              background: available > 0 ? "rgba(34,197,94,0.12)" : "rgba(220,38,38,0.10)",
              color: available > 0 ? "var(--color-success)" : "var(--color-error)",
            }}
          >
            {available} avail.
          </span>
          {isLowStock(available, item?.totalQty) && <LowStockBadge />}
        </div>
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
});

const SectionHeader = ({ name, count }) => (
  <div className="flex items-center gap-2 mt-6 mb-2 first:mt-0">
    <Icon name={sectionIcon[name] || "Folder"} size={18} color="var(--color-primary)" strokeWidth={2} />
    <h3 className="text-base md:text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
      {name}
    </h3>
    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}>
      {count} item{count === 1 ? "" : "s"}
    </span>
  </div>
);

const InventoryTable = ({ items, onEdit, onDelete }) => {
  if (!items || items.length === 0) {
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

  const groups = groupBySection(items);

  return (
    <>
      {/* Desktop — one table per section */}
      <div className="hidden md:block">
        {groups.map((group) => (
          <div key={group.name}>
            <SectionHeader name={group.name} count={group.items.length} />
            <div className="overflow-x-auto">
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
                  {group.items.map((item, idx) => (
                    <ItemRow key={item?.id} item={item} idx={idx} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile — sectioned card list */}
      <div className="md:hidden">
        {groups.map((group) => (
          <div key={group.name}>
            <SectionHeader name={group.name} count={group.items.length} />
            <div className="flex flex-col gap-3">
              {group.items.map((item) => (
                <MobileCard key={item?.id} item={item} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default InventoryTable;
