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
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="bg-[#e8f2ec]">
            <th className="p-3 text-left text-sm font-semibold text-gray-600 w-16">
              ID
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600 min-w-[200px] max-w-[250px]">
              Titolo
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600 w-24">
              Prezzo
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600 min-w-[120px] max-w-[150px]">
              Categoria
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600 w-20">
              Immagine
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600 w-16">
              Stock
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600 min-w-[100px] max-w-[120px]">
              Varianti
            </th>
            <th className="p-3 text-left text-sm font-semibold text-gray-600 w-32">
              Azioni
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-[#f3f7f4]">
              <td className="p-3 text-sm text-gray-800 w-16">{p.id}</td>
              <td className="p-3 text-sm text-gray-800 min-w-[200px] max-w-[250px]">
                <div className="truncate" title={p.titolo}>
                  {p.titolo}
                </div>
              </td>
              <td className="p-3 text-sm text-gray-800 w-24 whitespace-nowrap">
                € {Number(p.prezzo).toFixed(2)}
              </td>
              <td className="p-3 text-sm text-gray-800 min-w-[120px] max-w-[150px]">
                <div
                  className="truncate"
                  title={
                    p.categoria && p.categoria.length > 0
                      ? p.categoria.map((c) => c.name).join(", ")
                      : "-"
                  }
                >
                  {p.categoria && p.categoria.length > 0
                    ? p.categoria.map((c) => c.name).join(", ")
                    : "-"}
                </div>
              </td>
              <td className="p-3 text-sm text-gray-800 w-20">
                {p.immagine && (
                  <img
                    src={p.immagine}
                    alt="img"
                    className="h-12 w-12 object-cover rounded"
                  />
                )}
              </td>
              <td className="p-3 text-sm text-gray-800 w-16">{p.stock ?? 0}</td>
              <td className="p-3 text-sm text-gray-800 min-w-[100px] max-w-[120px]">
                <div className="text-xs">
                  {p.varianti && p.varianti.length > 0
                    ? `${p.varianti.length} tipi, ${p.varianti.reduce(
                        (sum, type) => sum + (type.valori?.length || 0),
                        0
                      )} valori`
                    : "-"}
                </div>
              </td>
              <td className="p-3 text-sm text-gray-800 w-32">
                <div className="flex flex-col gap-1">
                  <button
                    className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-blue-700 transition-colors"
                    onClick={() => onEdit(p)}
                  >
                    Modifica
                  </button>
                  <button
                    className="bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold hover:bg-red-700 transition-colors"
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
