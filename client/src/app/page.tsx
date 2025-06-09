"use client";

import React, { useEffect, useState } from "react";
import ProductCard from "@/components/layout/ProductCard";
import SearchBar from "@/components/layout/SearchBar";
import { useRouter } from "next/navigation";
import { fetchLatestProducts } from "@/api/productApi";
import { useCartActions } from "@/components/layout/CartProvider";
import { useLoading } from "@/components/layout/LoadingContext";
import { useSelector } from "react-redux";

type Product = {
  id: number;
  titolo: string;
  immagine?: string;
  prezzo: number | string;
  categoria?: { name: string }[];
  // aggiungi altri campi se servono
};

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

  // State for new arrivals
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");

  // State for featured and best seller (ora usano le novità)
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);

  // State for page loading
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchLatestProducts(10)
      .then((data) => {
        const products = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : [];
        setLatestProducts(products);
        setFeaturedProducts(products); // Per ora uguale alle novità
        setBestSellerProducts(products); // Per ora uguale alle novità
        setError("");
      })
      .catch(() => setError("Errore nel caricamento dei prodotti"))
      .finally(() => setLoading(false));
  }, []);

  // Navigazione al dettaglio prodotto con loader
  const handleProductClick = (productId: number | string) => {
    setLoading(true);
    router.push(`/product/${productId}`);
  };

  return (
    <div className="flex flex-1 justify-center py-8 px-2 md:px-10 bg-[#f8fbfa] min-h-screen">
      <div className="layout-content-container flex flex-col max-w-5xl w-full flex-1">
        {/* Search Bar */}
        <div className="px-2 md:px-4 py-3">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            onSubmit={handleSearchSubmit}
            placeholder="Cerca libri, cancelleria e altro..."
          />
        </div>
        {/* Featured Products */}
        <h2 className="text-[#0e1a13] text-xl md:text-2xl font-bold leading-tight tracking-[-0.015em] px-2 md:px-4 pb-3 pt-5">
          Prodotti in evidenza
        </h2>
        <div className="flex overflow-x-auto no-scrollbar">
          <div className="flex items-stretch p-2 md:p-4 gap-3">
            {error ? (
              <div className="text-red-500 px-4 py-2">{error}</div>
            ) : featuredProducts.length === 0 ? (
              <div className="text-gray-500 px-4 py-2">Nessun prodotto</div>
            ) : (
              featuredProducts.map((product) => (
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
              ))
            )}
          </div>
        </div>
        {/* New Arrivals */}
        <h2 className="text-[#0e1a13] text-xl md:text-2xl font-bold leading-tight tracking-[-0.015em] px-2 md:px-4 pb-3 pt-5">
          Novità
        </h2>
        <div className="flex overflow-x-auto no-scrollbar">
          <div className="flex items-stretch p-2 md:p-4 gap-3">
            {error ? (
              <div className="text-red-500 px-4 py-2">{error}</div>
            ) : latestProducts.length === 0 ? (
              <div className="text-gray-500 px-4 py-2">Nessun prodotto</div>
            ) : (
              latestProducts.map((product) => (
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
                />
              ))
            )}
          </div>
        </div>
        {/* Loader overlay */}
        {pageLoading && (
          <div className="fixed inset-0 bg-white bg-opacity-60 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#51946b]"></div>
          </div>
        )}
      </div>
    </div>
  );
}
