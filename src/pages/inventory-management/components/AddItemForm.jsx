import React, { useState, useEffect } from "react";
import Input from "components/ui/Input";
import Button from "components/ui/Button";
import Select from "components/ui/Select";

const CATEGORIES = [
  { value: "Microcontrollers", label: "Microcontrollers" },
  { value: "Sensors", label: "Sensors" },
  { value: "Motors", label: "Motors" },
  { value: "Kits", label: "Kits" },
];

const EMPTY_FORM = { name: "", category: "", totalQty: "" };

const AddItemForm = ({ editItem, onSave, onCancelEdit }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editItem) {
      setForm({ name: editItem?.name, category: editItem?.category, totalQty: String(editItem?.totalQty) });
      setErrors({});
    } else {
      setForm(EMPTY_FORM);
      setErrors({});
    }
  }, [editItem]);

  const validate = () => {
    const errs = {};
    if (!form?.name?.trim()) errs.name = "Item name is required.";
    if (!form?.category) errs.category = "Category is required.";
    if (!form?.totalQty || isNaN(Number(form?.totalQty)) || Number(form?.totalQty) < 1)
      errs.totalQty = "Enter a valid quantity (min 1).";
    return errs;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const errs = validate();
    if (Object.keys(errs)?.length > 0) { setErrors(errs); return; }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 400));
    onSave({ name: form?.name?.trim(), category: form?.category, totalQty: Number(form?.totalQty) });
    setForm(EMPTY_FORM);
    setErrors({});
    setLoading(false);
  };

  const isEditing = !!editItem;

  return (
    <div
      className="rounded-xl p-5 h-full"
      style={{ background: "var(--color-card)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-md)" }}
    >
      <div className="flex items-center gap-2 mb-5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: isEditing ? "rgba(232,90,79,0.12)" : "rgba(30,58,95,0.10)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isEditing ? "var(--color-accent)" : "var(--color-primary)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {isEditing
              ? <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>
              : <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>
            }
          </svg>
        </div>
        <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-heading)", color: "var(--color-foreground)" }}>
          {isEditing ? "Edit Item" : "Add New Item"}
        </h2>
      </div>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Input
          label="Item Name"
          type="text"
          placeholder="e.g. Arduino Uno R3"
          value={form?.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e?.target?.value }))}
          error={errors?.name}
          required
        />

        <Select
          label="Category"
          placeholder="Select a category"
          options={CATEGORIES}
          value={form?.category}
          onChange={(val) => setForm((f) => ({ ...f, category: val }))}
          error={errors?.category}
          required
        />

        <Input
          label="Total Quantity"
          type="number"
          placeholder="e.g. 10"
          min={1}
          value={form?.totalQty}
          onChange={(e) => setForm((f) => ({ ...f, totalQty: e?.target?.value }))}
          error={errors?.totalQty}
          required
        />

        <div className="flex flex-col gap-2 pt-1">
          <Button type="submit" variant="default" fullWidth loading={loading} iconName={isEditing ? "Save" : "Plus"} iconPosition="left">
            {isEditing ? "Save Changes" : "Add Item"}
          </Button>
          {isEditing && (
            <Button type="button" variant="outline" fullWidth onClick={onCancelEdit}>
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default AddItemForm;