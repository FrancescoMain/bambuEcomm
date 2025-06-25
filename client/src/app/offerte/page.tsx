"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { addToCart } from "@/redux/cartSlice";

// Mock data per i prodotti in offerta
const mockOffers = [
  {
    id: 1,
    name: "Set Quaderni Moleskine",
    originalPrice: 28.99,
    discountPrice: 15.99,
    discount: 45,
    image: "/api/placeholder/300/300",
    category: "Cancelleria",
    inStock: true,
  },
  {
    id: 2,
    name: "Penne Bic Multicolori Set 12",
    originalPrice: 19.99,
    discountPrice: 12.49,
    discount: 35,
    image: "/api/placeholder/300/300",
    category: "Cancelleria",
    inStock: true,
  },
  {
    id: 3,
    name: "Libro: Il Nome della Rosa",
    originalPrice: 14.99,
    discountPrice: 8.99,
    discount: 40,
    image: "/api/placeholder/300/300",
    category: "Libri",
    inStock: true,
  },
  {
    id: 4,
    name: "Zaino Scuola Eastpak",
    originalPrice: 54.99,
    discountPrice: 24.99,
    discount: 55,
    image: "/api/placeholder/300/300",
    category: "Zaini",
    inStock: true,
  },
  {
    id: 5,
    name: "Set Acquerelli Winsor & Newton",
    originalPrice: 32.99,
    discountPrice: 16.49,
    discount: 50,
    image: "/api/placeholder/300/300",
    category: "Arte",
    inStock: true,
  },
  {
    id: 6,
    name: "Agenda 2025 Leuchtturm",
    originalPrice: 22.99,
    discountPrice: 16.09,
    discount: 30,
    image: "/api/placeholder/300/300",
    category: "Cancelleria",
    inStock: true,
  },
  {
    id: 7,
    name: "Libro: Sapiens da Harari",
    originalPrice: 18.99,
    discountPrice: 11.39,
    discount: 40,
    image: "/api/placeholder/300/300",
    category: "Libri",
    inStock: true,
  },
  {
    id: 8,
    name: "Set Matite Faber Castell",
    originalPrice: 25.99,
    discountPrice: 17.99,
    discount: 30,
    image: "/api/placeholder/300/300",
    category: "Arte",
    inStock: true,
  },
  {
    id: 9,
    name: "Borsa Laptop Thule",
    originalPrice: 45.99,
    discountPrice: 32.19,
    discount: 30,
    image: "/api/placeholder/300/300",
    category: "Zaini",
    inStock: true,
  },
  {
    id: 10,
    name: "Libro: 1984 di Orwell",
    originalPrice: 12.99,
    discountPrice: 7.79,
    discount: 40,
    image: "/api/placeholder/300/300",
    category: "Libri",
    inStock: true,
  },
  {
    id: 11,
    name: "Set Evidenziatori Stabilo",
    originalPrice: 15.99,
    discountPrice: 11.19,
    discount: 30,
    image: "/api/placeholder/300/300",
    category: "Cancelleria",
    inStock: true,
  },
  {
    id: 12,
    name: "Kit Pittura Completo",
    originalPrice: 42.99,
    discountPrice: 21.49,
    discount: 50,
    image: "/api/placeholder/300/300",
    category: "Arte",
    inStock: true,
  },
];

const categories = ["Tutti", "Libri", "Cancelleria", "Arte", "Zaini"];
const sortOptions = [
  { value: "discount-desc", label: "Sconto più alto" },
  { value: "discount-asc", label: "Sconto più basso" },
  { value: "price-asc", label: "Prezzo crescente" },
  { value: "price-desc", label: "Prezzo decrescente" },
  { value: "name-asc", label: "Nome A-Z" },
];

export default function OffertePage() {
  const dispatch = useDispatch();
  const [products, setProducts] = useState(mockOffers);
  const [filteredProducts, setFilteredProducts] = useState(mockOffers);
  const [selectedCategory, setSelectedCategory] = useState("Tutti");
  const [sortBy, setSortBy] = useState("discount-desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  // Filtraggio e ordinamento
  useEffect(() => {
    let filtered = [...products];

    // Filtra per categoria
    if (selectedCategory !== "Tutti") {
      filtered = filtered.filter(
        (product) => product.category === selectedCategory
      );
    }

    // Filtra per ricerca
    if (searchQuery) {
      filtered = filtered.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Ordina
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "discount-desc":
          return b.discount - a.discount;
        case "discount-asc":
          return a.discount - b.discount;
        case "price-asc":
          return a.discountPrice - b.discountPrice;
        case "price-desc":
          return b.discountPrice - a.discountPrice;
        case "name-asc":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
    setCurrentPage(1);
  }, [selectedCategory, sortBy, searchQuery, products]);

  // Paginazione
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  const handleAddToCart = (product: any) => {
    dispatch(
      addToCart({
        productId: product.id,
        titolo: product.name,
        prezzo: product.discountPrice,
        immagine: product.image,
        quantity: 1,
      })
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#51946b] to-[#3d7a57] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="mb-4">
            <span className="text-5xl mb-4 block">🎯</span>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Offerte Speciali
            </h1>
            <p className="text-xl md:text-2xl text-green-100">
              Scopri i nostri prodotti scontati
            </p>
          </div>
        </div>
      </div>

      {/* Filtri e Ricerca */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Desktop Filters */}
            <div className="hidden md:flex items-center gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51946b] focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51946b] focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Filters */}
            <div className="md:hidden w-full space-y-3">
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51946b] focus:border-transparent"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51946b] focus:border-transparent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-auto">
              <input
                type="text"
                placeholder="🔍 Cerca prodotti..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-80 px-4 py-2 pl-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#51946b] focus:border-transparent"
              />
            </div>
          </div>

          {/* Results Counter */}
          <div className="mt-4 text-center md:text-left">
            <p className="text-gray-600">
              Mostra {currentProducts.length} di {filteredProducts.length}{" "}
              prodotti in offerta
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {currentProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow border border-gray-100 overflow-hidden group"
              >
                {/* Discount Badge */}
                <div className="relative">
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-lg shadow-sm">
                      💥 -{product.discount}%
                    </span>
                  </div>

                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.name}
                  </h3>

                  {/* Pricing */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl font-bold text-[#51946b]">
                      €{product.discountPrice.toFixed(2)}
                    </span>
                    <span className="text-gray-500 line-through text-sm">
                      €{product.originalPrice.toFixed(2)}
                    </span>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={!product.inStock}
                    className="w-full bg-[#51946b] hover:bg-[#3d7a57] text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {product.inStock
                      ? "Aggiungi al Carrello"
                      : "Non Disponibile"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Nessun prodotto trovato
            </h3>
            <p className="text-gray-600 mb-4">
              Prova a modificare i filtri o la ricerca
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("Tutti");
                setSortBy("discount-desc");
              }}
              className="bg-[#51946b] hover:bg-[#3d7a57] text-white px-6 py-2 rounded-lg transition-colors"
            >
              Resetta Filtri
            </button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ←
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 border rounded-lg ${
                      currentPage === page
                        ? "bg-[#51946b] text-white border-[#51946b]"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>

            <p className="text-gray-600 text-sm">
              Pagina {currentPage} di {totalPages}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
