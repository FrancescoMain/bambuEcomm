"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/api/client";
import { useAuth } from "@/store/auth";
import { Honeypot } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export function ReviewForm({ productId }: { productId: number }) {
  const user = useAuth((s) => s.user);
  const [open, setOpen] = useState(false);
  const [voto, setVoto] = useState(0);
  const [hover, setHover] = useState(0);
  const [nome, setNome] = useState("");
  const [testo, setTesto] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return <p className="rounded-2xl bg-brand-50 p-4 text-sm font-semibold text-brand-800">Grazie! La tua recensione sarà pubblicata dopo l&apos;approvazione.</p>;
  }
  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Scrivi una recensione
      </Button>
    );
  }

  return (
    <form
      className="card space-y-4 p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!voto) {
          toast.error("Scegli da 1 a 5 stelle.");
          return;
        }
        setLoading(true);
        try {
          const website = (new FormData(e.currentTarget).get("website") as string) || undefined;
          await api("/reviews", {
            method: "POST",
            body: { productId, voto, nome: nome || user?.name || "", testo, website },
          });
          setSent(true);
        } catch (err) {
          toast.error(errorMessage(err));
        } finally {
          setLoading(false);
        }
      }}
    >
      <Honeypot />
      <div>
        <p className="field-label">Il tuo voto</p>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setVoto(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} stelle`}
              aria-pressed={voto === n}
              className="p-0.5"
            >
              <Star className={cn("h-7 w-7 transition", (hover || voto) >= n ? "fill-orange text-orange" : "text-paper-line")} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor="review-name" className="field-label">Nome</label>
        <input id="review-name" required value={nome || user?.name || ""} onChange={(e) => setNome(e.target.value)} className="field" />
      </div>
      <div>
        <label htmlFor="review-text" className="field-label">Recensione</label>
        <textarea id="review-text" value={testo} onChange={(e) => setTesto(e.target.value)} rows={4} className="field" placeholder="Cosa ne pensi del prodotto?" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" loading={loading}>Invia recensione</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annulla</Button>
      </div>
    </form>
  );
}
