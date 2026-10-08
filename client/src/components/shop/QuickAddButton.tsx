"use client";

import { useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { errorMessage } from "@/lib/api/client";
/** Solo i campi necessari: le props dei componenti client finiscono nell'HTML */
type QuickAddProduct = { id: number; titolo: string; immagine: string | null; prezzo: number; prezzoFinale: number };

/** "Aggiungi" rapido dalla card per i prodotti senza varianti */
export function QuickAddButton({ product }: { product: QuickAddProduct }) {
  const add = useCart((s) => s.add);
  const openCart = useUI((s) => s.openCart);
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setState("loading");
        try {
          await add({
            productId: product.id,
            quantity: 1,
            titolo: product.titolo,
            immagine: product.immagine,
            prezzo: product.prezzoFinale,
            prezzoListino: product.prezzo,
          });
          setState("done");
          openCart();
          setTimeout(() => setState("idle"), 1500);
        } catch (err) {
          setState("idle");
          toast.error(errorMessage(err));
        }
      }}
      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-brand-600 px-3.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60"
      disabled={state === "loading"}
      aria-label={`Aggiungi ${product.titolo} al carrello`}
    >
      {state === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === "done" ? (
        <Check className="h-4 w-4" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">{state === "done" ? "Aggiunto" : "Aggiungi"}</span>
    </button>
  );
}
