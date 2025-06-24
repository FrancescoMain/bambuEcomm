"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  setCart,
} from "@/redux/cartSlice";
import apiService from "@/api/apiService";
import {
  addCartItemApi,
  removeCartItemApi,
  updateCartItemQuantityApi,
} from "@/api/cartApi";
import { useLoading } from "@/components/layout/LoadingContext";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://bambu-ecomm-in2g.vercel.app/api";

// Tipi locali per il carrello
interface CartItem {
  productId: number;
  titolo: string;
  prezzo: number;
  immagine?: string;
  quantity: number;
  cartItemId?: number;
}

// Add BackendCartItem type for API responses
interface BackendCartItem {
  id: number;
  productId: number;
  product: {
    titolo: string;
    prezzo: number;
    immagine?: string;
  };
  quantity: number;
}

export const CartActionsContext = createContext<
  | {
      handleAddToCart: (item: CartItem) => Promise<void>;
      handleRemoveFromCart: (productId: number) => Promise<void>;
      handleUpdateQuantity: (
        productId: number,
        quantity: number
      ) => Promise<void>;
      handleClearCart: () => Promise<void>;
    }
  | undefined
>(undefined);

export function useCartActions() {
  const context = useContext(CartActionsContext);
  if (!context)
    throw new Error(
      "useCartActions must be used within CartActionsContext.Provider"
    );
  return context;
}

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useDispatch();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const cartItems = useSelector(
    (state: RootState) => state.cart.items as CartItem[]
  );
  const { setLoading } = useLoading();
  const [cartLoaded, setCartLoaded] = useState(false);
  const [lastUserState, setLastUserState] = useState<string | null>(null);

  // Helper: get token
  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  // Helper: find cartItemId by productId
  const getCartItemId = (productId: number) => {
    const item = cartItems.find((i) => i.productId === productId);
    return item?.cartItemId;
  }; // --- CART PERSISTENCE LOGIC ---
  useEffect(() => {
    const currentUserState = currentUser ? currentUser.id : "guest";

    // Evita di ricaricare il carrello se lo stato dell'utente non è cambiato
    if (lastUserState === currentUserState) {
      console.log("🔄 CartProvider: User state unchanged, skipping cart load");
      return;
    }

    console.log(
      `🔄 CartProvider: User state changed from ${lastUserState} to ${currentUserState}`
    );
    setLastUserState(currentUserState);

    const loadCart = async () => {
      setLoading(true);
      try {
        if (currentUser) {
          try {
            console.log("🛒 Loading cart for logged user...");
            const response = await apiService.get<any>("/cart");
            dispatch(clearCart());
            if (response && Array.isArray(response.items)) {
              const newCart: CartItem[] = response.items.map(
                (item: BackendCartItem) => ({
                  productId: item.productId,
                  titolo: item.product.titolo,
                  prezzo: item.product.prezzo,
                  immagine: item.product.immagine,
                  quantity: item.quantity,
                  cartItemId: item.id,
                })
              );
              dispatch(setCart(newCart));
              console.log(
                "✅ Cart loaded successfully:",
                newCart.length,
                "items"
              );
            } else {
              console.log("📭 Empty cart from backend");
            }
          } catch (e) {
            console.error("❌ Error loading cart from backend:", e);
            dispatch(clearCart());
            // Fallback: tenta di caricare da localStorage se c'è un errore API
            const cached =
              typeof window !== "undefined"
                ? localStorage.getItem("cart")
                : null;
            if (cached) {
              try {
                const items = JSON.parse(cached);
                if (Array.isArray(items)) {
                  console.log("🔄 Fallback: Loading cart from localStorage");
                  items.forEach((item: CartItem) => {
                    dispatch(addToCart(item));
                  });
                }
              } catch (localError) {
                console.error(
                  "❌ Error loading cart from localStorage:",
                  localError
                );
              }
            }
          }
        } else {
          console.log("👤 Loading cart for guest user from localStorage...");
          dispatch(clearCart());
          const cached =
            typeof window !== "undefined" ? localStorage.getItem("cart") : null;
          if (cached) {
            try {
              const items = JSON.parse(cached);
              if (Array.isArray(items)) {
                items.forEach((item: CartItem) => {
                  dispatch(addToCart(item));
                });
                console.log("✅ Guest cart loaded:", items.length, "items");
              }
            } catch (e) {
              console.error("❌ Error loading guest cart:", e);
            }
          } else {
            console.log("📭 No guest cart found");
          }
        }
      } finally {
        setCartLoaded(true);
        setLoading(false);
      }
    };

    // Aspetta che currentUser sia definitivamente impostato prima di caricare
    const timer = setTimeout(() => {
      loadCart();
    }, 100);

    return () => clearTimeout(timer);
  }, [currentUser]); // Rimuove dispatch dalle dipendenze

  // Salva il carrello in localStorage se l'utente NON è loggato
  useEffect(() => {
    if (!currentUser && typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems, currentUser]);
  // --- CART ACTIONS WRAPPED FOR BACKEND SYNC ---
  const handleAddToCart = async (item: CartItem) => {
    // Non mostrare loader per operazioni rapide del carrello
    try {
      if (currentUser) {
        try {
          await addCartItemApi(item.productId, item.quantity);
          const response = await apiService.get<any>("/cart");
          if (response && Array.isArray(response.items)) {
            const newCart: CartItem[] = response.items.map(
              (item: BackendCartItem) => ({
                productId: item.productId,
                titolo: item.product.titolo,
                prezzo: item.product.prezzo,
                immagine: item.product.immagine,
                quantity: item.quantity,
                cartItemId: item.id,
              })
            );
            dispatch(setCart(newCart));
          }
        } catch (e) {
          dispatch(addToCart(item));
        }
      } else {
        dispatch(addToCart(item));
      }
    } catch (error) {
      console.error("❌ Error in handleAddToCart:", error);
    }
  };

  const handleRemoveFromCart = async (productId: number) => {
    try {
      if (currentUser) {
        const cartItemId = getCartItemId(productId);
        if (cartItemId) {
          try {
            await removeCartItemApi(cartItemId);
            const response = await apiService.get<any>("/cart");
            if (response && Array.isArray(response.items)) {
              const newCart: CartItem[] = response.items.map(
                (item: BackendCartItem) => ({
                  productId: item.productId,
                  titolo: item.product.titolo,
                  prezzo: item.product.prezzo,
                  immagine: item.product.immagine,
                  quantity: item.quantity,
                  cartItemId: item.id,
                })
              );
              dispatch(setCart(newCart));
            }
          } catch (e) {
            dispatch(removeFromCart(productId));
          }
        }
      } else {
        dispatch(removeFromCart(productId));
      }
    } catch (error) {
      console.error("❌ Error in handleRemoveFromCart:", error);
    }
  };

  const handleUpdateQuantity = async (productId: number, quantity: number) => {
    try {
      if (currentUser) {
        const cartItemId = getCartItemId(productId);
        if (cartItemId) {
          try {
            await updateCartItemQuantityApi(cartItemId, quantity);
            const response = await apiService.get<any>("/cart");
            if (response && Array.isArray(response.items)) {
              const newCart: CartItem[] = response.items.map(
                (item: BackendCartItem) => ({
                  productId: item.productId,
                  titolo: item.product.titolo,
                  prezzo: item.product.prezzo,
                  immagine: item.product.immagine,
                  quantity: item.quantity,
                  cartItemId: item.id,
                })
              );
              dispatch(setCart(newCart));
            }
          } catch (e) {
            dispatch(updateQuantity({ productId, quantity }));
          }
        }
      } else {
        dispatch(updateQuantity({ productId, quantity }));
      }
    } catch (error) {
      console.error("❌ Error in handleUpdateQuantity:", error);
    }
  };

  // --- CLEAR CART (USED AFTER SUCCESSFUL PAYMENT) ---
  const handleClearCart = async () => {
    console.log(
      "🧹 CartProvider: Clearing cart for both backend and localStorage"
    );
    try {
      if (currentUser) {
        try {
          // Clear backend cart - this will be done by the webhook
          console.log(
            "🧹 CartProvider: Backend cart will be cleared by webhook"
          );
        } catch (e) {
          console.error("❌ CartProvider: Error clearing backend cart:", e);
        }
      }
      // Always clear Redux state and localStorage
      dispatch(clearCart());
      if (typeof window !== "undefined") {
        localStorage.removeItem("cart");
        console.log("🧹 CartProvider: localStorage cart cleared");
      }
    } catch (error) {
      console.error("❌ CartProvider: Error clearing cart:", error);
    }
  };

  if (!cartLoaded) {
    return (
      <div className="w-full flex justify-center items-center py-12 text-[#51946b]">
        Caricamento carrello...
      </div>
    );
  }
  return (
    <CartActionsContext.Provider
      value={{
        handleAddToCart,
        handleRemoveFromCart,
        handleUpdateQuantity,
        handleClearCart,
      }}
    >
      {children}
    </CartActionsContext.Provider>
  );
};
