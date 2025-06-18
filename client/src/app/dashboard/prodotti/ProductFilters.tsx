"use client";
import React from "react";

interface ProductFiltersProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  sortOrder: "asc" | "desc";
  onSortOrderChange: () => void;
  categories: { id: number; name: string }[];
}

export default function ProductFilters({
  searchInput,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortOrder,
  onSortOrderChange,
  categories,
}: ProductFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-4 items-end">
      <input
        type="text"
        placeholder="Cerca per nome... "
        className="border rounded px-2 py-1"
        value={searchInput}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        className="border rounded px-2 py-1 min-w-[200px]"
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="">Tutte le categorie</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs"
        onClick={onSortOrderChange}
      >
        Ordina per nome {sortOrder === "asc" ? "↓" : "↑"}
      </button>
    </div>
  );
}
