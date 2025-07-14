"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import ProductCard from "@/components/layout/ProductCard";
import { fetchCategoriesStart } from "@/redux/categorySlice";
import { selectParentCategories, selectCategoriesLoading } from "@/redux/categorySelectors";
import { useCartActions } from "@/components/layout/CartProvider";
import { RootState } from "@/redux/store";
import { useLoading } from "@/components/layout/LoadingContext";
import searchService, { ProductQueryParams } from "@/api/searchService";

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}

// Types
interface Product {
  id: string;
  titolo: string;
  prezzo: number;
  immagine: string;
  categoria?: string;
  autore?: string;
  [key: string]: unknown;
}

interface Category {
  id: number;
  name: string;
  parentId?: number | null;
}

interface CartItem {
  productId: number;
  titolo: string;
  prezzo: number;
  immagine?: string;
  quantity: number;
  cartItemId?: number;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams?.get("q") || "";
  const categoryQuery = searchParams?.get("category") || "";

  const [search, setSearch] = useState(query);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadCount, setLoadCount] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const router = useRouter();
  const dispatch = useDispatch();
  const { setLoading } = useLoading();
  const { handleAddToCart } = useCartActions();

  const categories = useSelector(
    (state: RootState) => state.category.categories as Category[]
  );
  const parentCategories = useSelector(selectParentCategories);
  const categoriesLoading = useSelector(selectCategoriesLoading);
  const cartItems = useSelector(
    (state: { cart: { items: CartItem[] } }) => state.cart.items
  );

  // Generate icons and colors for dynamic categories (same as homepage)
  const getCategoryIcon = (categoryName: string) => {
    // Default icon based on category name keywords
    if (categoryName.toLowerCase().includes("quadern") || categoryName.toLowerCase().includes("scuola")) {
      return (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
      );
    } else if (categoryName.toLowerCase().includes("canceller") || categoryName.toLowerCase().includes("penna") || categoryName.toLowerCase().includes("ufficio")) {
      return (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
        </svg>
      );
    } else if (categoryName.toLowerCase().includes("gioch") || categoryName.toLowerCase().includes("giocatt")) {
      return (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        </svg>
      );
    } else if (categoryName.toLowerCase().includes("zaino") || categoryName.toLowerCase().includes("borsa")) {
      return (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 8v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h2V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2h2c1.1 0 2 .9 2 2zM10 4v2h4V4h-4zm8 16V8H6v12h12zm-3-9v2h-6v-2h6z" />
        </svg>
      );
    } else {
      // Default generic icon
      return (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
        </svg>
      );
    }
  };

  const getCategoryColor = (index: number) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-green-500 to-green-600", 
      "from-purple-500 to-purple-600",
      "from-orange-500 to-orange-600",
      "from-red-500 to-red-600",
      "from-indigo-500 to-indigo-600",
      "from-pink-500 to-pink-600",
      "from-yellow-500 to-yellow-600"
    ];
    return colors[index % colors.length];
  };

  // Generate dynamic quick categories from Redux store
  const quickCategories = parentCategories.slice(0, 4).map((category, index) => ({
    id: category.id,
    name: category.name,
    icon: getCategoryIcon(category.name),
    color: getCategoryColor(index),
  }));

  // Load categories on mount
  useEffect(() => {
    dispatch(fetchCategoriesStart());
  }, [dispatch]);

  // Handle initial search and category from URL
  useEffect(() => {
    if (categories.length === 0) return;

    setLoading(true);
    loadInitialProducts();
  }, [searchParams, categories]);

  const loadInitialProducts = async () => {
    try {
      const params: ProductQueryParams = {
        limit: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      if (query) {
        params.search = query;
      }

      if (categoryQuery) {
        const found = categories.find(
          (cat: Category) =>
            cat.name.toLowerCase() === categoryQuery.toLowerCase()
        );
        if (found) {
          const subcats = categories.filter(
            (cat: Category) => cat.parentId === found.id
          );
          params.categoryId =
            subcats.length > 0 ? subcats.map((c: Category) => c.id) : found.id;
        }
      }

      const results = await searchService.searchProducts(params);
      setProducts(results);
      setHasMore(results.length === 20);
    } catch (error) {
      console.error("Search error:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    if (search.trim()) {
      const params = new URLSearchParams();
      params.set("q", search.trim());
      router.push(`/search?${params.toString()}`);
    }
  };

  // Handle quick category click
  const handleQuickCategory = (categoryName: string) => {
    const params = new URLSearchParams();
    params.set("category", categoryName);
    router.push(`/search?${params.toString()}`);
  };
  // Handle load more
  const handleLoadMore = async () => {
    setLoading(true);
    try {
      const moreProducts = await searchService.loadMoreProducts(20);
      setProducts((prev) => [...prev, ...moreProducts]);
      setLoadCount((prev) => prev + 1);
      setHasMore(moreProducts.length === 20);
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Cart adapter
  const handleAddToCartAdapter = async (product: {
    id: string;
    titolo: string;
    prezzo: number;
    immagine: string;
    categoria?: string;
  }) => {
    setLoading(true);
    await handleAddToCart({
      productId: Number(product.id),
      titolo: product.titolo,
      prezzo: product.prezzo,
      immagine: product.immagine,
      quantity: 1,
    });
    setLoading(false);
  };

  // Product click handler
  const handleProductClick = (productId: number | string) => {
    setLoading(true);
    router.push(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Search Section */}
      <section className="relative bg-gradient-to-r from-[#51946b] to-[#3d7a57] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-16 lg:py-24">
          <div className="text-center space-y-8">
            {/* Title */}
            <div>
              <h1 className="text-3xl lg:text-5xl font-bold mb-4">
                🔍 Trova quello che cerchi
              </h1>
              <p className="text-xl text-gray-100">
                Esplora migliaia di prodotti: libri, cancelleria, arte e molto
                altro
              </p>
            </div>

            {/* Main Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cerca prodotti, libri, cancelleria..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearchSubmit()}
                  className="w-full px-6 py-4 pl-14 text-gray-900 rounded-2xl border-0 shadow-lg text-lg focus:outline-none focus:ring-4 focus:ring-white/30"
                />
                <svg
                  className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <button
                  onClick={handleSearchSubmit}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#51946b] text-white px-6 py-2 rounded-xl font-semibold hover:bg-[#3d7a57] transition-colors"
                >
                  Cerca
                </button>
              </div>
            </div>

            {/* Quick Category Filters */}
            <div className="flex flex-wrap justify-center gap-4">
              {categoriesLoading ? (
                // Loading skeleton for quick categories
                Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-32 h-12 bg-gray-200 rounded-full animate-pulse"
                  />
                ))
              ) : (
                quickCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleQuickCategory(category.name)}
                    className={`relative px-6 py-3 rounded-full bg-gradient-to-r ${category.color} text-white font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center`}
                  >
                    <span className="mr-2 flex items-center">
                      {category.icon}
                    </span>
                    {category.name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full h-12 lg:h-20">
            <path
              fill="rgb(249 250 251)"
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,69.3C960,85,1056,107,1152,112C1248,117,1344,107,1392,101.3L1440,96L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Breadcrumb */}
      <section className="py-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <nav className="flex items-center space-x-2 text-sm">
              <button
                onClick={() => router.push("/")}
                className="text-gray-500 hover:text-[#51946b] transition-colors"
              >
                Home
              </button>
              <span className="text-gray-400">/</span>
              <span className="text-gray-900 font-medium">Ricerca</span>{" "}
              {query && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-[#51946b] font-medium">
                    &quot;{query}&quot;
                  </span>
                </>
              )}
            </nav>

            <div className="text-sm text-gray-600">
              {products.length}{" "}
              {products.length === 1 ? "risultato" : "risultati"} trovati
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          {/* Results */}
          <div className="w-full">
            {products.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Nessun risultato trovato
                </h3>
                <p className="text-gray-600 mb-8">
                  Prova a modificare i filtri o i termini di ricerca
                </p>

                {/* Popular Searches */}
                <div className="max-w-md mx-auto">
                  <h4 className="text-sm font-medium text-gray-700 mb-4">
                    🔥 Ricerche popolari:
                  </h4>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {["Quaderni", "Penne", "Romanzi", "Acquerelli"].map(
                      (term) => (
                        <button
                          key={term}
                          onClick={() => {
                            setSearch(term);
                            router.push(
                              `/search?q=${encodeURIComponent(term)}`
                            );
                          }}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-[#51946b] hover:text-white transition-colors"
                        >
                          {term}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={{
                        id: String(product.id),
                        titolo: product.titolo,
                        prezzo:
                          typeof product.prezzo === "number"
                            ? product.prezzo
                            : parseFloat(product.prezzo as string) || 0,
                        immagine: product.immagine || "/file.svg",
                        categoria: product.categoria || "",
                      }}
                      isInCart={cartItems.some(
                        (item: CartItem) =>
                          String(item.productId) === String(product.id)
                      )}
                      onAddToCart={handleAddToCartAdapter}
                      onClick={() => handleProductClick(product.id)}
                    />
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center mt-12">
                    <button
                      onClick={handleLoadMore}
                      className="bg-[#51946b] text-white px-8 py-4 rounded-full font-semibold hover:bg-[#3d7a57] transition-colors shadow-lg"
                    >
                      Carica Altri Prodotti
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
