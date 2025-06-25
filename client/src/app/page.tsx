"use client";

import React, { useEffect, useState } from "react";
import ProductCard from "@/components/layout/ProductCard";
import SearchBar from "@/components/layout/SearchBar";
import { useRouter } from "next/navigation";
import {
  fetchLatestProducts,
  Product,
  PaginatedProductsResponse,
} from "@/api/productApi";
import { useCartActions } from "@/components/layout/CartProvider";
import { useLoading } from "@/components/layout/LoadingContext";
import { useSelector } from "react-redux";

// Tipo locale per la compatibilità con i componenti esistenti
type LocalProduct = {
  id: number;
  titolo: string;
  immagine?: string;
  prezzo: number | string;
  categoria?: { name: string }[];
};

// Funzione per convertire Product API in LocalProduct
const convertApiProductToLocal = (apiProduct: Product): LocalProduct => ({
  id: apiProduct.id,
  titolo: apiProduct.titolo, // ✅ Corretto: usa 'titolo'
  immagine: apiProduct.immagine || "/file.svg", // ✅ Corretto: usa 'immagine'
  prezzo: parseFloat(apiProduct.prezzo) || 0, // ✅ Corretto: converte stringa in numero
  categoria: apiProduct.categoria?.map((cat) => ({ name: cat.name })) || [], // ✅ Corretto: usa array categoria
});

// Tipi locali per il carrello
interface CartItem {
  productId: number;
  titolo: string;
  prezzo: number;
  immagine?: string;
  quantity: number;
  cartItemId?: number;
}

export default function Home() {
  const { handleAddToCart } = useCartActions();
  const { setLoading } = useLoading();
  const cartItems = useSelector(
    (state: { cart: { items: CartItem[] } }) => state.cart.items
  );
  // Adapter for ProductCard
  const handleAddToCartAdapter = async (product: {
    id: string;
    titolo: string;
    prezzo: number;
    immagine: string;
    categoria?: string;
  }) => {
    // Non usare più il loader per operazioni del carrello, ora gestito dal CartProvider
    await handleAddToCart({
      productId: Number(product.id),
      titolo: product.titolo,
      prezzo: product.prezzo,
      immagine: product.immagine,
      quantity: 1,
    });
  };

  // State for search bar
  const [search, setSearch] = useState("");
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };
  const router = useRouter();
  const handleSearchSubmit = () => {
    if (search.trim()) {
      router.push(`/search?q=${encodeURIComponent(search)}`);
    }
  };

  // State for products
  const [latestProducts, setLatestProducts] = useState<LocalProduct[]>([]);
  const [error, setError] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState<LocalProduct[]>([]);
  useEffect(() => {
    setLoading(true);
    fetchLatestProducts(12)
      .then((response: PaginatedProductsResponse) => {
        const productsArray = response.data || [];
        const products = Array.isArray(productsArray)
          ? productsArray.map(convertApiProductToLocal)
          : [];
        setLatestProducts(products);
        setFeaturedProducts(products.slice(0, 8)); // Prime 8 per featured
        setError("");
      })
      .catch((error) => {
        console.error("❌ Homepage: Errore caricamento prodotti:", error);
        setError("Errore nel caricamento dei prodotti");
      })
      .finally(() => setLoading(false));
  }, []); // ✅ Empty dependency array - run only once on mount
  // Navigazione al dettaglio prodotto con feedback visivo leggero
  const handleProductClick = (productId: number | string) => {
    // Usa un loading molto breve solo per feedback UX
    setLoading(true);
    // Naviga immediatamente
    router.push(`/product/${productId}`);
    // Spegni il loading dopo un breve momento per feedback
    setTimeout(() => setLoading(false), 300);
  };

  // Categorie mock per la demo
  const categories = [
    {
      id: 1,
      name: "Quaderni",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
        </svg>
      ),
      color: "from-blue-500 to-blue-600",
    },
    {
      id: 2,
      name: "Cancelleria",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
        </svg>
      ),
      color: "from-green-500 to-green-600",
    },
    {
      id: 3,
      name: "Giochi",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
        </svg>
      ),
      color: "from-purple-500 to-purple-600",
    },
    {
      id: 4,
      name: "Zaini",
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 8v12c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h2V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2h2c1.1 0 2 .9 2 2zM10 4v2h4V4h-4zm8 16V8H6v12h12zm-3-9v2h-6v-2h6z" />
        </svg>
      ),
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-[#51946b] to-[#3d7a57] text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                La tua <span className="text-yellow-300">Cartolibreria</span> di
                fiducia
              </h1>{" "}
              <p className="text-xl lg:text-2xl text-gray-100">
                Scopri quaderni, cancelleria e giochi. Tutto quello che ti serve
                per studiare e creare.
              </p>
              {/* Search Bar Hero */}
              <div className="relative max-w-lg">
                <input
                  type="text"
                  placeholder="Cosa stai cercando?"
                  value={search}
                  onChange={handleSearchChange}
                  onKeyPress={(e) => e.key === "Enter" && handleSearchSubmit()}
                  className="w-full px-6 py-4 text-gray-900 rounded-full border-0 shadow-lg text-lg focus:outline-none focus:ring-4 focus:ring-white/30"
                />
                <button
                  onClick={handleSearchSubmit}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#51946b] text-white p-3 rounded-full hover:bg-[#3d7a57] transition-colors"
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>{" "}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => router.push("/search")}
                  className="bg-white text-[#51946b] px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                >
                  Esplora Prodotti
                </button>
                <button
                  onClick={() => router.push("/about")}
                  className="border-2 border-white text-white px-8 py-3 rounded-full font-semibold hover:bg-white hover:text-[#51946b] transition-colors"
                >
                  Chi Siamo
                </button>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <img
                  src="/bambu-logo.jpg"
                  alt="Bambu Logo"
                  className="relative w-96 h-96 object-cover rounded-full shadow-2xl"
                />
              </div>
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
      {/* Categories Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Esplora le Categorie
            </h2>
            <p className="text-xl text-gray-600">
              Trova quello che cerchi nelle nostre categorie principali
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <div
                key={category.id}
                onClick={() =>
                  router.push(
                    `/search?category=${encodeURIComponent(category.name)}`
                  )
                }
                className={`relative p-8 rounded-2xl bg-gradient-to-br ${category.color} text-white cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl group`}
              >
                {" "}
                <div className="text-center">
                  <div className="flex justify-center items-center mb-4 group-hover:scale-110 transition-transform">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-semibold">{category.name}</h3>
                </div>
                <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Featured Products */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Prodotti in Evidenza
              </h2>
              <p className="text-xl text-gray-600">
                I nostri prodotti più popolari selezionati per te
              </p>
            </div>{" "}
            <button
              onClick={() => router.push("/search")}
              className="hidden lg:block bg-[#51946b] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#3d7a57] transition-colors"
            >
              Vedi Tutti →
            </button>
          </div>
          {error ? (
            <div className="text-center text-red-500 py-12">
              <p>{error}</p>
            </div>
          ) : featuredProducts.length === 0 ? (
            <div className="overflow-x-auto">
              <div className="flex gap-6 w-max pb-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-6 shadow-sm animate-pulse w-80"
                  >
                    <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                    <div className="bg-gray-200 h-4 rounded mb-2"></div>
                    <div className="bg-gray-200 h-6 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-6 w-max pb-4">
                {featuredProducts.map((product) => (
                  <div key={product.id} className="w-80">
                    <ProductCard
                      product={{
                        id: String(product.id),
                        titolo: product.titolo,
                        prezzo:
                          typeof product.prezzo === "number"
                            ? product.prezzo
                            : parseFloat(product.prezzo as string) || 0,
                        immagine: product.immagine || "/file.svg",
                        categoria: product.categoria?.[0]?.name || "",
                      }}
                      isInCart={cartItems.some(
                        (item: CartItem) =>
                          String(item.productId) === String(product.id)
                      )}
                      onAddToCart={handleAddToCartAdapter}
                      onClick={() => handleProductClick(product.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}{" "}
          <div className="text-center mt-12 lg:hidden">
            <button
              onClick={() => router.push("/search")}
              className="bg-[#51946b] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#3d7a57] transition-colors"
            >
              Vedi Tutti i Prodotti →
            </button>
          </div>
        </div>
      </section>
      {/* Banner Promozionale */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-gradient-to-r from-[#51946b] to-[#3d7a57] rounded-3xl p-8 lg:p-16 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              {" "}
              <h2 className="text-3xl lg:text-5xl font-bold mb-6 flex items-center justify-center">
                <svg
                  className="w-10 h-10 mr-3 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 7.27l-5 4.87 1.18 6.88L12 15.77l-6.18 3.25L7 12.14 2 7.27l6.91-1.01L12 2z" />
                </svg>
                Offerte Speciali
              </h2>
              <p className="text-xl lg:text-2xl mb-8 text-gray-100">
                Scopri le nostre promozioni esclusive su quaderni e cancelleria
              </p>
              <button
                onClick={() => router.push("/offerte")}
                className="bg-white text-[#51946b] px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Scopri le Offerte
              </button>
            </div>{" "}
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 text-6xl opacity-20">
              <svg
                className="w-12 h-12"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
            </div>
            <div className="absolute bottom-4 left-4 text-4xl opacity-20">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
              </svg>
            </div>
            <div className="absolute top-1/2 left-8 text-3xl opacity-10">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
              </svg>
            </div>
          </div>
        </div>
      </section>
      {/* Latest Products */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          {" "}
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <svg
                className="w-8 h-8 mr-3 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0l3.09 6.26L22 7.27l-5 4.87 1.18 6.88L12 15.77l-6.18 3.25L7 12.14 2 7.27l6.91-1.01L12 0z" />
              </svg>
              Nuovi Arrivi
            </h2>
            <p className="text-xl text-gray-600">
              Gli ultimi prodotti aggiunti al nostro catalogo
            </p>
          </div>
          {error ? (
            <div className="text-center text-red-500 py-12">
              <p>{error}</p>
            </div>
          ) : latestProducts.length === 0 ? (
            <div className="overflow-x-auto">
              <div className="flex gap-6 w-max pb-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-2xl p-6 shadow-sm animate-pulse w-80"
                  >
                    <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                    <div className="bg-gray-200 h-4 rounded mb-2"></div>
                    <div className="bg-gray-200 h-6 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex gap-6 w-max pb-4">
                {latestProducts.map((product) => (
                  <div key={product.id} className="w-80">
                    <ProductCard
                      product={{
                        id: String(product.id),
                        titolo: product.titolo,
                        prezzo:
                          typeof product.prezzo === "number"
                            ? product.prezzo
                            : parseFloat(product.prezzo as string) || 0,
                        immagine: product.immagine || "/file.svg",
                        categoria: product.categoria?.[0]?.name || "",
                      }}
                      isInCart={cartItems.some(
                        (item: CartItem) =>
                          String(item.productId) === String(product.id)
                      )}
                      onAddToCart={handleAddToCartAdapter}
                      onClick={() => handleProductClick(product.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>{" "}
      {/* Social Wall Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-[#e8f2ec] to-white">
        <div className="max-w-6xl mx-auto px-4">
          {" "}
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6 flex items-center justify-center">
              <svg
                className="w-8 h-8 mr-3 text-blue-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M23.32 14.2L19.31 10.2a1 1 0 00-1.41 0L15.58 12.52a7.92 7.92 0 01-3.16-3.16L14.74 7.04a1 1 0 000-1.41L10.74 1.62a1 1 0 00-1.41 0L8.9 2.05a1 1 0 000 1.41l1.42 1.42a7.92 7.92 0 01-3.16 3.16L5.88 6.72a1 1 0 00-1.41 0L.95 11.24a1 1 0 000 1.41l3.52 3.52a1 1 0 001.41 0l1.42-1.42a7.92 7.92 0 013.16 3.16L8.9 19.93a1 1 0 000 1.41l1.42 1.42a1 1 0 001.41 0l4.02-4.02a1 1 0 000-1.41L12.23 13.81a7.92 7.92 0 013.16-3.16l1.42 1.42a1 1 0 001.41 0l3.52-3.52a1 1 0 000-1.41z" />
              </svg>
              Seguici sui Social
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Resta connesso con noi e scopri le ultime novità, promozioni e
              contenuti esclusivi
            </p>
          </div>
          {/* Social Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Instagram */}
            <a
              href="https://instagram.com/cartolibreriabambu"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Instagram
                </h3>
                <p className="text-gray-600">
                  Foto, storie e novità quotidiane
                </p>
              </div>
            </a>

            {/* TikTok */}
            <a
              href="https://tiktok.com/@cartolibreriabambu"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">TikTok</h3>
                <p className="text-gray-600">Video creativi e tutorial</p>
              </div>
            </a>

            {/* Facebook */}
            <a
              href="https://facebook.com/cartolibreriabambu"
              target="_blank"
              rel="noopener noreferrer"
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg
                    className="w-8 h-8 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Facebook
                </h3>
                <p className="text-gray-600">Community e aggiornamenti</p>
              </div>
            </a>
          </div>
          {/* WhatsApp Contact Button */}
          <div className="text-center">
            <a
              href="https://wa.me/3492719021?text=Ciao!%20Vorrei%20informazioni%20sui%20vostri%20prodotti"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              {" "}
              <svg
                className="w-6 h-6 mr-3"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
              </svg>
              Contattaci su WhatsApp
            </a>
            <p className="text-gray-600 mt-4 text-sm">
              Rispondiamo in pochi minuti durante gli orari di apertura
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
