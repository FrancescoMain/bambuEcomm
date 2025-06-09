"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import axios from "axios";
import ProductCard from "@/components/layout/ProductCard";
import { useCartActions } from "@/components/layout/CartProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Tipi TypeScript per i prodotti e il carrello
interface CartItem {
  productId: number;
  titolo: string;
  prezzo: number;
  immagine?: string;
  quantity: number;
  cartItemId?: number;
}

interface Product {
  id: number | string;
  titolo: string;
  prezzo: number;
  immagine?: string;
  categoria?: { name: string }[];
}

const CartPage = () => {
  const router = useRouter();
  // Recupera carrello da Redux o localStorage se non loggato
  const reduxCartItems = useSelector(
    (state: { cart: { items: CartItem[] } }) => state.cart.items
  );
  const [cartItems, setCartItems] = React.useState<CartItem[]>(reduxCartItems);
  const { handleAddToCart } = useCartActions();

  React.useEffect(() => {
    // Se non loggato, sincronizza con localStorage
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      const cached =
        typeof window !== "undefined" ? localStorage.getItem("cart") : null;
      if (cached) {
        try {
          const items: CartItem[] = JSON.parse(cached);
          if (Array.isArray(items)) setCartItems(items);
        } catch {}
      } else {
        setCartItems([]);
      }
    } else {
      setCartItems(reduxCartItems);
    }
  }, [reduxCartItems]);

  // Aggiorna localStorage se non loggato
  React.useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      if (cartItems) {
        localStorage.setItem("cart", JSON.stringify(cartItems));
      }
    }
  }, [cartItems]);

  const isCartEmpty = !cartItems || cartItems.length === 0;

  // Carosello prodotti correlati
  const [carouselProducts, setCarouselProducts] = React.useState<Product[]>([]);
  React.useEffect(() => {
    if (!cartItems || cartItems.length === 0) return;
    const first = cartItems[0];
    if (!first || !first.productId) return;
    // Recupera la categoria dal primo prodotto (assumendo che sia in redux o backend)
    axios.get(`${API_URL}/products/${first.productId}`).then((res) => {
      const prod = res.data;
      const lastCat = prod.categoria?.[prod.categoria.length - 1]?.name;
      if (!lastCat) return;
      axios
        .get(`${API_URL}/products`, {
          params: {
            category: lastCat,
            limit: 10,
            sortBy: "createdAt",
            sortOrder: "desc",
          },
        })
        .then((res2) => {
          const data: Product[] =
            res2.data.data || res2.data.products || res2.data;
          setCarouselProducts(
            data.filter((p: Product) => p.id !== first.productId)
          );
        });
    });
  }, [cartItems]);

  // Calcolo dinamico del totale carrello
  const subtotal = cartItems.reduce(
    (acc, item) => acc + Number(item.prezzo) * Number(item.quantity),
    0
  );

  return (
    <div className="gap-6 px-2 flex flex-col md:flex-row justify-center py-8 bg-[#f7faf8] md:min-h-screen">
      <div className="layout-content-container flex flex-col max-w-[920px] flex-1 w-full">
        <div className="flex flex-wrap justify-between gap-3 p-4 pb-2">
          <p className="text-[#111714] tracking-light text-[2rem] font-bold leading-tight min-w-72">
            Il tuo carrello
          </p>
        </div>
        <div className="px-0 md:px-4 py-3 @container">
          <div className="rounded-xl border border-[#dce5df] bg-white overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-white">
                  <th className="px-4 py-3 text-left text-[#111714] w-16 text-xs font-semibold uppercase tracking-wide">
                    Prodotto
                  </th>
                  <th className="px-4 py-3 text-left text-[#111714] w-48 text-xs font-semibold uppercase tracking-wide">
                    Nome
                  </th>
                  <th className="px-4 py-3 text-left text-[#111714] w-24 text-xs font-semibold uppercase tracking-wide">
                    Prezzo
                  </th>
                  <th className="px-4 py-3 text-left text-[#111714] w-24 text-xs font-semibold uppercase tracking-wide">
                    Quantità
                  </th>
                  <th className="px-4 py-3 text-left text-[#111714] w-24 text-xs font-semibold uppercase tracking-wide">
                    Totale
                  </th>
                </tr>
              </thead>
              <tbody>
                {cartItems && cartItems.length > 0 ? (
                  cartItems.map((item) => (
                    <tr
                      key={item.productId}
                      className="border-t border-t-[#dce5df] hover:bg-[#f3f7f4] transition"
                    >
                      <td className="h-[72px] px-4 py-2 w-16">
                        <div
                          className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg w-12 h-12 border border-[#e2e8f0]"
                          style={{
                            backgroundImage: `url('${
                              item.immagine || "/file.svg"
                            }')`,
                          }}
                        ></div>
                      </td>
                      <td className="h-[72px] px-4 py-2 w-48 text-[#111714] text-sm font-medium align-middle">
                        {item.titolo}
                      </td>
                      <td className="h-[72px] px-4 py-2 w-24 text-[#648771] text-sm font-normal align-middle">
                        €{" "}
                        {typeof item.prezzo === "number"
                          ? item.prezzo.toFixed(2)
                          : parseFloat(item.prezzo).toFixed(2)}
                      </td>
                      <td className="h-[72px] px-4 py-2 w-24 text-[#111714] text-sm font-normal align-middle">
                        {item.quantity}
                      </td>
                      <td className="h-[72px] px-4 py-2 w-24 text-[#648771] text-sm font-semibold align-middle">
                        € {(item.prezzo * item.quantity).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center py-8 text-[#b0b8b1] text-sm"
                    >
                      Il carrello è vuoto.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="layout-content-container flex flex-col w-full max-w-[360px] mt-8 md:mt-0 md:ml-6">
        <div className="p-4">
          <div className="flex flex-col gap-4 rounded-xl bg-white p-6 shadow-[0_0_8px_rgba(0,0,0,0.07)] border border-[#e2e8f0] overflow-x-auto">
            <div className="flex flex-col gap-1">
              <p className="text-[#111714] text-lg font-bold leading-tight">
                Riepilogo Ordine
              </p>
              <div className="flex flex-col gap-1 text-[#648771] text-sm font-normal">
                <div className="flex justify-between">
                  <span>Subtotale:</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Spedizione:</span>
                  <span>Gratis</span>
                </div>
                <div className="flex justify-between font-bold text-[#111714]">
                  <span>Totale:</span>
                  <span>€{subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex px-4 pb-2">
          <button
            className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-5 flex-1 bg-[#38e078] hover:bg-[#2ecc71] transition text-[#111714] text-base font-bold leading-normal tracking-[0.015em] shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => router.push("/checkout")}
            disabled={isCartEmpty}
          >
            <span className="truncate">Procedi al checkout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
