"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Minus, Plus, ScanLine, Search, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/admin/PageTitle";
import { Callout } from "@/components/admin/ops/Callout";
import { useAsync } from "@/components/admin/ops/useAsync";
import { pluralize } from "@/components/admin/catalog/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { ApiError, errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import type { GiacenzaDettaglio, GiacenzaRiepilogo } from "../types";
import { GiacenzaModal } from "./GiacenzaModal";

/**
 * Sezione Magazzino (ex Magazzino di GS_MAG): i libri già in negozio senza cliente. Si caricano in anticipo col
 * lettore (una copia per lettura) e si correggono a mano; dalla scheda del cliente si danno subito.
 */
export function MagazzinoPage() {
  const [testo, setTesto] = useState("");
  const [q, setQ] = useState("");
  const [codice, setCodice] = useState("");
  const [caricando, setCaricando] = useState(false);
  // undefined = chiuso, null = libro nuovo
  const [aperto, setAperto] = useState<GiacenzaRiepilogo | null | undefined>(undefined);
  const [isbnNuovo, setIsbnNuovo] = useState("");
  const [lavoro, setLavoro] = useState<string | null>(null);
  const lettore = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setQ(testo.trim()), 250);
    return () => clearTimeout(t);
  }, [testo]);

  const giacenze = useAsync(() => api<GiacenzaRiepilogo[]>("/libri/magazzino", { query: { q } }), [q]);

  const nuovo = (isbn = "") => {
    setIsbnNuovo(isbn);
    setAperto(null);
  };

  // Il lettore scrive il codice e preme Invio: una copia in più. Un codice mai visto apre il modulo.
  const carica = async (e: React.FormEvent) => {
    e.preventDefault();
    const isbn = codice.trim();
    if (!isbn || caricando) return;
    setCaricando(true);
    try {
      const g = await api<GiacenzaDettaglio>("/libri/magazzino/carico", { method: "POST", body: { isbn } });
      toast.success(`«${g.titolo}» vol. ${g.volume}: ora ${pluralize(g.quantita, "copia", "copie")} in negozio.`);
      setCodice("");
      giacenze.reload();
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setCodice("");
        nuovo(isbn);
      } else toast.error(errorMessage(err));
    } finally {
      setCaricando(false);
      lettore.current?.focus();
    }
  };

  const correggi = async (g: GiacenzaRiepilogo, delta: 1 | -1) => {
    setLavoro(g.isbn);
    try {
      if (delta > 0) await api("/libri/magazzino/carico", { method: "POST", body: { isbn: g.isbn } });
      else await api(`/libri/magazzino/${encodeURIComponent(g.isbn)}/rettifica`, { method: "POST", body: { delta } });
      giacenze.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLavoro(null);
    }
  };

  const righe = giacenze.data ?? [];
  const copie = righe.reduce((t, g) => t + g.quantita, 0);
  const usati = righe.reduce((t, g) => t + g.usati, 0);
  const valore = righe.reduce((t, g) => t + g.quantita * Number(g.prezzo), 0);

  return (
    <div>
      <PageTitle
        title="Magazzino"
        description="I libri già in negozio, senza cliente. Quando un cliente prenota uno di questi libri, glielo dai subito dalla sua scheda."
        actions={
          <Button onClick={() => nuovo()}>
            <Plus className="h-4 w-4" /> Aggiungi libro
          </Button>
        }
      />

      <div className="card mb-5 grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
        <form onSubmit={carica}>
          <label htmlFor="lettore-magazzino" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            Carica col lettore (una copia per lettura)
          </label>
          <div className="relative">
            <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600" />
            <input
              id="lettore-magazzino"
              ref={lettore}
              value={codice}
              onChange={(e) => setCodice(e.target.value)}
              placeholder="Leggi o scrivi il codice e premi Invio"
              inputMode="numeric"
              autoFocus
              autoComplete="off"
              readOnly={caricando}
              className="w-full rounded-xl border-2 border-brand-200 bg-white py-2.5 pl-10 pr-3 text-base font-mono focus:border-brand-500 focus:outline-none"
            />
          </div>
        </form>
        <div>
          <label htmlFor="cerca-magazzino" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            Cerca
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
            <input
              id="cerca-magazzino"
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              placeholder="Codice, titolo, autore, editore o materia"
              autoComplete="off"
              className="w-full rounded-xl border border-paper-line bg-white py-2.5 pl-10 pr-3 text-base focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {giacenze.error ? (
        <Callout tone="danger">{giacenze.error}</Callout>
      ) : !giacenze.data ? (
        <Skeleton className="h-64" />
      ) : righe.length === 0 ? (
        <EmptyState
          icon={<Warehouse className="h-7 w-7" />}
          title={q ? "Nessun libro trovato" : "Magazzino vuoto"}
          text={q ? "Prova con un'altra parola." : "Leggi i codici dei libri che hai già in negozio: ogni lettura carica una copia."}
          className="card"
        />
      ) : (
        <div className="card overflow-hidden">
          <p className="border-b border-paper-line p-4 text-[15px] sm:px-5">
            <strong className="text-2xl font-extrabold tabular-nums">{copie}</strong> {copie === 1 ? "copia nuova" : "copie nuove"} in negozio
            <span className="text-ink-muted"> ({formatPrice(valore)})</span>
            {usati > 0 && (
              <>
                {" "}
                · <strong className="text-2xl font-extrabold tabular-nums">{usati}</strong> {usati === 1 ? "usata" : "usate"}
              </>
            )}
            <span className="text-ink-muted"> · {pluralize(righe.length, "titolo", "titoli")}</span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-base">
              <thead className="border-b border-paper-line bg-paper/60 text-sm font-bold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th scope="col" className="py-3 pl-5 pr-2">Codice</th>
                  <th scope="col" className="px-2 py-3">Titolo e autori</th>
                  <th scope="col" className="px-2 py-3">Editore</th>
                  <th scope="col" className="px-2 py-3">Vol.</th>
                  <th scope="col" className="px-2 py-3 text-right">Prezzo</th>
                  <th scope="col" className="px-2 py-3 text-right">Prenotati</th>
                  <th scope="col" className="px-2 py-3 text-right">In ordine</th>
                  <th scope="col" className="px-2 py-3 text-right">Da ritirare</th>
                  <th scope="col" className="px-2 py-3 text-right">Usati</th>
                  <th scope="col" className="py-3 pl-2 pr-5 text-center">Nuovi in negozio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-line">
                {righe.map((g) => (
                  <tr
                    key={g.isbn}
                    // Un libro che c'è solo usato non ha la scheda di magazzino: le sue copie sono negli Usati
                    onClick={() => g.id !== null && setAperto(g)}
                    className={cn("align-top transition hover:bg-paper/60", g.id !== null && "cursor-pointer", !g.quantita && !g.usati && "text-ink-muted")}
                  >
                    <td className="whitespace-nowrap py-3 pl-5 pr-2 font-mono text-sm">{g.isbn}</td>
                    <td className="px-2 py-3">
                      <span className={cn("block font-semibold leading-snug", g.quantita > 0 && "text-ink")}>{g.titolo}</span>
                      <span className="block text-sm text-ink-muted">
                        {g.autori} · {g.materia}
                      </span>
                    </td>
                    <td className="w-[150px] px-2 py-3 text-sm">{g.editore}</td>
                    <td className="px-2 py-3 text-lg font-bold">{g.volume}</td>
                    <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums">{formatPrice(g.prezzo)}</td>
                    <td className={cn("px-2 py-3 text-right tabular-nums", g.prenotati > 0 && (g.quantita > 0 || g.usati > 0) && "font-bold text-orange-ink")}>
                      {g.prenotati || "–"}
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums">{g.inOrdine || "–"}</td>
                    <td className="px-2 py-3 text-right tabular-nums">{g.daRitirare || "–"}</td>
                    <td className="px-2 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {g.usati > 0 ? (
                        <Link href="/scuole/usati?vista=negozio" className="text-lg font-extrabold tabular-nums text-brand-700 hover:underline" title="Le copie usate, una per una">
                          {g.usati}
                        </Link>
                      ) : (
                        <span className="tabular-nums text-ink-muted">–</span>
                      )}
                    </td>
                    <td className="py-2 pl-2 pr-5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => correggi(g, -1)}
                          disabled={!g.quantita || lavoro === g.isbn}
                          aria-label={`Una copia in meno di ${g.titolo}`}
                          className="rounded-full border border-paper-line p-1.5 text-ink-soft transition hover:bg-paper-warm disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center text-xl font-extrabold tabular-nums">{g.quantita}</span>
                        <button
                          type="button"
                          onClick={() => correggi(g, 1)}
                          disabled={lavoro === g.isbn}
                          aria-label={`Una copia in più di ${g.titolo}`}
                          className="rounded-full border border-paper-line p-1.5 text-ink-soft transition hover:bg-paper-warm disabled:opacity-40"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <GiacenzaModal
        open={aperto !== undefined}
        giacenza={aperto ?? null}
        isbnIniziale={isbnNuovo}
        onClose={() => {
          setAperto(undefined);
          setTimeout(() => lettore.current?.focus(), 0);
        }}
        onSaved={giacenze.reload}
      />
    </div>
  );
}
