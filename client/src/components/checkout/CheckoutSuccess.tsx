"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Mail, Package } from "lucide-react";
import { api } from "@/lib/api/client";
import { useCart } from "@/store/cart";
import { useAuth } from "@/store/auth";
import { formatPrice } from "@/lib/format";
import { buttonClass } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type Summary = {
  orderId: number;
  status: string;
  paid: boolean;
  total: number;
  metodoConsegna: string | null;
  email: string;
  items: { titolo: string | null; quantity: number; prezzo: number }[];
};

/**
 * Pagina "grazie": svuota il carrello e mostra il riepilogo. Se il webhook di
 * Stripe non ha ancora confermato il pagamento, riprova per qualche secondo.
 */
export function CheckoutSuccess() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const codOrder = params.get("ordine");
  const user = useAuth((s) => s.user);
  const clear = useCart((s) => s.clear);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(!!sessionId);

  useEffect(() => {
    clear();
    try {
      sessionStorage.removeItem("bambu-checkout-form");
    } catch {
      // ignora
    }
  }, [clear]);

  useEffect(() => {
    if (!sessionId) return;
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const res = await api<Summary>(`/checkout-session/${encodeURIComponent(sessionId)}`, { auth: false });
        setSummary(res);
        if (!res.paid && tries++ < 6) {
          timer = setTimeout(load, 2000);
          return;
        }
      } catch {
        if (tries++ < 3) {
          timer = setTimeout(load, 2000);
          return;
        }
      }
      setLoading(false);
    };
    void load();
    return () => clearTimeout(timer);
  }, [sessionId]);

  const orderId = summary?.orderId ?? (codOrder ? Number(codOrder) : null);

  return (
    <div className="container max-w-2xl py-12 sm:py-16">
      <div className="card overflow-hidden">
        <div className="bg-confetti bg-brand-50 px-6 py-10 text-center sm:px-10">
          <CheckCircle2 className="mx-auto h-14 w-14 text-brand-600" />
          <h1 className="mt-4 text-3xl font-extrabold">Grazie per il tuo ordine!</h1>
          {orderId ? <p className="mt-2 text-lg text-ink-soft">Ordine n. <strong>#{orderId}</strong></p> : null}
        </div>
        <div className="space-y-5 p-6 sm:p-10">
          {loading && !summary?.paid ? (
            <p className="flex items-center justify-center gap-2 text-ink-muted">
              <Spinner className="h-4 w-4" /> Stiamo confermando il pagamento…
            </p>
          ) : null}
          {codOrder ? (
            <p className="rounded-2xl bg-orange-soft p-4 text-[15px] text-orange-ink">
              Hai scelto il <strong>pagamento alla consegna</strong>: pagherai al corriere quando riceverai il pacco.
            </p>
          ) : null}
          <ul className="space-y-3 text-[15px] text-ink-soft">
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              Ti abbiamo inviato una email di conferma{summary?.email ? ` a ${summary.email}` : ""} con il riepilogo.
            </li>
            <li className="flex gap-3">
              {summary?.metodoConsegna === "ritiro" ? (
                <>
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" /> Ti scriveremo appena l&apos;ordine sarà pronto per il ritiro in negozio.
                </>
              ) : (
                <>
                  <Package className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" /> Riceverai il numero di tracking quando il pacco partirà.
                </>
              )}
            </li>
          </ul>
          {summary && summary.items.length > 0 && (
            <div className="rounded-2xl border border-paper-line p-4">
              <ul className="space-y-1.5 text-sm">
                {summary.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between gap-3">
                    <span>
                      {i.quantity} × {i.titolo}
                    </span>
                    <span className="font-semibold">{i.prezzo === 0 ? "Omaggio" : formatPrice(i.prezzo * i.quantity)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex justify-between border-t border-paper-line pt-3 font-extrabold">
                <span>Totale pagato</span>
                <span>{formatPrice(summary.total)}</span>
              </p>
            </div>
          )}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            {user ? (
              <Link href="/account/ordini" className={buttonClass("outline")}>I miei ordini</Link>
            ) : (
              <Link href="/register" className={buttonClass("outline")}>Crea un account</Link>
            )}
            <Link href="/" className={buttonClass("primary")}>Torna al negozio</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
