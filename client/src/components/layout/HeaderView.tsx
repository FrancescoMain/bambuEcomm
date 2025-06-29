import React from "react";
import Image from "next/image";
import Link from "next/link";
import type { CartItem } from "@/redux/cartSlice";
import type { User } from "@/redux/authSlice";

export interface HeaderViewProps {
  isLoading: boolean;
  currentUser: User | null;
  cartCount: number;
  menuOpen: boolean;
  menuVisible: boolean;
  profileMenuOpen: boolean;
  cartSidebarOpen: boolean;
  cartSidebarVisible: boolean;
  cartSidebarLoading: boolean;
  parentCategories: Array<{ id: string; name: string }>;
  categoriesLoading: boolean;
  cartItems: CartItem[];
  cartTotal: number;
  searchQuery: string;
  onMenuOpen: () => void;
  onMenuClose: () => void;
  onProfileMenuToggle: () => void;
  onCartSidebarOpen: () => void;
  onCartSidebarClose: () => void;
  onCategoryClick: (catName: string) => void;
  onLoginClick: () => void;
  onLogout: () => void;
  onCartItemClick: (productId: number) => void;
  onCartItemRemove: (productId: number) => void;
  onCartItemQuantityChange: (productId: number, quantity: number) => void;
  onGoToCart: () => void;
  onGoToCheckout: () => void;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  pathname: string;
}

function HeaderView({
  isLoading,
  currentUser,
  cartCount,
  menuOpen,
  menuVisible,
  profileMenuOpen,
  cartSidebarOpen,
  cartSidebarVisible,
  cartSidebarLoading,
  parentCategories,
  categoriesLoading,
  cartItems,
  cartTotal,
  searchQuery,
  onMenuOpen,
  onMenuClose,
  onProfileMenuToggle,
  onCartSidebarOpen,
  onCartSidebarClose,
  onCategoryClick,
  onLoginClick,
  onLogout,
  onCartItemClick,
  onCartItemRemove,
  onCartItemQuantityChange,
  onGoToCart,
  onGoToCheckout,
  onSearchChange,
  onSearchSubmit,
  pathname,
}: HeaderViewProps) {
  return (
    <>
      {/* Header Principal */}
      <header className="sticky top-0 left-0 w-full z-50 bg-white shadow-md">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          {" "}
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-8">
              {/* Logo */}
              <div className="flex items-center flex-shrink-0">
                <Link
                  href="/"
                  className="flex items-center hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/bambu-logo.jpg"
                    alt="Cartolibreria Bambù"
                    width={44}
                    height={44}
                    priority
                    className="object-contain"
                  />
                  <div className="ml-3">
                    <h1 className="text-xl font-bold text-[#51946b]">Bambù</h1>
                    <p className="text-xs text-gray-600">Cartolibreria</p>
                  </div>
                </Link>
              </div>{" "}
              {/* Navigation Menu Desktop */}
              <nav className="flex items-center space-x-6">
                <div className="relative group category-menu">
                  <button className="flex items-center text-gray-700 hover:text-[#51946b] font-medium transition-colors">
                    Categorie
                    <svg
                      className="ml-1 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {/* Dropdown Categories */}
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="p-4">
                      {categoriesLoading ? (
                        <div className="text-gray-500">Caricamento...</div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2">
                          {parentCategories.map((category) => (
                            <button
                              key={category.id}
                              onClick={() => onCategoryClick(category.name)}
                              className="text-left px-3 py-2 text-gray-700 hover:bg-[#e8f2ec] hover:text-[#51946b] rounded-md transition-colors"
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>{" "}
                <a
                  href="/search"
                  className="text-gray-700 hover:text-[#51946b] font-medium transition-colors"
                >
                  Tutti i Prodotti
                </a>
                <a
                  href="/chi-siamo"
                  className="text-gray-700 hover:text-[#51946b] font-medium transition-colors"
                >
                  Chi Siamo
                </a>
              </nav>{" "}
              {/* Search Bar Desktop */}
              <div className="flex-1 max-w-lg mx-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Cerca prodotti..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && onSearchSubmit()}
                    className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#51946b] focus:border-transparent"
                  />
                  <button
                    onClick={onSearchSubmit}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-[#51946b] transition-colors"
                  >
                    <svg
                      className="h-5 w-5"
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
              </div>
              {/* Actions Desktop */}
              <div className="flex items-center space-x-4 flex-shrink-0">
                {/* Cart Button */}
                <button
                  onClick={onCartSidebarOpen}
                  className="relative p-2 text-gray-700 hover:text-[#51946b] transition-colors cart-button"
                  aria-label="Carrello"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6h9M7 13v6a1 1 0 001 1h9a1 1 0 001-1v-6"
                    />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#51946b] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                {isLoading ? (
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                ) : currentUser ? (
                  <div className="relative profile-menu">
                    <button
                      onClick={onProfileMenuToggle}
                      className="flex items-center space-x-2 text-gray-700 hover:text-[#51946b] transition-colors"
                    >
                      <div className="w-8 h-8 bg-[#51946b] text-white rounded-full flex items-center justify-center font-semibold">
                        {currentUser.name?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{currentUser.name}</span>
                    </button>

                    {profileMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2">
                        <a
                          href="/orders"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          I miei Ordini
                        </a>
                        {currentUser.role === "ADMIN" && (
                          <a
                            href="/dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Dashboard
                          </a>
                        )}

                        <hr className="my-2" />
                        <button
                          onClick={onLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={onLoginClick}
                    className="bg-[#51946b] text-white px-4 py-2 rounded-full font-medium hover:bg-[#3d7a57] transition-colors"
                  >
                    Accedi
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Mobile Menu Button */}
              <button
                onClick={onMenuOpen}
                className="p-2 text-gray-700 hamburger-menu"
                aria-label="Menu"
              >
                <svg
                  className="h-6 w-6"
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
              </button>{" "}
              {/* Logo Mobile */}
              <div className="flex-1 flex justify-center">
                <Link
                  href="/"
                  className="flex items-center hover:opacity-80 transition-opacity"
                >
                  <Image
                    src="/bambu-logo.jpg"
                    alt="Cartolibreria Bambù"
                    width={32}
                    height={32}
                    priority
                    className="object-contain"
                  />
                  <div className="ml-2">
                    <h1 className="text-lg font-bold text-[#51946b]">Bambù</h1>
                  </div>
                </Link>
              </div>
              {/* Mobile Actions */}
              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-700">
                  <svg
                    className="h-5 w-5"
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
                <button
                  onClick={onCartSidebarOpen}
                  className="relative p-2 text-gray-700 cart-button"
                  aria-label="Carrello"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6h9M7 13v6a1 1 0 001 1h9a1 1 0 001-1v-6"
                    />
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#51946b] text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </button>
                {currentUser && (
                  <button className="p-1">
                    <div className="w-6 h-6 bg-[#51946b] text-white rounded-full flex items-center justify-center text-xs font-semibold">
                      {currentUser.name?.charAt(0).toUpperCase()}
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuVisible && (
        <div
          className={`fixed inset-0 z-50 bg-black/40 lg:hidden transition-opacity duration-300 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={onMenuClose}
        >
          <div
            className={`fixed top-0 left-0 w-3/4 max-w-xs h-full bg-white shadow-lg flex flex-col gap-6 p-6 overflow-auto z-50 transition-transform duration-300 ease-in-out ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="self-end mb-4"
              onClick={onMenuClose}
              aria-label="Chiudi menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Search Bar Mobile */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Cerca prodotti..."
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && onSearchSubmit()}
                  className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#51946b] focus:border-transparent"
                />
                <button
                  onClick={onSearchSubmit}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 hover:text-[#51946b] transition-colors"
                >
                  <svg
                    className="h-5 w-5"
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
            </div>

            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-bold">Categorie</h2>
              {categoriesLoading ? (
                <div className="text-gray-500">Caricamento...</div>
              ) : (
                parentCategories.map((cat) => (
                  <button
                    key={cat.id}
                    className="text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                    onClick={() => onCategoryClick(cat.name)}
                  >
                    {cat.name}
                  </button>
                ))
              )}
            </div>

            {currentUser && (
              <div className="flex flex-col gap-4 mt-6">
                <a
                  href="/orders"
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                >
                  I miei Ordini
                </a>
                {currentUser.role === "ADMIN" && (
                  <a
                    href="/dashboard"
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
                  >
                    Dashboard
                  </a>
                )}
                <button
                  onClick={onLogout}
                  className="text-left px-4 py-2 text-red-600 hover:bg-gray-100 rounded"
                >
                  Logout
                </button>
              </div>
            )}

            {!currentUser && (
              <button
                onClick={onLoginClick}
                className="bg-[#51946b] text-white px-4 py-2 rounded-full"
              >
                Accedi
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modern Cart Sidebar */}
      {cartSidebarVisible && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
              cartSidebarOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={onCartSidebarClose}
          />

          {/* Sidebar */}
          <aside
            className={`fixed top-0 right-0 h-full w-full sm:max-w-md lg:max-w-lg bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
              cartSidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {/* Loading Overlay */}
            {cartSidebarLoading && (
              <div className="absolute inset-0 bg-white/90 z-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-4 border-[#51946b] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-600">
                    Aggiornamento carrello...
                  </p>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="relative bg-gradient-to-r from-[#51946b] to-[#3d7a57] text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Il tuo carrello</h2>
                  <p className="text-green-100 text-sm mt-1">
                    {cartItems.length}{" "}
                    {cartItems.length === 1 ? "prodotto" : "prodotti"}
                  </p>
                </div>
                <button
                  onClick={onCartSidebarClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Free Shipping Progress Bar */}
              {cartItems.length > 0 &&
                (() => {
                  const shippingThreshold = 50;
                  const subtotal = cartItems.reduce(
                    (acc, item) =>
                      acc + Number(item.prezzo) * Number(item.quantity),
                    0
                  );
                  const remaining = Math.max(0, shippingThreshold - subtotal);
                  const progress = Math.min(
                    100,
                    (subtotal / shippingThreshold) * 100
                  );

                  return (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-green-100">
                          {remaining > 0
                            ? `Aggiungi €${remaining.toFixed(
                                2
                              )} per la spedizione gratuita!`
                            : "🎉 Spedizione gratuita inclusa!"}
                        </span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div
                          className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto">
              {cartItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Il carrello è vuoto
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Aggiungi qualcosa di speciale dalla nostra collezione
                  </p>
                  <button
                    onClick={onCartSidebarClose}
                    className="px-6 py-3 bg-[#51946b] text-white rounded-xl font-medium hover:bg-[#3d7a57] transition-colors active:scale-[0.98] touch-manipulation"
                  >
                    Continua lo shopping
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {cartItems.map((item, index) => (
                    <div
                      key={item.productId}
                      className={`group bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-lg transition-all duration-200 touch-manipulation ${
                        index === cartItems.length - 1 ? "" : "mb-3"
                      }`}
                      style={{ touchAction: "pan-y pinch-zoom" }}
                    >
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="relative flex-shrink-0">
                          <img
                            src={item.immagine || "/file.svg"}
                            alt={item.titolo}
                            className="w-20 h-20 object-cover rounded-xl border border-gray-200 cursor-pointer group-hover:scale-105 transition-transform duration-200"
                            onClick={() => onCartItemClick(item.productId)}
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3
                            className="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-[#51946b] transition-colors line-clamp-2"
                            onClick={() => onCartItemClick(item.productId)}
                          >
                            {item.titolo}
                          </h3>
                          <p className="text-lg font-bold text-[#51946b] mb-3">
                            €{Number(item.prezzo).toFixed(2)}
                          </p>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center bg-gray-50 rounded-xl p-1">
                              <button
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    onCartItemQuantityChange(
                                      item.productId,
                                      item.quantity - 1
                                    );
                                  } else {
                                    onCartItemRemove(item.productId);
                                  }
                                }}
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all active:scale-95"
                              >
                                <svg
                                  className="w-4 h-4 text-gray-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 12H4"
                                  />
                                </svg>
                              </button>
                              <span className="min-w-[3rem] text-center font-semibold text-gray-900 px-2">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  onCartItemQuantityChange(
                                    item.productId,
                                    item.quantity + 1
                                  )
                                }
                                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm transition-all active:scale-95"
                              >
                                <svg
                                  className="w-4 h-4 text-gray-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                  />
                                </svg>
                              </button>
                            </div>

                            {/* Remove Button */}
                            <button
                              onClick={() => onCartItemRemove(item.productId)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                              title="Rimuovi prodotto"
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
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>

                          {/* Item Total */}
                          <div className="mt-2 text-right">
                            <span className="text-sm text-gray-500">
                              Totale:{" "}
                            </span>
                            <span className="font-semibold text-gray-900">
                              €
                              {(
                                Number(item.prezzo) * Number(item.quantity)
                              ).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer with Summary and Actions */}
            {cartItems.length > 0 && (
              <div className="border-t border-gray-200 bg-gradient-to-b from-white to-gray-50">
                {/* Order Summary */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotale</span>
                    <span className="font-medium">€{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Spedizione</span>
                    <span className="font-medium">
                      {cartTotal >= 50 ? (
                        <span className="text-green-600">Gratuita</span>
                      ) : (
                        "€4.99"
                      )}
                    </span>
                  </div>
                  <div className="h-px bg-gray-200" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Totale</span>
                    <span className="text-[#51946b]">
                      €{(cartTotal + (cartTotal >= 50 ? 0 : 4.99)).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-4 space-y-3">
                  <button
                    onClick={onGoToCheckout}
                    className="w-full bg-[#51946b] text-white py-4 rounded-xl font-semibold hover:bg-[#3d7a57] transition-colors shadow-lg hover:shadow-xl active:scale-[0.98] touch-manipulation"
                  >
                    Procedi al checkout
                  </button>
                  <button
                    onClick={onGoToCart}
                    className="w-full border-2 border-[#51946b] text-[#51946b] py-3 rounded-xl font-semibold hover:bg-[#51946b] hover:text-white transition-colors active:scale-[0.98] touch-manipulation"
                  >
                    Visualizza carrello completo
                  </button>
                </div>

                {/* Trust Signals */}
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>Pagamento sicuro</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-blue-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Garanzia qualità</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </>
      )}
    </>
  );
}

export default HeaderView;
