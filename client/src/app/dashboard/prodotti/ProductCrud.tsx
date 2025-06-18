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
import Pagination from "./Pagination";

export default function ProductCrud() {
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const parentCategories = useSelector(selectParentCategories);
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
      alert("Errore nel recuperare i dettagli del prodotto");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Sei sicuro di voler eliminare questo prodotto?"))
      return;

    const result = await productService.deleteProduct(id);
    if (result.success) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } else {
      alert(result.error);
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
    } else {
      alert(result.error);
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

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Prodotti</h2>
        <button
          className="bg-[#51946b] text-white px-4 py-2 rounded font-semibold"
          onClick={() => {
            setShowForm(true);
            setEditProduct(null);
            setForm({ stock: 0, varianti: [] });
          }}
        >
          + Nuovo prodotto
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
      <ProductTable
        products={products}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 overflow-auto py-8">
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
      )}{" "}
    </div>
  );
}
