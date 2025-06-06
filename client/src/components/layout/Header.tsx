"use client";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"; // Importa da react-redux
import { RootState } from "@/redux/store"; // Importa RootState
import { getCurrentUserRequest, logoutRequest } from "@/redux/authSlice"; // Importa anche logoutRequest
import { removeFromCart, updateQuantity } from "@/redux/cartSlice";
import Link from "next/link";
import {
  selectParentCategories,
  selectCategoriesLoading,
} from "@/redux/categorySelectors";
import { useLoading } from "./LoadingContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import HeaderStatic from "./HeaderStatic";

interface HeaderProps {
  showCartSidebar?: boolean;
  setShowCartSidebar?: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  showCartSidebar,
  setShowCartSidebar,
}) => {
  const dispatch = useDispatch(); // Usa useDispatch
  const { user: currentUser, isLoading } = useSelector(
    (state: RootState) => state.auth
  ); // Seleziona dallo store Redux
  const cartItems = useSelector((state: any) => state.cart.items);
  const cartCount = useSelector((state: any) => state.cart.items.length);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [cartSidebarOpenInternal, setCartSidebarOpenInternal] = useState(false);
  const cartSidebarOpen =
    typeof showCartSidebar === "boolean"
      ? showCartSidebar
      : cartSidebarOpenInternal;
  const setCartSidebarOpen = setShowCartSidebar || setCartSidebarOpenInternal;
  const { setLoading } = useLoading();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parentCategories = useSelector(selectParentCategories);
  const categoriesLoading = useSelector(selectCategoriesLoading);

  // Chiudi loader dopo ogni navigazione
  useEffect(() => {
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams.toString()]);

  useEffect(() => {
    dispatch(getCurrentUserRequest()); // Dispatch dell'azione per ottenere l'utente
  }, [dispatch]);

  const handleClickOutside = (event: MouseEvent | TouchEvent) => {
    const target = event.target as HTMLElement;
    console.log("Clicked element:", target); // Log per debug

    if (
      !target.closest(".category-menu") && // Per chiudere il menu delle categorie
      !target.closest(".hamburger-menu") && // Per chiudere il menu hamburger
      !target.closest(".profile-menu") && // Per chiudere il menu profilo
      !target.closest(".cart-button") // Per chiudere il menu carrello
    ) {
      setMenuOpen(false);
      setProfileMenuOpen(false);
    }
  };

  useEffect(() => {
    if (!menuOpen) {
      document.addEventListener("click", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("click", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }
    // Se il menu mobile è aperto, non aggiungere listener globali
    return () => {};
  }, [menuOpen]);

  const handleLogout = () => {
    dispatch(logoutRequest());
    // Potresti voler aggiungere anche una notifica o un redirect qui
  };

  // Calcolo totale carrello
  const cartTotal = cartItems.reduce(
    (sum: number, item: any) => sum + item.prezzo * item.quantity,
    0
  );

  useEffect(() => {
    const openSidebar = () => setCartSidebarOpen(true);
    window.addEventListener("open-cart-sidebar", openSidebar);
    return () => window.removeEventListener("open-cart-sidebar", openSidebar);
  }, []);

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#e8f2ec] px-4 md:px-10 py-3">
      <HeaderStatic />
      <div className="flex flex-1 justify-end items-center gap-4  md:gap-8">
        {isLoading ? (
          <span>Loading...</span>
        ) : currentUser ? (
          <button className="text-sm font-bold hidden md:inline">
            {currentUser.name}
          </button>
        ) : (
          <a href="/login" className="text-sm font-bold">
            Login
          </a>
        )}
        <button
          className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-visible rounded-lg h-10 bg-[#e8f2ec] text-[#0e1a13] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 cart-button relative"
          aria-label="Apri carrello"
          onClick={() => setCartSidebarOpen(true)}
        >
          <div
            className="text-[#0e1a13]"
            data-icon="ShoppingBag"
            data-size="20px"
            data-weight="regular"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20px"
              height="20px"
              fill="currentColor"
              viewBox="0 0 256 256"
            >
              <path d="M216,40H40A16,16,0,0,0,24,56V200a16,16,0,0,0,16,16H216a16,16,0,0,0,16-16V56A16,16,0,0,0,216,40Zm0,160H40V56H216V200ZM176,88a48,48,0,0,1-96,0,8,8,0,0,1,16,0,32,32,0,0,0,64,0,8,8,0,0,1,16,0Z"></path>
            </svg>
          </div>
          {cartCount > 0 && (
            <span className="pointer-events-none select-none absolute -top-1.5 -right-1.5 bg-[#39e079] text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[22px] text-center border-2 border-white shadow z-10">
              {cartCount}
            </span>
          )}
        </button>
        <button
          className="md:hidden ml-2 p-2 rounded-lg bg-[#e8f2ec] text-[#0e1a13] hamburger-menu"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Apri menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 5.25h16.5m-16.5 6h16.5m-16.5 6h16.5"
            />
          </svg>
        </button>
        {currentUser && (
          <div className="relative profile-menu">
            <button
              className="hidden md:flex bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCyYqkvxBHMRZhQXlELKzPCtdW-vqwBt8jKo2Dt_lV4ZyRk4UUvREYy-74B4Y_9OW6EjNbruNBM0GrrrE9XCC86Kwa8zrQGuTKvKkFl6XDNgeu7qF0oZFJr-R8PyxEtdlkdcHCcxWp3MvDY-IRUvvNmVXjnqe1jbeaEY7UgbNWvmprGwfCp8SDyjfow3Qn4KRqTeS_e8_LO17l3Idp-ZCtYmEl30LF_YSEFL1XFYeXyfYR6DwETvFLdpGE6J-drwJYxm75_2L0IgIyZ')",
              }}
              onClick={() => setProfileMenuOpen((v) => !v)}
              aria-label="Apri menu profilo"
            ></button>
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg py-2">
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
                >
                  I miei Ordini
                </a>
                {currentUser.role === "ADMIN" && (
                  <a
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
                  >
                    Dashboard
                  </a>
                )}
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
                >
                  Informazioni
                </a>
                <a
                  href="#logout"
                  className="block px-4 py-2 text-sm text-red-500 hover:bg-[#e8f2ec]"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  Logout
                </a>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Mobile menu overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 md:hidden pointer-events-all touch-action-none"
          onClick={() => setMenuOpen(false)}
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <div
            className="fixed top-0 left-0 w-3/4 max-w-xs h-full bg-white shadow-lg flex flex-col gap-6 p-6 overflow-auto z-50 touch-action-none pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            <button
              className="self-end mb-4"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
              }}
              aria-label="Chiudi menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex flex-col gap-4">
              <h2 className="text-[#0e1a13] text-lg font-bold">Categorie</h2>
              {categoriesLoading ? (
                <div className="px-4 py-2 text-sm text-gray-500">
                  Caricamento...
                </div>
              ) : parentCategories.length === 0 ? (
                <div className="px-4 py-2 text-sm text-gray-500">
                  Nessuna categoria
                </div>
              ) : (
                parentCategories.map((cat) => (
                  <button
                    key={cat.id}
                    className="block text-left w-full px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec] truncate"
                    title={cat.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      if (
                        pathname !== "/search" ||
                        !window.location.search.includes(
                          `category=${encodeURIComponent(cat.name)}`
                        )
                      ) {
                        setLoading(true);
                        router.push(
                          `/search?category=${encodeURIComponent(cat.name)}`
                        );
                      }
                    }}
                  >
                    {cat.name}
                  </button>
                ))
              )}
            </div>
            {currentUser && (
              <div className="flex flex-col gap-4 mt-6">
                <h2 className="text-[#0e1a13] text-lg font-bold">Profilo</h2>
                <a
                  href="#informazioni"
                  className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
                  onClick={(e) => e.stopPropagation()}
                >
                  Informazioni
                </a>
                {currentUser.role === "ADMIN" && (
                  <a
                    href="/dashboard"
                    className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Dashboard
                  </a>
                )}
                <a
                  href="#ordini"
                  className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec]"
                  onClick={(e) => e.stopPropagation()}
                >
                  Ordini
                </a>
                <a
                  href="#logout"
                  className="block px-4 py-2 text-sm text-red-500 hover:bg-[#e8f2ec]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLogout();
                  }}
                >
                  Logout
                </a>
              </div>
            )}
            <a
              href="/search"
              className="block px-4 py-2 text-sm text-[#0e1a13] hover:bg-[#e8f2ec] mt-6"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setMenuOpen(false);
                if (pathname !== "/search") {
                  setLoading(true);
                  router.push("/search");
                }
              }}
            >
              Esplora
            </a>
          </div>
        </div>
      )}
      {/* Cart Sidebar Overlay */}
      {cartSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 pointer-events-auto"
            onClick={() => setCartSidebarOpen(false)}
          ></div>
          <aside
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col"
            style={{
              transition: "transform 0.3s",
              transform: cartSidebarOpen ? "translateX(0)" : "translateX(100%)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-[#e8f2ec]">
              <h2 className="text-lg font-bold text-[#0e1a13]">
                Il tuo carrello
              </h2>
              <button
                className="p-2 rounded-full hover:bg-[#e8f2ec]"
                onClick={() => setCartSidebarOpen(false)}
                aria-label="Chiudi carrello"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {cartItems.length === 0 ? (
                <div className="text-center text-[#51946b]">
                  Il carrello è vuoto.
                </div>
              ) : (
                cartItems.map((item: any) => (
                  <div
                    key={item.productId}
                    className="flex items-start gap-3 border-b pb-3 last:border-b-0"
                  >
                    <a
                      href={`/product/${item.productId}`}
                      className="w-16 h-16 flex-shrink-0 bg-center bg-cover rounded-lg border border-[#e8f2ec] mt-1 block"
                      style={{ backgroundImage: `url('${item.immagine}')` }}
                      onClick={(e) => {
                        e.preventDefault();
                        setLoading(true);
                        router.push(`/product/${item.productId}`);
                        setCartSidebarOpen(false);
                      }}
                      aria-label={item.titolo}
                    ></a>
                    <div className="flex-1 flex flex-col justify-start min-w-0">
                      <a
                        href={`/product/${item.productId}`}
                        className="font-bold text-[#0e1a13] text-sm truncate hover:underline"
                        onClick={(e) => {
                          e.preventDefault();
                          setLoading(true);
                          router.push(`/product/${item.productId}`);
                          setCartSidebarOpen(false);
                        }}
                        aria-label={item.titolo}
                      >
                        {item.titolo}
                      </a>
                      <div className="text-xs text-[#51946b] mb-1">
                        € {item.prezzo.toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          className="px-2 py-1 bg-[#e8f2ec] rounded text-[#0e1a13] text-sm font-bold"
                          onClick={() => {
                            if (item.quantity > 1) {
                              dispatch(
                                updateQuantity({
                                  productId: item.productId,
                                  quantity: item.quantity - 1,
                                })
                              );
                            } else {
                              dispatch(removeFromCart(item.productId));
                            }
                          }}
                          aria-label="Diminuisci quantità"
                        >
                          -
                        </button>
                        <span className="text-[#0e1a13] text-sm font-bold min-w-[24px] text-center">
                          {item.quantity}
                        </span>
                        <button
                          className="px-2 py-1 bg-[#e8f2ec] rounded text-[#0e1a13] text-sm font-bold"
                          onClick={() =>
                            dispatch(
                              updateQuantity({
                                productId: item.productId,
                                quantity: item.quantity + 1,
                              })
                            )
                          }
                          aria-label="Aumenta quantità"
                        >
                          +
                        </button>
                        <button
                          className="ml-2 text-red-500 hover:text-red-700 text-xs"
                          onClick={() =>
                            dispatch(removeFromCart(item.productId))
                          }
                          aria-label="Rimuovi dal carrello"
                        >
                          Rimuovi
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-4 border-t border-[#e8f2ec] bg-[#f8faf9]">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-[#0e1a13]">Totale</span>
                <span className="font-bold text-[#51946b] text-lg">
                  € {cartTotal.toFixed(2)}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  className="w-full text-center py-2 rounded bg-[#e8f2ec] text-[#0e1a13] font-bold hover:bg-[#d1e7db] transition"
                  onClick={() => {
                    setLoading(true);
                    router.push("/cart");
                    setCartSidebarOpen(false);
                  }}
                >
                  Vai al carrello
                </button>
                <button
                  className="w-full text-center py-2 rounded bg-[#39e079] text-white font-bold hover:bg-[#2fc96a] transition"
                  onClick={() => {
                    setLoading(true);
                    router.push("/checkout");
                    setCartSidebarOpen(false);
                  }}
                >
                  Vai al checkout
                </button>
              </div>
            </div>
          </aside>
        </>
      )}
    </header>
  );
};

export default Header;
