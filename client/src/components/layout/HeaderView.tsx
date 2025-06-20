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
                  href="/about"
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
                    className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#51946b] focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
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
                        <a
                          href="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          Profilo
                        </a>
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
                <h2 className="text-lg font-bold">Profilo</h2>
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

      {/* Cart Sidebar */}
      {cartSidebarVisible && (
        <>
          <div
            className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
              cartSidebarOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={onCartSidebarClose}
          />
          <aside
            className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-in-out ${
              cartSidebarOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            {cartSidebarLoading && (
              <div className="absolute inset-0 bg-white/70 z-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#51946b] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Il tuo carrello</h2>
              <button
                onClick={onCartSidebarClose}
                className="p-2 hover:bg-gray-100 rounded"
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

            <div className="flex-1 overflow-y-auto p-4">
              {cartItems.length === 0 ? (
                <div className="text-center text-gray-500">
                  Il carrello è vuoto
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-start gap-3 pb-3 border-b last:border-b-0"
                    >
                      <img
                        src={item.immagine || "/file.svg"}
                        alt={item.titolo}
                        className="w-16 h-16 object-cover rounded border cursor-pointer"
                        onClick={() => onCartItemClick(item.productId)}
                      />
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-medium text-sm cursor-pointer hover:text-[#51946b]"
                          onClick={() => onCartItemClick(item.productId)}
                        >
                          {item.titolo}
                        </h3>
                        <p className="text-sm text-[#51946b] mb-2">
                          € {Number(item.prezzo).toFixed(2)}
                        </p>
                        <div className="flex items-center gap-2">
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
                            className="px-2 py-1 bg-gray-200 rounded text-sm"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium min-w-[24px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              onCartItemQuantityChange(
                                item.productId,
                                item.quantity + 1
                              )
                            }
                            className="px-2 py-1 bg-gray-200 rounded text-sm"
                          >
                            +
                          </button>
                          <button
                            onClick={() => onCartItemRemove(item.productId)}
                            className="ml-2 text-red-500 text-xs hover:text-red-700"
                          >
                            Rimuovi
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-bold">Totale</span>
                  <span className="font-bold text-lg text-[#51946b]">
                    € {cartTotal.toFixed(2)}
                  </span>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={onGoToCart}
                    className="w-full py-2 border border-[#51946b] text-[#51946b] rounded font-medium hover:bg-[#51946b] hover:text-white transition-colors"
                  >
                    Vai al carrello
                  </button>
                  <button
                    onClick={onGoToCheckout}
                    className="w-full py-2 bg-[#51946b] text-white rounded font-medium hover:bg-[#3d7a57] transition-colors"
                  >
                    Checkout
                  </button>
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
