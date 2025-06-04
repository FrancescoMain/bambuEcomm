"use client";

import React, { useEffect, useState } from "react";
import ProductCard from "@/components/layout/ProductCard";
import SearchBar from "@/components/layout/SearchBar";
import { useRouter } from "next/navigation";
import { fetchLatestProducts } from "@/api/productApi";

type Product = {
  id: number;
  titolo: string;
  immagine?: string;
  prezzo: number | string;
  categoria?: { name: string }[];
  // aggiungi altri campi se servono
};

export default function Home() {
  // Dummy handler for add to cart (replace with real logic)
  const handleAddToCart = (product: { title: string }) => {
    // You can use a toast or Redux action here
    alert(`Aggiunto al carrello: ${product.title}`);
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // State for featured and best seller (ora usano le novità)
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [bestSellerProducts, setBestSellerProducts] = useState<Product[]>([]);

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
            {loading ? (
              <div className="text-gray-500 px-4 py-2">Caricamento...</div>
            ) : error ? (
              <div className="text-red-500 px-4 py-2">{error}</div>
            ) : featuredProducts.length === 0 ? (
              <div className="text-gray-500 px-4 py-2">Nessun prodotto</div>
            ) : (
              featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  image={product.immagine || "/file.svg"}
                  title={product.titolo}
                  category={product.categoria?.[0]?.name || ""}
                  price={product.prezzo}
                  onAddToCart={() => handleAddToCart({ title: product.titolo })}
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
            {loading ? (
              <div className="text-gray-500 px-4 py-2">Caricamento...</div>
            ) : error ? (
              <div className="text-red-500 px-4 py-2">{error}</div>
            ) : latestProducts.length === 0 ? (
              <div className="text-gray-500 px-4 py-2">Nessun prodotto</div>
            ) : (
              latestProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  image={product.immagine || "/file.svg"}
                  title={product.titolo}
                  category={product.categoria?.[0]?.name || ""}
                  price={product.prezzo}
                  onAddToCart={() => handleAddToCart({ title: product.titolo })}
                />
              ))
            )}
          </div>
        </div>
        {/* Best Sellers */}
        <h2 className="text-[#0e1a13] text-xl md:text-2xl font-bold leading-tight tracking-[-0.015em] px-2 md:px-4 pb-3 pt-5">
          Best Seller
        </h2>
        <div className="flex overflow-x-auto no-scrollbar">
          <div className="flex items-stretch p-2 md:p-4 gap-3">
            {loading ? (
              <div className="text-gray-500 px-4 py-2">Caricamento...</div>
            ) : error ? (
              <div className="text-red-500 px-4 py-2">{error}</div>
            ) : bestSellerProducts.length === 0 ? (
              <div className="text-gray-500 px-4 py-2">Nessun prodotto</div>
            ) : (
              bestSellerProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  image={product.immagine || "/file.svg"}
                  title={product.titolo}
                  category={product.categoria?.[0]?.name || ""}
                  price={product.prezzo}
                  onAddToCart={() => handleAddToCart({ title: product.titolo })}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
