import React from "react";
import Button from "components/ui/Button";
import Icon from "components/AppIcon";

const DeleteConfirmModal = ({ item, onConfirm, onCancel }) => {
  if (!item) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.45)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div
        className="w-full max-w-sm rounded-xl p-6 flex flex-col gap-4"
        style={{ background: "var(--color-card)", boxShadow: "var(--shadow-xl)", border: "1px solid var(--color-border)" }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(220,38,38,0.12)" }}>
            <Icon name="Trash2" size={20} color="var(--color-error)" />
          </div>
          <h3 id="delete-modal-title" className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
            Delete Item
          </h3>
        </div>
        <p className="text-sm" style={{ color: "var(--color-muted-foreground)" }}>
          Are you sure you want to delete <strong style={{ color: "var(--color-foreground)" }}>{item?.name}</strong>? This action cannot be undone.
        </p>
        {item?.borrowed > 0 && (
          <div className="rounded-lg px-3 py-2 text-sm" style={{ background: "rgba(245,158,11,0.10)", color: "var(--color-warning)", border: "1px solid rgba(245,158,11,0.25)" }}>
            <Icon name="AlertTriangle" size={14} className="inline mr-1" /> This item has {item?.borrowed} unit(s) currently borrowed.
          </div>
        )}
        <div className="flex gap-3 pt-1">
          <Button variant="outline" fullWidth onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" fullWidth iconName="Trash2" iconPosition="left" onClick={() => onConfirm(item?.id)}>
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;