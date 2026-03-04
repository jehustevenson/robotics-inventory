import React from "react";
import Input from "components/ui/Input";
import Select from "components/ui/Select";
import Icon from "components/AppIcon";

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "Microcontrollers", label: "Microcontrollers" },
  { value: "Sensors", label: "Sensors" },
  { value: "Motors", label: "Motors" },
  { value: "Kits", label: "Kits" },
];

const SearchFilterBar = ({ search, onSearchChange, categoryFilter, onCategoryChange, resultCount, totalCount }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
      <div className="flex-1 min-w-0">
        <Input
          type="search"
          placeholder="Search items by name..."
          value={search}
          onChange={(e) => onSearchChange(e?.target?.value)}
          label="Search"
        />
      </div>
      <div className="w-full sm:w-48">
        <Select
          label="Category"
          options={CATEGORY_OPTIONS}
          value={categoryFilter}
          onChange={onCategoryChange}
          placeholder="All Categories"
        />
      </div>
      <div
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap self-end mb-0.5"
        style={{ background: "var(--color-muted)", color: "var(--color-muted-foreground)", fontFamily: "var(--font-caption)" }}
      >
        <Icon name="List" size={14} />
        <span>{resultCount} of {totalCount} items</span>
      </div>
    </div>
  );
};

export default SearchFilterBar;