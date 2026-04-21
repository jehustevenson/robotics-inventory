// src/pages/borrow-and-return-system/components/BorrowForm.jsx
import React, { useMemo, useState } from 'react';
import Icon from 'components/AppIcon';
import Button from 'components/ui/Button';
import Input from 'components/ui/Input';
import Select from 'components/ui/Select';

// Order in which school sections should appear in the item picker.
const SECTION_ORDER = ["Infant School", "Junior School", "Secondary School", "Unassigned"];

const BorrowForm = ({ inventory, onBorrow, loading }) => {
  const [selectedItem, setSelectedItem] = useState('');
  const [quantity,     setQuantity]     = useState('');
  const [teacherName,  setTeacherName]  = useState('');
  const [errors,       setErrors]       = useState({});
  const [successMsg,   setSuccessMsg]   = useState('');

  // Sort items by section (using SECTION_ORDER), then by name, and prefix
  // the dropdown label with the section so teachers can scan by school.
  const itemOptions = useMemo(() => {
    const sectionRank = (s) => {
      const key = s && SECTION_ORDER.includes(s) ? s : "Unassigned";
      return SECTION_ORDER.indexOf(key);
    };
    return (inventory || [])
      .slice()
      .sort((a, b) => {
        const diff = sectionRank(a.section) - sectionRank(b.section);
        if (diff !== 0) return diff;
        return (a.name || '').localeCompare(b.name || '');
      })
      .map(item => ({
        value:    item.id,
        label:    `[${item.section || "Unassigned"}] ${item.name} (Available: ${item.available})`,
        disabled: item.available === 0,
      }));
  }, [inventory]);

  const selectedInventoryItem = inventory?.find(i => i.id === selectedItem);

  const validate = () => {
    const errs = {};
    if (!selectedItem)
      errs.item = 'Please select an item.';
    if (!quantity || isNaN(quantity) || Number(quantity) < 1)
      errs.quantity = 'Enter a valid quantity (min 1).';
    if (selectedInventoryItem && Number(quantity) > selectedInventoryItem.available)
      errs.quantity = `Only ${selectedInventoryItem.available} unit(s) available.`;
    if (!teacherName?.trim())
      errs.teacherName = 'Teacher name is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setSuccessMsg('');
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    const result = await onBorrow({
      itemId:      selectedItem,
      quantity:    Number(quantity),
      teacherName: teacherName.trim(),
    });

    if (result?.success) {
      setSuccessMsg(`Successfully borrowed ${quantity} × ${selectedInventoryItem?.name}.`);
      setSelectedItem('');
      setQuantity('');
      setTeacherName('');
    }
  };

  return (
    <div className="bg-[var(--color-card)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-md)] p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center" style={{ backgroundColor: 'var(--color-primary)' }}>
          <Icon name="PackagePlus" size={18} color="white" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}>
            Borrow Equipment
          </h2>
          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)', fontFamily: 'var(--font-caption)' }}>
            Select item, enter quantity and teacher name
          </p>
        </div>
      </div>

      {/* Success message */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-[var(--radius-sm)] bg-green-50 border border-green-200">
          <Icon name="CheckCircle" size={16} color="var(--color-success)" strokeWidth={2} />
          <span className="text-sm text-green-700" style={{ fontFamily: 'var(--font-caption)' }}>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Item selector */}
        <Select
          label="Select Item"
          placeholder="Choose robotic equipment..."
          options={itemOptions}
          value={selectedItem}
          onChange={setSelectedItem}
          error={errors.item}
          required
          searchable
        />

        {/* Item info banner */}
        {selectedInventoryItem && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-sm)]" style={{ backgroundColor: 'var(--color-muted)' }}>
            <Icon name="Info" size={14} color="var(--color-primary)" strokeWidth={2} />
            <span className="text-xs" style={{ fontFamily: 'var(--font-caption)', color: 'var(--color-muted-foreground)' }}>
              <strong style={{ color: 'var(--color-foreground)' }}>{selectedInventoryItem.name}</strong>
              {' '}— Section: {selectedInventoryItem.section || 'Unassigned'}
              {' '}| Category: {selectedInventoryItem.category}
              {' '}| Total: {selectedInventoryItem.total}
              {' '}| Available:{' '}
              <strong style={{ color: selectedInventoryItem.available > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                {selectedInventoryItem.available}
              </strong>
            </span>
          </div>
        )}

        {/* Quantity */}
        <Input
          label="Quantity"
          type="number"
          placeholder="Enter quantity to borrow"
          value={quantity}
          onChange={e => setQuantity(e.target.value)}
          error={errors.quantity}
          min={1}
          max={selectedInventoryItem?.available || 999}
          required
        />

        {/* Teacher name */}
        <Input
          label="Teacher Name"
          type="text"
          placeholder="Enter your full name"
          value={teacherName}
          onChange={e => setTeacherName(e.target.value)}
          error={errors.teacherName}
          required
        />

        <Button
          variant="default"
          type="submit"
          loading={loading}
          fullWidth
          iconName="PackagePlus"
          iconPosition="left"
        >
          Borrow Equipment
        </Button>
      </form>
    </div>
  );
};

export default BorrowForm;