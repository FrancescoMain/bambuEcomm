"use client";
import React, { useEffect } from "react";
import { Product, ProductFormData } from "./types";
import VariantsForm from "./VariantsForm";
import { FiX } from "react-icons/fi";
import { useNotifications } from "@/components/ui/NotificationProvider";

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
  const { showToast } = useNotifications();

  useEffect(() => {
    console.log("ProductForm initialized with variants:", formData.varianti);
  }, [formData.varianti]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const target = e.target as HTMLInputElement;

    if (type === "file" && target.files && target.files[0]) {
      onFormChange({ ...formData, [name]: target.files[0] });
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
  // Validazione form
  const isFormValid = () => {
    return (
      formData.titolo?.trim() &&
      formData.prezzo &&
      parseFloat(String(formData.prezzo)) > 0 &&
      formData.categoriaId &&
      formData.descrizione?.trim()
    );
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      showToast(
        "Per favore compila tutti i campi obbligatori (Titolo, Prezzo > 0, Categoria, Descrizione)",
        "warning"
      );
      return;
    }

    onSubmit(e);
  };
  return (
    <form
      className="bg-white rounded-lg w-full flex flex-col overflow-auto"
      onSubmit={handleSubmit}
      noValidate
    >
      {/* Form Header */}
      <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
        <h3 className="text-xl font-bold text-gray-800">
          {product ? "Modifica Prodotto" : "Nuovo Prodotto"}
        </h3>
        <button
          type="button"
          className="text-gray-500 hover:text-gray-800 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#51946b]"
          onClick={onCancel}
          aria-label="Chiudi"
        >
          <FiX className="w-6 h-6" />
        </button>
      </div>{" "}
      {/* Form Content */}
      <div className="p-6 flex-grow">
        {/* Messaggio di validazione */}
        {!isFormValid() && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Nota:</strong> I campi contrassegnati con * sono
              obbligatori per creare il prodotto.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Titolo */}
          <div className="md:col-span-2">
            <label
              htmlFor="titolo"
              className="block text-sm font-medium mb-1 text-gray-700"
            >
              Titolo *
            </label>{" "}
            <input
              id="titolo"
              name="titolo"
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#51946b] focus:outline-none ${
                !formData.titolo?.trim()
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
              value={formData.titolo || ""}
              onChange={handleInputChange}
              placeholder="Inserisci il titolo del prodotto"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1">
              Massimo 200 caratteri ({formData.titolo?.length || 0}/200)
            </p>
          </div>
          {/* Prezzo e Stock */}{" "}
          <div>
            <label
              htmlFor="prezzo"
              className="block text-sm font-medium mb-1 text-gray-700"
            >
              Prezzo *
            </label>{" "}
            <input
              id="prezzo"
              name="prezzo"
              type="number"
              step="0.01"
              min="0.01"
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#51946b] focus:outline-none ${
                !formData.prezzo || parseFloat(String(formData.prezzo)) <= 0
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
              value={formData.prezzo || ""}
              onChange={handleInputChange}
              placeholder="0.00"
            />
          </div>
          <div>
            <label
              htmlFor="stock"
              className="block text-sm font-medium mb-1 text-gray-700"
            >
              Stock
            </label>
            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#51946b] focus:outline-none"
              value={formData.stock ?? 0}
              onChange={handleInputChange}
            />
          </div>{" "}
          {/* Categoria */}
          <div className="md:col-span-2">
            <label
              htmlFor="categoriaId"
              className="block text-sm font-medium mb-1 text-gray-700"
            >
              Categoria *
            </label>{" "}
            <select
              id="categoriaId"
              name="categoriaId"
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#51946b] focus:outline-none ${
                !formData.categoriaId
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
              value={formData.categoriaId || ""}
              onChange={handleInputChange}
            >
              <option value="">Seleziona una categoria</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          {/* Descrizione */}
          <div className="md:col-span-2">
            <label
              htmlFor="descrizione"
              className="block text-sm font-medium mb-1 text-gray-700"
            >
              Descrizione *
            </label>{" "}
            <textarea
              id="descrizione"
              name="descrizione"
              rows={5}
              className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#51946b] focus:outline-none resize-vertical ${
                !formData.descrizione?.trim()
                  ? "border-red-300 bg-red-50"
                  : "border-gray-300"
              }`}
              value={formData.descrizione || ""}
              onChange={handleInputChange}
              placeholder="Inserisci una descrizione del prodotto"
              maxLength={1000}
            />
            <p className="text-xs text-gray-500 mt-1">
              Massimo 1000 caratteri ({formData.descrizione?.length || 0}/1000)
            </p>
          </div>
          {/* Immagine */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1 text-gray-700">
              Immagine Principale
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                {formData.imageFile ? (
                  <p className="text-sm text-gray-600">
                    {formData.imageFile.name}
                  </p>
                ) : (
                  formData.immagine && (
                    <img
                      src={formData.immagine}
                      alt="Preview"
                      className="mx-auto h-24 w-auto rounded-md"
                    />
                  )
                )}
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="imageFile"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-[#51946b] hover:text-[#3d7a57] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#51946b]"
                  >
                    <span>Carica un file</span>
                    <input
                      id="imageFile"
                      name="imageFile"
                      type="file"
                      className="sr-only"
                      onChange={handleInputChange}
                      accept="image/*"
                    />
                  </label>
                  <p className="pl-1">o incolla un URL</p>
                </div>
                <input
                  name="immagine"
                  className="w-full border rounded-lg px-3 py-1 mt-2 text-sm"
                  value={formData.immagine || ""}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
          </div>
          {/* Varianti */}
          <div className="md:col-span-2">
            <VariantsForm
              variants={formData.varianti || []}
              onChange={handleVariantsChange}
              onImageUpload={handleVariantImageUpload}
            />
          </div>
        </div>
      </div>
      {/* Form Footer */}
      <div className="p-4 border-t bg-white z-10 md:sticky md:bottom-0">
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
          >
            Annulla
          </button>{" "}
          <button
            type="submit"
            className={`w-full md:w-auto font-semibold py-2 px-6 rounded-lg flex items-center justify-center transition-colors ${
              isFormValid() && !formLoading
                ? "bg-[#51946b] text-white hover:bg-opacity-90"
                : "bg-gray-400 text-gray-600 cursor-not-allowed"
            }`}
            disabled={formLoading || !isFormValid()}
          >
            {formLoading ? (
              <svg
                className="animate-spin h-5 w-5 mr-3 text-white"
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
            {product ? "Salva Modifiche" : "Crea Prodotto"}
          </button>
        </div>
      </div>
    </form>
  );
}
