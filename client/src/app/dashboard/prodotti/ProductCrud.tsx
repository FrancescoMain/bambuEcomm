"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { fetchCategoriesStart } from "@/redux/categorySlice";
import { selectParentCategories } from "@/redux/categorySelectors";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://bambu-ecomm-in2g.vercel.app/api";

export interface Product {
  id: number;
  codiceProdotto: string;
  titolo: string;
  prezzo: number;
  stock: number;
  immagine?: string;
  descrizione?: string;
  descrizioneBreve?: string;
  stato?: string;
  categoria?: { id: number; name: string }[];
}

export default function ProductCrud() {
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const parentCategories = useSelector(selectParentCategories);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<Partial<Product>>({});

  useEffect(() => {
    fetchProducts();
    dispatch(fetchCategoriesStart());
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/products`, {
        params: { limit: 100, sortBy: "createdAt", sortOrder: "desc" },
      });
      setProducts(res.data.data || res.data.products || res.data);
    } catch (err) {
      setError("Errore nel recupero prodotti");
    }
    setLoading(false);
  };

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setForm(product);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo prodotto?"))
      return;
    try {
      await axios.delete(`${API_URL}/products/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Errore durante l'eliminazione");
    }
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editProduct) {
        // Modifica prodotto
        await axios.put(`${API_URL}/products/${editProduct.id}`, form, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
      } else {
        // Nuovo prodotto
        await axios.post(`${API_URL}/products`, form, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
      }
      setShowForm(false);
      setEditProduct(null);
      setForm({});
      fetchProducts();
    } catch {
      alert("Errore durante il salvataggio");
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Prodotti</h2>
        <button
          className="bg-[#51946b] text-white px-4 py-2 rounded font-semibold"
          onClick={() => {
            setShowForm(true);
            setEditProduct(null);
            setForm({});
          }}
        >
          + Nuovo prodotto
        </button>
      </div>
      {loading ? (
        <div>Caricamento prodotti...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] whitespace-nowrap border rounded-xl bg-white">
            <thead>
              <tr className="bg-[#e8f2ec]">
                <th className="p-2">ID</th>
                <th className="p-2">Codice</th>
                <th className="p-2">Titolo</th>
                <th className="p-2">Prezzo</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Categoria</th>
                <th className="p-2">Azioni</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t hover:bg-[#f3f7f4]">
                  <td className="p-2">{p.id}</td>
                  <td className="p-2">{p.codiceProdotto}</td>
                  <td className="p-2">{p.titolo}</td>
                  <td className="p-2">€ {Number(p.prezzo).toFixed(2)}</td>
                  <td className="p-2">{p.stock}</td>
                  <td className="p-2">
                    {p.categoria && p.categoria.length > 0
                      ? p.categoria.map((c) => c.name).join(", ")
                      : "-"}
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleEdit(p)}
                    >
                      Modifica
                    </button>
                    <button
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleDelete(p.id)}
                    >
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Form prodotto */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <form
            className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative"
            onSubmit={handleFormSubmit}
          >
            <button
              type="button"
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => {
                setShowForm(false);
                setEditProduct(null);
                setForm({});
              }}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">
              {editProduct ? "Modifica prodotto" : "Nuovo prodotto"}
            </h3>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">
                Codice prodotto
              </label>
              <input
                name="codiceProdotto"
                className="w-full border rounded px-3 py-2"
                value={form.codiceProdotto || ""}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Titolo</label>
              <input
                name="titolo"
                className="w-full border rounded px-3 py-2"
                value={form.titolo || ""}
                onChange={handleFormChange}
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
                value={form.prezzo || ""}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input
                name="stock"
                type="number"
                className="w-full border rounded px-3 py-2"
                value={form.stock || ""}
                onChange={handleFormChange}
                required
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">
                Immagine (URL)
              </label>
              <input
                name="immagine"
                className="w-full border rounded px-3 py-2"
                value={form.immagine || ""}
                onChange={handleFormChange}
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">
                Descrizione breve
              </label>
              <input
                name="descrizioneBreve"
                className="w-full border rounded px-3 py-2"
                value={form.descrizioneBreve || ""}
                onChange={handleFormChange}
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">
                Descrizione
              </label>
              <textarea
                name="descrizione"
                className="w-full border rounded px-3 py-2"
                value={form.descrizione || ""}
                onChange={handleFormChange}
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Stato</label>
              <input
                name="stato"
                className="w-full border rounded px-3 py-2"
                value={form.stato || ""}
                onChange={handleFormChange}
              />
            </div>
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">
                Categoria
              </label>
              <select
                name="categoriaId"
                className="w-full border rounded px-3 py-2"
                value={form.categoriaId || ""}
                onChange={handleFormChange}
                required
              >
                <option value="">Seleziona categoria</option>
                {parentCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="mt-4 w-full bg-[#51946b] text-white font-semibold py-2 rounded"
            >
              Salva
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
