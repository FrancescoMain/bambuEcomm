"use client";

import { useEffect } from "react";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";

/**
 * Avvio lato browser: legge il login salvato e, se l'utente è autenticato,
 * unisce carrello e preferiti dell'ospite con quelli salvati sul server.
 * Non blocca mai il rendering della pagina.
 */
export function ClientInit() {
  const user = useAuth((s) => s.user);
  const init = useAuth((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (user) {
      void useCart.getState().syncWithServer();
      void useWishlist.getState().syncWithServer();
    }
  }, [user]);

  return null;
}
