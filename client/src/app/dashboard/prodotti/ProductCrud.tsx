"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { fetchCategoriesStart } from "@/redux/categorySlice";
import { selectParentCategories } from "@/redux/categorySelectors";
import { Product, ProductFormData } from "./types";
import { ProductService } from "./ProductService";
import ProductTable from "./ProductTable";
import ProductForm from "./ProductForm";
import ProductFilters from "./ProductFilters";
import ProductCard from "./ProductCard";
import Pagination from "./Pagination";
import { useNotifications } from "@/components/ui/NotificationProvider";

export default function ProductCrud() {
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const parentCategories = useSelector(selectParentCategories);
  const { showToast, showConfirm } = useNotifications();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>({ stock: 0, varianti: [] });
  const [formLoading, setFormLoading] = useState(false);

  // Stato per paginazione e filtri
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [totalPages, setTotalPages] = useState(1);
  // Inizializza il servizio prodotti
  const productService = new ProductService(token || undefined);

  useEffect(() => {
    // Blocca lo scroll del body quando la modale è aperta
    if (showForm) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Funzione di cleanup per ripristinare lo scroll quando il componente viene smontato
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showForm]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchInput.length >= 3 || searchInput.length === 0) {
        setSearch(searchInput);
        setPage(1);
      }
    }, 1000);
    return () => clearTimeout(delayDebounce);
  }, [searchInput]);

  useEffect(() => {
    fetchProducts();
    dispatch(fetchCategoriesStart());
  }, [page, limit, search, selectedCategory, sortOrder]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    const result = await productService.fetchProducts({
      limit,
      page,
      sortBy: "titolo",
      sortOrder,
      search: search || undefined,
      categoryId: selectedCategory || undefined,
    });

    setProducts(result.products);
    setTotalPages(result.totalPages);
    setError(result.error);
    setLoading(false);
  };
  const handleEdit = async (product: Product) => {
    try {
      setLoading(true);
      console.log("Original product:", product);

      // Recupera i dati completi del prodotto direttamente dall'API
      const fullProduct = await productService.fetchProductById(product.id);
      console.log("Full product from API:", fullProduct);
      console.log("Varianti in full product:", fullProduct.varianti);

      // Assicuriamoci che le varianti siano definite
      const processedProduct = {
        ...fullProduct,
        varianti: Array.isArray(fullProduct.varianti)
          ? fullProduct.varianti
          : [],
      };

      console.log(
        "Processed product with variants:",
        processedProduct.varianti
      );

      setEditProduct(processedProduct);
      setForm({
        ...processedProduct,
        categoriaId:
          processedProduct.categoria && processedProduct.categoria.length > 0
            ? Number(processedProduct.categoria[0].id)
            : undefined,
        stock: processedProduct.stock ?? 0,
        varianti: processedProduct.varianti || [],
      });

      console.log("Form data with variants:", processedProduct.varianti);
      setShowForm(true);
    } catch (error) {
      console.error("Error fetching product details:", error);
      showToast("Errore nel recuperare i dettagli del prodotto", "error");
    } finally {
      setLoading(false);
    }
  };
  const handleDelete = async (id: number) => {
    showConfirm({
      title: "Conferma eliminazione",
      message:
        "Sei sicuro di voler eliminare questo prodotto? Questa azione non può essere annullata.",
      confirmText: "Elimina",
      cancelText: "Annulla",
      confirmVariant: "danger",
      onConfirm: async () => {
        const result = await productService.deleteProduct(id);
        if (result.success) {
          setProducts((prev) => prev.filter((p) => p.id !== id));
          showToast("Prodotto eliminato con successo", "success");
        } else {
          showToast(
            result.error || "Errore durante l'eliminazione del prodotto",
            "error"
          );
        }
      },
    });
  };

  const handleToggleAvailability = async (id: number) => {
    const result = await productService.toggleProductAvailability(id);
    if (result.success && result.product) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, available: result.product.available } : p))
      );
      showToast(
        `Prodotto ${result.product.available ? "disponibile" : "non disponibile"}`,
        "success"
      );
    } else {
      showToast(
        result.error || "Errore durante il cambio di disponibilità",
        "error"
      );
    }
  };

  const handleFormChange = (data: ProductFormData) => {
    setForm(data);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    const result = await productService.saveProduct(
      form,
      editProduct ? editProduct.id : undefined
    );
    if (result.success) {
      setShowForm(false);
      setEditProduct(null);
      setForm({ stock: 0, varianti: [] });
      fetchProducts();
      showToast(
        editProduct
          ? "Prodotto aggiornato con successo"
          : "Prodotto creato con successo",
        "success"
      );
    } else {
      showToast(
        result.error || "Errore durante il salvataggio del prodotto",
        "error"
      );
    }

    setFormLoading(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditProduct(null);
    setForm({ stock: 0, varianti: [] });
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setPage(1);
  };

  const handleSortOrderChange = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (showForm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="w-full max-w-5xl max-h-[95vh] bg-white rounded-lg shadow-xl flex flex-col overflow-hidden">
          <ProductForm
            product={editProduct}
            formData={form}
            onFormChange={handleFormChange}
            onSubmit={handleFormSubmit}
            onCancel={handleCancel}
            formLoading={formLoading}
            categories={parentCategories}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-4">
        <h2 className="text-2xl font-bold">Prodotti</h2>
        <button
          className="w-full md:w-auto bg-[#51946b] text-white px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-colors shadow-sm"
          onClick={() => {
            setShowForm(true);
            setEditProduct(null);
            setForm({ stock: 0, varianti: [] });
          }}
        >
          + Nuovo Prodotto
        </button>
      </div>
      <ProductFilters
        searchInput={searchInput}
        onSearchChange={handleSearchChange}
        selectedCategory={selectedCategory}
        onCategoryChange={handleCategoryChange}
        sortOrder={sortOrder}
        onSortOrderChange={handleSortOrderChange}
        categories={parentCategories}
      />

      {/* Vista a Griglia per Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:hidden">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleAvailability={handleToggleAvailability}
          />
        ))}
      </div>

      {/* Vista a Tabella per Desktop */}
      <div className="hidden lg:block overflow-hidden">
        <ProductTable
          products={products}
          loading={loading}
          error={error}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleAvailability={handleToggleAvailability}
        />
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
