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
  }, [setLoading]);

  // Navigazione al dettaglio prodotto con loader
  const handleProductClick = (productId: number | string) => {
    setLoading(true);
    router.push(`/product/${productId}`);
  };

  // Categorie mock per la demo
  const categories = [
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
              </h1>
              <p className="text-xl lg:text-2xl text-gray-100">
                Scopri libri, cancelleria e materiali per l'arte. Tutto quello
                che ti serve per studiare e creare.
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
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => router.push("/products")}
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
                <div className="text-center">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
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
            </div>
            <button
              onClick={() => router.push("/products")}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 shadow-sm animate-pulse"
                >
                  <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-6 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
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
                    categoria: product.categoria?.[0]?.name || "",
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
          )}

          <div className="text-center mt-12 lg:hidden">
            <button
              onClick={() => router.push("/products")}
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
              <h2 className="text-3xl lg:text-5xl font-bold mb-6">
                🎯 Offerte Speciali
              </h2>
              <p className="text-xl lg:text-2xl mb-8 text-gray-100">
                Scopri le nostre promozioni esclusive su libri e cancelleria
              </p>
              <button
                onClick={() => router.push("/offers")}
                className="bg-white text-[#51946b] px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
              >
                Scopri le Offerte
              </button>
            </div>

            {/* Decorative elements */}
            <div className="absolute top-4 right-4 text-6xl opacity-20">📚</div>
            <div className="absolute bottom-4 left-4 text-4xl opacity-20">
              ✏️
            </div>
            <div className="absolute top-1/2 left-8 text-3xl opacity-10">
              🎨
            </div>
          </div>
        </div>
      </section>

      {/* Latest Products */}
      <section className="py-16 lg:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              ✨ Nuovi Arrivi
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
      </section>

      {/* Newsletter Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            📬 Rimani Aggiornato
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Iscriviti alla nostra newsletter per ricevere offerte esclusive e
            novità
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="La tua email"
              className="flex-1 px-6 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#51946b] focus:border-transparent"
            />
            <button className="bg-[#51946b] text-white px-8 py-3 rounded-full font-semibold hover:bg-[#3d7a57] transition-colors whitespace-nowrap">
              Iscriviti
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
