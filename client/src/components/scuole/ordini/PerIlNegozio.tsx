"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Minus, Plus, ScanLine, Store, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ApiError, errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import { formatPrice } from "@/lib/format";
import type { LibroScheda } from "../types";

/** Una copia per il negozio (senza cliente) da mettere nel prossimo ordine */
export type CopiaNegozio = { isbn: string; titolo: string; editore: string; volume: string; prezzo: number; quantita: number };

const CHIAVE = "scuole_ordine_negozio";

/**
 * Le copie per il negozio scelte e non ancora ordinate. Restano su questo computer (anche cambiando schermata)
 * finché non si crea l'ordine; se il browser non le salva, si perdono solo alla chiusura della pagina.
 */
export function useCopieNegozio() {
  const [copie, setStato] = useState<CopiaNegozio[]>([]);
  useEffect(() => {
    try {
      const salvate = JSON.parse(localStorage.getItem(CHIAVE) ?? "[]");
      if (Array.isArray(salvate)) setStato(salvate);
    } catch {
      // niente da recuperare
    }
  }, []);
  // Si salva solo quando le copie cambiano davvero, mai al montaggio (altrimenti si cancellerebbe quanto salvato)
  const setCopie = useCallback((nuove: CopiaNegozio[]) => {
    setStato(nuove);
    try {
      if (nuove.length) localStorage.setItem(CHIAVE, JSON.stringify(nuove));
      else localStorage.removeItem(CHIAVE);
    } catch {
      // il browser non salva: le copie restano finché la pagina è aperta
    }
  }, []);
  return [copie, setCopie] as const;
}

/** Codice → dati del libro (classi, schede o magazzino), oppure null con il messaggio già mostrato. */
export async function cercaLibro(codice: string) {
  try {
    return await api<Omit<LibroScheda, "id">>(`/libri/catalogo/${encodeURIComponent(codice)}`);
  } catch (e) {
    toast.error(
      e instanceof ApiError && e.status === 404
        ? `Il codice ${codice} non è in nessuna classe, scheda o magazzino: aggiungi prima il libro in Magazzino.`
        : errorMessage(e)
    );
    return null;
  }
}

/** Libri senza cliente da ordinare per il negozio (ex righe aggiunte a mano in GS_MAG): una riga per copia. */
export function PerIlNegozio({ copie, onChange }: { copie: CopiaNegozio[]; onChange: (c: CopiaNegozio[]) => void }) {
  const [codice, setCodice] = useState("");
  const [cercando, setCercando] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  const cambia = (isbn: string, delta: number) =>
    onChange(copie.flatMap((c) => (c.isbn !== isbn ? [c] : c.quantita + delta > 0 ? [{ ...c, quantita: Math.min(99, c.quantita + delta) }] : [])));

  // Il lettore scrive il codice e preme Invio: una copia in più (rileggendolo se ne aggiunge un'altra)
  const aggiungi = async (e: React.FormEvent) => {
    e.preventDefault();
    const isbn = codice.replace(/[\s-]/g, "").toUpperCase();
    if (!isbn || cercando) return;
    if (copie.some((c) => c.isbn === isbn)) {
      cambia(isbn, 1);
      setCodice("");
      return;
    }
    setCercando(true);
    const l = await cercaLibro(isbn);
    setCercando(false);
    setCodice("");
    if (l) onChange([...copie, { isbn, titolo: l.titolo, editore: l.editore, volume: l.volume, prezzo: Number(l.prezzo), quantita: 1 }]);
    setTimeout(() => campo.current?.focus(), 0);
  };

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-paper-line p-4 sm:flex-row sm:items-end sm:px-5">
        <div className="min-w-0 flex-1">
          <h3 className="flex items-center gap-2 text-lg font-extrabold">
            <Store className="h-5 w-5 text-brand-600" /> Per il negozio
          </h3>
          <p className="text-sm text-ink-muted">
            Libri senza cliente, da tenere in negozio: entrano nel prossimo ordine. All&apos;arrivo vanno a chi li ha prenotati nel
            frattempo, altrimenti in Magazzino.
          </p>
        </div>
        <form onSubmit={aggiungi} className="relative w-full sm:w-80">
          <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600" />
          <input
            ref={campo}
            value={codice}
            onChange={(e) => setCodice(e.target.value)}
            placeholder="Codice e Invio"
            aria-label="Codice del libro per il negozio"
            inputMode="numeric"
            autoComplete="off"
            disabled={cercando}
            className="w-full rounded-xl border-2 border-brand-200 bg-white py-2.5 pl-10 pr-3 font-mono text-base focus:border-brand-500 focus:outline-none"
          />
        </form>
      </header>
      {copie.length > 0 && (
        <ul className="divide-y divide-paper-line">
          {copie.map((c) => (
            <li key={c.isbn} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
              <span className="font-mono text-sm">{c.isbn}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-snug">{c.titolo}</span>
                <span className="block text-sm text-ink-muted">
                  {c.editore} · vol. <strong>{c.volume}</strong> · {formatPrice(c.prezzo)}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => cambia(c.isbn, -1)}
                  aria-label={`Una copia in meno di ${c.titolo}`}
                  className="rounded-full border border-paper-line p-1.5 text-ink-soft transition hover:bg-paper-warm"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-xl font-extrabold tabular-nums">{c.quantita}</span>
                <button
                  type="button"
                  onClick={() => cambia(c.isbn, 1)}
                  aria-label={`Una copia in più di ${c.titolo}`}
                  className="rounded-full border border-paper-line p-1.5 text-ink-soft transition hover:bg-paper-warm"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </span>
              <Button size="sm" variant="ghost" onClick={() => onChange(copie.filter((x) => x.isbn !== c.isbn))} aria-label={`Togli ${c.titolo}`}>
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
