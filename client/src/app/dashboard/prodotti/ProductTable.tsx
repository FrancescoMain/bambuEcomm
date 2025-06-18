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
      <table className="w-full min-w-[900px] whitespace-nowrap border rounded-xl bg-white">
        <thead>
          <tr className="bg-[#e8f2ec]">
            <th className="p-2">ID</th>
            <th className="p-2">Titolo</th>
            <th className="p-2">Prezzo</th>
            <th className="p-2">Categoria</th>
            <th className="p-2">Immagine</th>
            <th className="p-2">Stock</th>
            <th className="p-2">Varianti</th>
            <th className="p-2">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-t hover:bg-[#f3f7f4]">
              <td className="p-2">{p.id}</td>
              <td className="p-2">{p.titolo}</td>
              <td className="p-2">€ {Number(p.prezzo).toFixed(2)}</td>
              <td className="p-2">
                {p.categoria && p.categoria.length > 0
                  ? p.categoria.map((c) => c.name).join(", ")
                  : "-"}
              </td>
              <td className="p-2">
                {p.immagine && (
                  <img
                    src={p.immagine}
                    alt="img"
                    className="h-12 w-12 object-cover rounded"
                  />
                )}
              </td>
              <td className="p-2">{p.stock ?? 0}</td>
              <td className="p-2">
                {p.varianti && p.varianti.length > 0
                  ? `${p.varianti.length} tipi, ${p.varianti.reduce(
                      (sum, type) => sum + (type.valori?.length || 0),
                      0
                    )} valori`
                  : "-"}
              </td>
              <td className="p-2 flex gap-2">
                <button
                  className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                  onClick={() => onEdit(p)}
                >
                  Modifica
                </button>
                <button
                  className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                  onClick={() => onDelete(p.id)}
                >
                  Elimina
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
