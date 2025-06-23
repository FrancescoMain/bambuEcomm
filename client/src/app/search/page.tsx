"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import ProductCard from "@/components/layout/ProductCard";
import { fetchCategoriesStart } from "@/redux/categorySlice";
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
interface Filters {
  search: string;
  category: number | null;
  subcategory: number | null;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
}

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
  const [showFilters, setShowFilters] = useState(false);
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
  const cartItems = useSelector(
    (state: { cart: { items: CartItem[] } }) => state.cart.items
  );

  const [filters, setFilters] = useState<Filters>({
    search: query,
    category: null,
    subcategory: null,
    minPrice: "",
    maxPrice: "",
    sortBy: "relevance",
  });

  // Quick categories (matching home page)
  const quickCategories = [
    { id: 1, name: "Libri", icon: "📚", color: "from-blue-500 to-blue-600" },
    {
      id: 2,
      name: "Cancelleria",
      icon: "✏️",
      color: "from-green-500 to-green-600",
    },
    { id: 3, name: "Arte", icon: "🎨", color: "from-purple-500 to-purple-600" },
    {
      id: 4,
      name: "Zaini",
      icon: "🎒",
      color: "from-orange-500 to-orange-600",
    },
  ];

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
              {quickCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleQuickCategory(category.name)}
                  className={`relative px-6 py-3 rounded-full bg-gradient-to-r ${category.color} text-white font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.name}
                </button>
              ))}
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
              <span className="text-gray-900 font-medium">Ricerca</span>
              {query && (
                <>
                  <span className="text-gray-400">/</span>
                  <span className="text-[#51946b] font-medium">"{query}"</span>
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
          <div className="lg:grid lg:grid-cols-4 lg:gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Filtri</h3>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  </button>
                </div>

                <div
                  className={`space-y-6 ${
                    showFilters ? "block" : "hidden lg:block"
                  }`}
                >
                  {/* Sort Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Ordina per
                    </label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) =>
                        setFilters({ ...filters, sortBy: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51946b]"
                    >
                      <option value="relevance">Rilevanza</option>
                      <option value="price_asc">Prezzo: crescente</option>
                      <option value="price_desc">Prezzo: decrescente</option>
                      <option value="newest">Più recenti</option>
                      <option value="popular">Più popolari</option>
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Fascia di prezzo
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        placeholder="Min €"
                        value={filters.minPrice}
                        onChange={(e) =>
                          setFilters({ ...filters, minPrice: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51946b]"
                      />
                      <input
                        type="number"
                        placeholder="Max €"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          setFilters({ ...filters, maxPrice: e.target.value })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#51946b]"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-4 border-t border-gray-200">
                    <button className="w-full bg-[#51946b] text-white py-3 rounded-lg font-semibold hover:bg-[#3d7a57] transition-colors">
                      Applica Filtri
                    </button>
                    <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                      Cancella Tutto
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="lg:col-span-3 mt-8 lg:mt-0">
              {products.length === 0 ? (
                /* Empty State */
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
        </div>
      </section>

      {/* Suggestions Section */}
      {products.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">
                💡 Potrebbe interessarti anche
              </h3>
              <div className="flex flex-wrap justify-center gap-4">
                {[
                  "Nuovi Arrivi",
                  "Offerte Speciali",
                  "Bestseller",
                  "Sconti",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() =>
                      router.push(`/search?q=${encodeURIComponent(suggestion)}`)
                    }
                    className="px-6 py-3 bg-white text-[#51946b] rounded-full font-semibold hover:bg-[#51946b] hover:text-white transition-colors shadow-md"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>{" "}
          </div>{" "}
        </section>
      )}
    </div>
  );
}
