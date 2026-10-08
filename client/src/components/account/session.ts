"use client";

import { toast } from "sonner";
import { useAuth } from "@/store/auth";
import { useCart } from "@/store/cart";
import { useWishlist } from "@/store/wishlist";

let signingOut = false;

/** true subito dopo un logout volontario: l'area personale non rimanda al login */
export const isSigningOut = () => signingOut;

/** Esce dall'account e svuota carrello e preferiti locali (come il menu dell'header) */
export function signOut(navigate: (path: string) => void) {
  signingOut = true;
  useAuth.getState().logout();
  useCart.getState().clear();
  useWishlist.getState().clear();
  toast("Sei uscito dal tuo account. A presto!");
  navigate("/");
  setTimeout(() => {
    signingOut = false;
  }, 2000);
}
