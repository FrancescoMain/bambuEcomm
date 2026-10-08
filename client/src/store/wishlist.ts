"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "@/lib/api/client";
import { useAuth } from "./auth";

interface WishlistState {
  ids: number[];
  has: (id: number) => boolean;
  toggle: (id: number) => Promise<boolean>;
  syncWithServer: () => Promise<void>;
  clear: () => void;
}

/** Preferiti: nel browser per gli ospiti, sincronizzati col server dopo il login */
export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      has: (id) => get().ids.includes(id),
      toggle: async (id) => {
        const adding = !get().ids.includes(id);
        set({ ids: adding ? [id, ...get().ids] : get().ids.filter((x) => x !== id) });
        if (useAuth.getState().user) {
          try {
            const res = adding
              ? await api<{ ids: number[] }>("/wishlist", { method: "POST", body: { productId: id } })
              : await api<{ ids: number[] }>(`/wishlist/${id}`, { method: "DELETE" });
            set({ ids: res.ids });
          } catch {
            // resta la modifica locale
          }
        }
        return adding;
      },
      syncWithServer: async () => {
        if (!useAuth.getState().user) return;
        try {
          const res = await api<{ ids: number[] }>("/wishlist/merge", {
            method: "POST",
            body: { productIds: get().ids },
          });
          set({ ids: res.ids });
        } catch {
          // offline: manteniamo la lista locale
        }
      },
      clear: () => set({ ids: [] }),
    }),
    { name: "bambu-wishlist", storage: createJSONStorage(() => (typeof window === "undefined" ? (undefined as unknown as Storage) : localStorage)) }
  )
);

interface RecentState {
  ids: number[];
  push: (id: number) => void;
}

/** Prodotti visti di recente (max 12) */
export const useRecentlyViewed = create<RecentState>()(
  persist(
    (set, get) => ({
      ids: [],
      push: (id) => set({ ids: [id, ...get().ids.filter((x) => x !== id)].slice(0, 12) }),
    }),
    { name: "bambu-recent", storage: createJSONStorage(() => (typeof window === "undefined" ? (undefined as unknown as Storage) : localStorage)) }
  )
);
