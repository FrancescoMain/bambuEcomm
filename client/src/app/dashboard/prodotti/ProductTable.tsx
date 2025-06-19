"use client";
import React from "react";
import { Product } from "./types";

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

export default function ProductTable({
  products,
  loading,
  error,
  onEdit,
  onDelete,
}: ProductTableProps) {
  if (loading) {
    return <div>Caricamento prodotti...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] whitespace-nowrap">
        <thead>
          <tr className="bg-[#e8f2ec]">
            <th className="p-3 text-left text-sm font-semibold text-gray-600">
              ID
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">
              Titolo
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">
              Prezzo
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">
              Categoria
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">
              Immagine
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">
              Stock
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">
              Varianti
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600">
              Azioni
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-[#f3f7f4]">
              <td className="p-3 text-sm text-gray-800">{p.id}</td>
              <td className="p-3 text-sm text-gray-800">{p.titolo}</td>
              <td className="p-3 text-sm text-gray-800">
                € {Number(p.prezzo).toFixed(2)}
              </td>
              <td className="p-3 text-sm text-gray-800">
                {p.categoria && p.categoria.length > 0
                  ? p.categoria.map((c) => c.name).join(", ")
                  : "-"}
              </td>
              <td className="p-3 text-sm text-gray-800">
                {p.immagine && (
                  <img
                    src={p.immagine}
                    alt="img"
                    className="h-12 w-12 object-cover rounded"
                  />
                )}
              </td>
              <td className="p-3 text-sm text-gray-800">{p.stock ?? 0}</td>
              <td className="p-3 text-sm text-gray-800">
                {p.varianti && p.varianti.length > 0
                  ? `${p.varianti.length} tipi, ${p.varianti.reduce(
                      (sum, type) => sum + (type.valori?.length || 0),
                      0
                    )} valori`
                  : "-"}
              </td>
              <td className="p-3 text-sm text-gray-800">
                <div className="flex items-center gap-2">
                  <button
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-semibold"
                    onClick={() => onEdit(p)}
                  >
                    Modifica
                  </button>
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded text-xs font-semibold"
                    onClick={() => onDelete(p.id)}
                  >
                    Elimina
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
