"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/lib/api/client";
import type { CartQuote, QuoteLine, SelectedVariants, ShippingMethod } from "@/lib/types";
import { useAuth } from "./auth";

export interface CartLine {
  key: string;
  productId: number;
  quantity: number;
  selectedVariants?: SelectedVariants | null;
  personalizzazione?: string | null;
  // Dati di visualizzazione (aggiornati dal ricalcolo del server)
  titolo: string;
  immagine: string | null;
  prezzo: number;
  prezzoListino?: number;
  variantLabel?: string;
  cartItemId?: number | null;
}

export interface AddToCartInput {
  productId: number;
  quantity: number;
  titolo: string;
  immagine: string | null;
  prezzo: number;
  prezzoListino?: number;
  selectedVariants?: SelectedVariants | null;
  personalizzazione?: string | null;
  variantLabel?: string;
}

/** Stessa firma usata dal server (variantKeyOf in cartPricing.ts) */
export const variantKeyOf = (selected?: SelectedVariants | null, personalizzazione?: string | null) => {
  const variants = selected
    ? Object.entries(selected)
        .map(([typeId, v]) => `${parseInt(typeId, 10)}:${v?.id}`)
        .sort()
        .join("|")
    : "";
  const text = (personalizzazione || "").replace(/\s+/g, " ").trim().slice(0, 120);
  return text ? `${variants}#${text.toLowerCase()}` : variants;
};

export const lineKey = (productId: number, selected?: SelectedVariants | null, personalizzazione?: string | null) =>
  `${productId}::${variantKeyOf(selected, personalizzazione)}`;

const MAX_QTY = 99;

const fromQuoteLine = (l: QuoteLine): CartLine => ({
  key: l.key,
  productId: l.productId,
  quantity: l.quantity,
  selectedVariants: l.selectedVariants,
  personalizzazione: l.personalizzazione,
  titolo: l.titolo,
  immagine: l.immagine,
  prezzo: l.prezzoUnitario,
  prezzoListino: l.prezzoListino,
  variantLabel: l.variantLabel,
  cartItemId: l.cartItemId ?? null,
});

interface CartState {
  lines: CartLine[];
  quote: CartQuote | null;
  quoting: boolean;
  syncing: boolean;
  couponCode: string | null;
  shippingMethod: ShippingMethod;
  cap: string | null;
  /** id dell'ultima riga aggiunta: il drawer la evidenzia */
  lastAddedKey: string | null;
  add: (input: AddToCartInput) => Promise<void>;
  setQuantity: (key: string, quantity: number) => Promise<void>;
  remove: (key: string) => Promise<void>;
  clear: () => void;
  refreshQuote: () => Promise<CartQuote | null>;
  setCoupon: (code: string | null) => Promise<CartQuote | null>;
  setShipping: (method: ShippingMethod, cap?: string | null) => Promise<CartQuote | null>;
  /** Al login: unisce il carrello dell'ospite a quello salvato sul server */
  syncWithServer: () => Promise<void>;
}

const isLogged = () => !!useAuth.getState().user;

type ServerCart = CartQuote & { items: (QuoteLine & { cartItemId: number | null })[] };

let quoteTimer: ReturnType<typeof setTimeout> | null = null;
let quoteSeq = 0;

export const useCart = create<CartState>()(
  persist(
    (set, get) => {
      const applyServerCart = (cart: ServerCart) => {
        set({ lines: cart.items.filter((i) => !i.omaggio).map(fromQuoteLine) });
      };

      const scheduleQuote = () => {
        if (quoteTimer) clearTimeout(quoteTimer);
        quoteTimer = setTimeout(() => void get().refreshQuote(), 250);
      };

      return {
        lines: [],
        quote: null,
        quoting: false,
        syncing: false,
        couponCode: null,
        shippingMethod: "spedizione",
        cap: null,
        lastAddedKey: null,

        add: async (input) => {
          const key = lineKey(input.productId, input.selectedVariants, input.personalizzazione);
          set({ lastAddedKey: key });
          if (isLogged()) {
            const cart = await api<ServerCart>("/cart/items", {
              method: "POST",
              body: {
                productId: input.productId,
                quantity: input.quantity,
                selectedVariants: input.selectedVariants || null,
                personalizzazione: input.personalizzazione || null,
              },
            });
            applyServerCart(cart);
          } else {
            const lines = [...get().lines];
            const existing = lines.find((l) => l.key === key);
            if (existing) {
              existing.quantity = Math.min(MAX_QTY, existing.quantity + input.quantity);
            } else {
              lines.push({ key, ...input, quantity: Math.min(MAX_QTY, input.quantity) });
            }
            set({ lines });
          }
          scheduleQuote();
        },

        setQuantity: async (key, quantity) => {
          const line = get().lines.find((l) => l.key === key);
          if (!line) return;
          const qty = Math.max(0, Math.min(MAX_QTY, quantity));
          if (qty === 0) return get().remove(key);
          // Aggiornamento ottimistico: la UI risponde subito
          set({ lines: get().lines.map((l) => (l.key === key ? { ...l, quantity: qty } : l)) });
          if (isLogged() && line.cartItemId) {
            const cart = await api<ServerCart>(`/cart/items/${line.cartItemId}`, {
              method: "PUT",
              body: { quantity: qty },
            });
            applyServerCart(cart);
          }
          scheduleQuote();
        },

        remove: async (key) => {
          const line = get().lines.find((l) => l.key === key);
          set({ lines: get().lines.filter((l) => l.key !== key) });
          if (isLogged() && line?.cartItemId) {
            const cart = await api<ServerCart>(`/cart/items/${line.cartItemId}`, { method: "DELETE" });
            applyServerCart(cart);
          }
          scheduleQuote();
        },

        clear: () => {
          set({ lines: [], quote: null, couponCode: null, lastAddedKey: null });
        },

        refreshQuote: async () => {
          const { lines, couponCode, shippingMethod, cap } = get();
          if (!lines.length) {
            set({ quote: null, quoting: false });
            return null;
          }
          const seq = ++quoteSeq;
          set({ quoting: true });
          try {
            const quote = await api<CartQuote>("/cart/quote", {
              method: "POST",
              auth: false,
              body: {
                items: lines.map((l) => ({
                  productId: l.productId,
                  quantity: l.quantity,
                  selectedVariants: l.selectedVariants || null,
                  personalizzazione: l.personalizzazione || null,
                })),
                couponCode,
                shippingMethod,
                cap,
              },
            });
            if (seq !== quoteSeq) return quote; // risposta superata da una più recente
            // Aggiorna i dati mostrati (prezzi correnti, immagini delle varianti)
            const byKey = new Map(quote.items.map((i) => [i.key, i]));
            set({
              quote,
              quoting: false,
              lines: get().lines.map((l) => {
                const q = byKey.get(l.key);
                return q
                  ? {
                      ...l,
                      titolo: q.titolo,
                      immagine: q.immagine,
                      prezzo: q.prezzoUnitario,
                      prezzoListino: q.prezzoListino,
                      variantLabel: q.variantLabel,
                    }
                  : l;
              }),
            });
            return quote;
          } catch {
            if (seq === quoteSeq) set({ quoting: false });
            return null;
          }
        },

        setCoupon: async (code) => {
          set({ couponCode: code ? code.trim().toUpperCase() : null });
          return get().refreshQuote();
        },

        setShipping: async (method, cap) => {
          set({ shippingMethod: method, cap: cap ?? get().cap });
          return get().refreshQuote();
        },

        syncWithServer: async () => {
          if (!isLogged() || get().syncing) return;
          set({ syncing: true });
          try {
            const guestLines = get().lines.filter((l) => !l.cartItemId);
            const cart = guestLines.length
              ? await api<ServerCart>("/cart/merge", {
                  method: "POST",
                  body: {
                    items: guestLines.map((l) => ({
                      productId: l.productId,
                      quantity: l.quantity,
                      selectedVariants: l.selectedVariants || null,
                      personalizzazione: l.personalizzazione || null,
                    })),
                  },
                })
              : await api<ServerCart>("/cart");
            applyServerCart(cart);
            await get().refreshQuote();
          } catch {
            // il carrello locale resta valido: riproveremo al prossimo caricamento
          } finally {
            set({ syncing: false });
          }
        },
      };
    },
    {
      name: "bambu-cart",
      version: 2,
      storage: createJSONStorage(() => (typeof window === "undefined" ? (undefined as unknown as Storage) : localStorage)),
      partialize: (s) => ({
        lines: s.lines,
        couponCode: s.couponCode,
        shippingMethod: s.shippingMethod,
        cap: s.cap,
      }),
      // Migra il carrello della versione precedente del sito (chiave "cart")
      onRehydrateStorage: () => (state) => {
        if (!state || state.lines.length) return;
        try {
          const legacy = JSON.parse(localStorage.getItem("cart") || "[]");
          if (Array.isArray(legacy) && legacy.length) {
            state.lines = legacy
              .filter((i: any) => i && i.productId)
              .map((i: any) => ({
                key: lineKey(Number(i.productId), i.selectedVariants),
                productId: Number(i.productId),
                quantity: Math.max(1, Number(i.quantity) || 1),
                selectedVariants: i.selectedVariants || null,
                titolo: String(i.titolo || "Prodotto"),
                immagine: i.immagine || null,
                prezzo: Number(i.prezzo) || 0,
              }));
          }
          localStorage.removeItem("cart");
        } catch {
          // carrello legacy illeggibile: si riparte da vuoto
        }
      },
    }
  )
);

export const cartCount = (lines: CartLine[]) => lines.reduce((s, l) => s + l.quantity, 0);
