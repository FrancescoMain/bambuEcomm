"use client";

import { useState } from "react";
import { BellRing, Check } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api/client";
import { useAuth } from "@/store/auth";

/** "Avvisami quando torna disponibile" per i prodotti esauriti */
export function NotifyMeForm({ productId }: { productId: number }) {
  const user = useAuth((s) => s.user);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  if (done) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-brand-50 p-4 text-sm font-semibold text-brand-800">
        <Check className="h-5 w-5" /> Ti avviseremo via email appena torna disponibile.
      </p>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
          await api(`/products/${productId}/notify`, {
            method: "POST",
            auth: false,
            body: { email: email || user?.email },
          });
          setDone(true);
        } catch (err) {
          toast.error(errorMessage(err));
        } finally {
          setLoading(false);
        }
      }}
      className="rounded-2xl border border-paper-line bg-white p-4"
    >
      <p className="mb-3 flex items-center gap-2 text-[15px] font-bold">
        <BellRing className="h-5 w-5 text-orange" /> Avvisami quando torna disponibile
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={email || user?.email || ""}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="La tua email"
          aria-label="La tua email"
          className="field h-11 flex-1"
        />
        <button
          type="submit"
          disabled={loading}
          className="h-11 shrink-0 rounded-full bg-ink px-5 text-sm font-bold text-white hover:bg-ink-soft disabled:opacity-60"
        >
          Avvisami
        </button>
      </div>
    </form>
  );
}
