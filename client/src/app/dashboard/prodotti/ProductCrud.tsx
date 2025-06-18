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
  titolo: string;
  prezzo: number;
  immagine?: string;
  descrizione?: string;
  categoria?: { id: number; name: string }[];
  stock?: number;
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
  const [form, setForm] = useState<
    Partial<Product> & { categoriaId?: number; imageFile?: File }
  >({ stock: 0 });
  const [formLoading, setFormLoading] = useState(false);

  // Stato per paginazione e filtri
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchInput.length >= 3 || searchInput.length === 0) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 1000); //
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  useEffect(() => {
    fetchProducts();
    dispatch(fetchCategoriesStart());
  }, [page, limit, search, selectedCategory, sortOrder]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_URL}/products`, {
        params: {
          limit,
          page,
          sortBy: "titolo",
          sortOrder,
          search: search || undefined,
          categoryId: selectedCategory || undefined,
        },
      });
      setProducts(res.data.data || res.data.products || res.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      setError("Errore nel recupero prodotti");
    }
    setLoading(false);
  };

  // Stato per pagine totali
  const [totalPages, setTotalPages] = useState(1);

  const handleEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      ...product,
      categoriaId:
        product.categoria && product.categoria.length > 0
          ? Number(product.categoria[0].id)
          : undefined,
      stock: product.stock ?? 0,
    });
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type, files } = e.target as HTMLInputElement;
    if (type === "file" && files && files[0]) {
      setForm((f) => ({ ...f, imageFile: files[0] }));
    } else if (name === "categoriaId") {
      setForm((f) => ({
        ...f,
        categoriaId: value ? Number(value) : undefined,
      }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("image", file);
    try {
      const res = await axios.post(
        `${API_URL}/products/upload-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      return res.data.url;
    } catch {
      alert("Errore durante l'upload dell'immagine");
      return null;
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      let imageUrl = form.immagine;
      if (form.imageFile) {
        imageUrl = (await handleImageUpload(form.imageFile)) || undefined;
      }
      const payload = {
        titolo: form.titolo,
        prezzo: Number(form.prezzo),
        descrizione: form.descrizione,
        immagine: imageUrl,
        categoriaId: form.categoriaId ? Number(form.categoriaId) : undefined,
        stock: form.stock !== undefined ? Number(form.stock) : 0,
      };
      if (editProduct) {
        await axios.put(`${API_URL}/products/${editProduct.id}`, payload, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
      } else {
        await axios.post(`${API_URL}/products`, payload, {
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
    setFormLoading(false);
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
          {/* Filtri sopra la tabella */}
          <div className="flex flex-wrap gap-2 mb-4 items-end">
            <input
              type="text"
              placeholder="Cerca per nome... "
              className="border rounded px-2 py-1"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <select
              className="border rounded px-2 py-1 min-w-[200px]"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Tutte le categorie</option>
              {parentCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="ml-2 px-2 py-1 bg-gray-200 rounded text-xs"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              Ordina per nome {sortOrder === "asc" ? "↓" : "↑"}
            </button>
          </div>
          <table className="w-full min-w-[900px] whitespace-nowrap border rounded-xl bg-white">
            <thead>
              <tr className="bg-[#e8f2ec]">
                <th className="p-2">ID</th>
                <th className="p-2">Titolo</th>
                <th className="p-2">Prezzo</th>
                <th className="p-2">Categoria</th>
                <th className="p-2">Immagine</th>
                <th className="p-2">Stock</th>
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
      {/* Paginazione */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          &lt;
        </button>
        <span>
          Pagina {page} di {totalPages}
        </span>
        <button
          className="px-3 py-1 rounded bg-gray-200 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
        >
          &gt;
        </button>
      </div>
      {/* Form prodotto */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <form
            className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative"
            onSubmit={handleFormSubmit}
          >
            <button
              type="button"
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#51946b]"
              onClick={() => {
                setShowForm(false);
                setEditProduct(null);
                setForm({});
              }}
              aria-label="Chiudi"
            >
              {/* Usa una icona SVG per la X */}
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
              {editProduct ? "Modifica prodotto" : "Nuovo prodotto"}
            </h3>
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
              <label className="block text-sm font-medium mb-1">Immagine</label>
              <input
                name="immagine"
                className="w-full border rounded px-3 py-2 mb-1"
                value={form.immagine || ""}
                onChange={handleFormChange}
                placeholder="URL immagine o carica file"
                required
              />
              <input
                type="file"
                accept="image/*"
                className="w-full border rounded px-3 py-2"
                onChange={handleFormChange}
                required={!form.immagine}
              />
              {form.immagine && (
                <img
                  src={form.immagine}
                  alt="preview"
                  className="h-16 mt-2 rounded"
                />
              )}
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
                required
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
            <div className="mb-2">
              <label className="block text-sm font-medium mb-1">Stock</label>
              <input
                name="stock"
                type="number"
                min="0"
                className="w-full border rounded px-3 py-2"
                value={form.stock ?? 0}
                onChange={handleFormChange}
                required
              />
            </div>
            <button
              type="submit"
              className="mt-4 w-full bg-[#51946b] text-white font-semibold py-2 rounded flex items-center justify-center"
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
          </form>
        </div>
      )}
    </div>
  );
}
