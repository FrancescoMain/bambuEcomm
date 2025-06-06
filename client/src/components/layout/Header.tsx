"use client";
import React, { useState, useEffect, createContext, useContext } from "react";
import { useDispatch, useSelector } from "react-redux"; // Importa da react-redux
import { RootState } from "@/redux/store"; // Importa RootState
import { getCurrentUserRequest, logoutRequest } from "@/redux/authSlice"; // Importa anche logoutRequest
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
} from "@/redux/cartSlice";
import { useLoading } from "./LoadingContext";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import HeaderView from "./HeaderView";
import {
  selectParentCategories,
  selectCategoriesLoading,
} from "@/redux/categorySelectors";
import axios from "axios";
import {
  addCartItemApi,
  removeCartItemApi,
  updateCartItemQuantityApi,
} from "@/api/cartApi";
import { useCartActions } from "@/components/layout/CartProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface HeaderProps {
  showCartSidebar?: boolean;
  setShowCartSidebar?: (open: boolean) => void;
}

// Define CartItem type
// Extend CartItem to include cartItemId (optional, only for logged-in users)
interface CartItem {
  productId: number;
  titolo: string;
  prezzo: number;
  quantity: number;
  immagine: string;
  cartItemId?: number; // <-- NEW
}

const Header: React.FC<HeaderProps> = ({
  showCartSidebar,
  setShowCartSidebar,
}) => {
  const dispatch = useDispatch(); // Usa useDispatch
  const { user: currentUser, isLoading } = useSelector(
    (state: RootState) => state.auth
  ); // Seleziona dallo store Redux
  const cartItems = useSelector(
    (state: RootState) => state.cart.items as CartItem[]
  );
  const cartCount = useSelector((state: RootState) => state.cart.items.length);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [cartSidebarOpenInternal, setCartSidebarOpenInternal] = useState(false);
  const [cartSidebarVisible, setCartSidebarVisible] = useState(false);
  const [cartSidebarLoading, setCartSidebarLoading] = useState(false);
  const cartSidebarOpen =
    typeof showCartSidebar === "boolean"
      ? showCartSidebar
      : cartSidebarOpenInternal;
  const setCartSidebarOpen =
    setShowCartSidebar ||
    ((open: boolean) => {
      if (open) {
        openCartSidebar();
      } else {
        closeCartSidebar();
      }
    });
  const { setLoading } = useLoading();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const parentCategories = useSelector((state: RootState) =>
    selectParentCategories(state)
  );
  const categoriesLoading = useSelector((state: RootState) =>
    selectCategoriesLoading(state)
  );

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
    (sum: number, item: CartItem) => sum + item.prezzo * item.quantity,
    0
  );

  useEffect(() => {
    const openSidebar = () => setCartSidebarOpen(true);
    window.addEventListener("open-cart-sidebar", openSidebar);
    return () => window.removeEventListener("open-cart-sidebar", openSidebar);
  }, []);

  // Open menu: set both true
  const openMenu = () => {
    setMenuVisible(true);
    setTimeout(() => setMenuOpen(true), 10); // allow render before transition
  };

  // Close menu: setOpen false, then after transition setVisible false
  const closeMenu = () => {
    setMenuOpen(false);
    setTimeout(() => setMenuVisible(false), 300); // match duration-300
  };

  // Open cart sidebar
  const openCartSidebar = () => {
    setCartSidebarVisible(true);
    setTimeout(() => setCartSidebarOpenInternal(true), 10);
  };

  // Close cart sidebar
  const closeCartSidebar = () => {
    setCartSidebarOpenInternal(false);
    setTimeout(() => setCartSidebarVisible(false), 300);
  };

  // Map parentCategories to the expected shape for HeaderView
  const parentCategoriesForView = parentCategories.map((cat) => ({
    id: String(cat.id),
    name: cat.name,
  }));

  // Helper: get token
  const getToken = () => localStorage.getItem("token") || "";

  // Helper: find cartItemId by productId
  const getCartItemId = (productId: number) => {
    const item = cartItems.find((i) => i.productId === productId);
    return item?.cartItemId;
  };

  // --- CART PERSISTENCE LOGIC ---
  useEffect(() => {
    const loadCart = async () => {
      if (currentUser) {
        // Utente loggato: carica carrello dal backend
        try {
          const res = await axios.get(`${API_URL}/cart`, {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          });
          // Svuota il carrello Redux prima di importare quello dal backend
          dispatch(clearCart());
          if (res.data && Array.isArray(res.data.items)) {
            res.data.items.forEach((item: any) => {
              dispatch(
                addToCart({
                  productId: item.productId,
                  titolo: item.product.titolo,
                  prezzo: item.product.prezzo,
                  immagine: item.product.immagine,
                  quantity: item.quantity,
                  cartItemId: item.id,
                })
              );
            });
          }
        } catch (e) {
          // fallback: svuota comunque il carrello Redux
          dispatch(clearCart());
        }
      } else {
        // Utente non loggato: carica carrello da localStorage
        // Svuota il carrello Redux prima di importare quello da localStorage
        dispatch(clearCart());
        const cached = localStorage.getItem("cart");
        if (cached) {
          try {
            const items = JSON.parse(cached);
            if (Array.isArray(items)) {
              items.forEach((item: any) => {
                dispatch(addToCart(item));
              });
            }
          } catch (e) {
            // fallback: carrello vuoto
          }
        }
      }
    };
    loadCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Salva il carrello in localStorage se l'utente NON è loggato
  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, currentUser]);

  // --- CART ACTIONS WRAPPED FOR BACKEND SYNC ---
  const { handleAddToCart, handleRemoveFromCart, handleUpdateQuantity } =
    useCartActions();

  // Wrap cart actions to set cartSidebarLoading
  const handleCartAdd = async (item: CartItem) => {
    setCartSidebarLoading(true);
    await handleAddToCart(item);
    setCartSidebarLoading(false);
  };
  const handleCartRemove = async (productId: number) => {
    setCartSidebarLoading(true);
    await handleRemoveFromCart(productId);
    setCartSidebarLoading(false);
  };
  const handleCartUpdate = async (productId: number, quantity: number) => {
    setCartSidebarLoading(true);
    await handleUpdateQuantity(productId, quantity);
    setCartSidebarLoading(false);
  };

  return (
    <HeaderView
      isLoading={isLoading}
      currentUser={currentUser}
      cartCount={cartCount}
      menuOpen={menuOpen}
      menuVisible={menuVisible}
      profileMenuOpen={profileMenuOpen}
      cartSidebarOpen={cartSidebarOpen}
      cartSidebarVisible={cartSidebarVisible}
      parentCategories={parentCategoriesForView}
      categoriesLoading={categoriesLoading}
      cartItems={cartItems}
      cartTotal={cartTotal}
      cartSidebarLoading={cartSidebarLoading}
      onMenuOpen={openMenu}
      onMenuClose={closeMenu}
      onProfileMenuToggle={() => setProfileMenuOpen((v) => !v)}
      onCartSidebarOpen={openCartSidebar}
      onCartSidebarClose={closeCartSidebar}
      onCategoryClick={(catName) => {
        setLoading(true);
        router.push(`/search?category=${encodeURIComponent(catName)}`);
        closeMenu();
      }}
      onLoginClick={() => {
        setLoading(true);
        router.push("/login");
      }}
      onLogout={handleLogout}
      onCartItemClick={(productId) => {
        setLoading(true);
        router.push(`/product/${productId}`);
        setCartSidebarOpen(false);
      }}
      onCartItemRemove={handleCartRemove}
      onCartItemQuantityChange={handleCartUpdate}
      onGoToCart={() => {
        setLoading(true);
        router.push("/cart");
        setCartSidebarOpen(false);
      }}
      onGoToCheckout={() => {
        setLoading(true);
        router.push("/checkout");
        setCartSidebarOpen(false);
      }}
      pathname={pathname}
      // If you want to pass handleAddToCart to HeaderView, add it here
      // handleAddToCart={handleAddToCart}
    />
  );
};

export default Header;
