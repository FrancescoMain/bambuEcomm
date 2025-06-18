"use client";
import React, { useState, useEffect } from "react";
import { Product, ProductFormData } from "./types";
import VariantsForm from "./VariantsForm";

interface ProductFormProps {
  product: Product | null;
  formData: ProductFormData;
  onFormChange: (data: ProductFormData) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
  formLoading: boolean;
  categories: { id: number; name: string }[];
}

export default function ProductForm({
  product,
  formData,
  onFormChange,
  onSubmit,
  onCancel,
  formLoading,
  categories,
}: ProductFormProps) {
  // Log delle varianti all'avvio del componente
  useEffect(() => {
    console.log("ProductForm initialized with variants:", formData.varianti);
  }, [formData.varianti]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, files } = e.target as HTMLInputElement;
    if (type === "file" && files && files[0]) {
      onFormChange({ ...formData, imageFile: files[0] });
    } else if (name === "categoriaId") {
      onFormChange({
        ...formData,
        categoriaId: value ? Number(value) : undefined,
      });
    } else {
      onFormChange({ ...formData, [name]: value });
    }
  };

  const handleVariantsChange = (variants: any) => {
    onFormChange({ ...formData, varianti: variants });
  };

  const handleVariantImageUpload = (
    typeIndex: number,
    valueIndex: number,
    file: File
  ) => {
    onFormChange({
      ...formData,
      variantImageFiles: {
        ...(formData.variantImageFiles || {}),
        [`${typeIndex}-${valueIndex}`]: file,
      },
    });
  };

  return (
    <form
      className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto my-4 flex flex-col"
      onSubmit={onSubmit}
    >
      <button
        type="button"
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#51946b]"
        onClick={onCancel}
        aria-label="Chiudi"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <h3 className="text-xl font-bold mb-4">
        {product ? "Modifica prodotto" : "Nuovo prodotto"}
      </h3>
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Titolo</label>
        <input
          name="titolo"
          className="w-full border rounded px-3 py-2"
          value={formData.titolo || ""}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Prezzo</label>
        <input
          name="prezzo"
          type="number"
          step="0.01"
          className="w-full border rounded px-3 py-2"
          value={formData.prezzo || ""}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Immagine</label>
        <input
          name="immagine"
          className="w-full border rounded px-3 py-2 mb-1"
          value={formData.immagine || ""}
          onChange={handleInputChange}
          placeholder="URL immagine o carica file"
          required
        />
        <input
          type="file"
          accept="image/*"
          className="w-full border rounded px-3 py-2"
          onChange={handleInputChange}
          required={!formData.immagine}
        />
        {formData.immagine && (
          <img
            src={formData.immagine}
            alt="preview"
            className="h-16 mt-2 rounded"
          />
        )}
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Descrizione</label>
        <textarea
          name="descrizione"
          className="w-full border rounded px-3 py-2"
          value={formData.descrizione || ""}
          onChange={handleInputChange}
          required
        />
      </div>
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Categoria</label>
        <select
          name="categoriaId"
          className="w-full border rounded px-3 py-2"
          value={formData.categoriaId || ""}
          onChange={handleInputChange}
          required
        >
          <option value="">Seleziona categoria</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>{" "}
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Stock</label>
        <input
          name="stock"
          type="number"
          min="0"
          className="w-full border rounded px-3 py-2"
          value={formData.stock ?? 0}
          onChange={handleInputChange}
          required
        />
      </div>
      <VariantsForm
        variants={formData.varianti || []}
        onChange={handleVariantsChange}
        onImageUpload={handleVariantImageUpload}
      />
      <div className="sticky bottom-0 bg-white pt-4 border-t mt-4">
        <button
          type="submit"
          className="w-full bg-[#51946b] text-white font-semibold py-2 rounded flex items-center justify-center"
          disabled={formLoading}
        >
          {formLoading ? (
            <svg
              className="animate-spin h-5 w-5 mr-2 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              ></path>
            </svg>
          ) : null}
          Salva
        </button>
      </div>
    </form>
  );
}
