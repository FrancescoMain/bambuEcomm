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

  // Helper: get token
  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  // Helper: find cartItemId by productId
  const getCartItemId = (productId: number) => {
    const item = cartItems.find((i) => i.productId === productId);
    return item?.cartItemId;
  }; // --- CART PERSISTENCE LOGIC ---
  useEffect(() => {
    const loadCart = async () => {
      if (currentUser) {
        try {
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
          }
        } catch (e) {
          dispatch(clearCart());
        }
      } else {
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
            }
          } catch (e) {
            // fallback: carrello vuoto
          }
        }
      }
      setCartLoaded(true);
    };
    loadCart();
  }, [currentUser, dispatch]);

  // Salva il carrello in localStorage se l'utente NON è loggato
  useEffect(() => {
    if (!currentUser && typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(cartItems));
    }
  }, [cartItems, currentUser]);

  // --- CART ACTIONS WRAPPED FOR BACKEND SYNC ---
  const handleAddToCart = async (item: CartItem) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromCart = async (productId: number) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId: number, quantity: number) => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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
      value={{ handleAddToCart, handleRemoveFromCart, handleUpdateQuantity }}
    >
      {children}
    </CartActionsContext.Provider>
  );
};
