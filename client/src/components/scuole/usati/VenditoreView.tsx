"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, HandCoins, Pencil, ScanLine, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Callout } from "@/components/admin/ops/Callout";
import { useAsync } from "@/components/admin/ops/useAsync";
import { useConfirm } from "@/components/admin/useConfirm";
import { pluralize } from "@/components/admin/catalog/utils";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Spinner";
import { errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import { cn } from "@/lib/cn";
import { formatDate, formatPrice } from "@/lib/format";
import { etichettaCopia, FogliEtichette, usePreferenzeEtichette, useStampaEtichette } from "../Etichette";
import { cercaLibro } from "../ordini/PerIlNegozio";
import { STATI_COPIA, type CopiaUsata, type Venditore } from "../types";
import { VenditoreModal } from "./VenditoreModal";

const CHIAVE_PERCENTUALI = "scuole_usato_percentuali";

type LibroLetto = { isbn: string; titolo: string; volume: string; editore: string; prezzo: number };

const numero = (t: string) => {
  const n = Number(t.replace(",", "."));
  return t.trim() && Number.isFinite(n) && n >= 0 && n <= 100 ? n : null;
};
const arrotonda = (n: number) => Math.round(n * 100) / 100;

/** Le ultime percentuali scritte, proposte per la copia dopo (si comprano spesso più libri allo stesso modo). */
function leggiPercentuali() {
  try {
    const p = JSON.parse(localStorage.getItem(CHIAVE_PERCENTUALI) ?? "null");
    if (p && typeof p.sconto === "string" && typeof p.acquisto === "string") return p as { sconto: string; acquisto: string };
  } catch {
    // niente da recuperare
  }
  return { sconto: "", acquisto: "" };
}

/** Scheda di chi vende: le sue copie usate, quanto gli si deve (solo per le copie vendute) e i pagamenti. */
export function VenditoreView({ venditoreId, onBack }: { venditoreId: number; onBack: () => void }) {
  const caricato = useAsync(() => api<Venditore>(`/libri/usati/venditori/${venditoreId}`), [venditoreId]);
  const [aggiornato, setAggiornato] = useState<Venditore | null>(null);
  const v = aggiornato ?? caricato.data;
  const [codice, setCodice] = useState("");
  const [sconto, setSconto] = useState("");
  const [acquisto, setAcquisto] = useState("");
  const [salvando, setSalvando] = useState(false);
  // Il libro del codice letto: titolo e copertina per capire subito a quanto si vende e quanto si dà al venditore
  const [libro, setLibro] = useState<LibroLetto | null>(null);
  const [modifica, setModifica] = useState(false);
  const campoSconto = useRef<HTMLInputElement>(null);
  const [pref] = usePreferenzeEtichette();
  const lettore = useRef<HTMLInputElement>(null);
  const [etichette, stampaEtichette] = useStampaEtichette(() => lettore.current?.focus());
  const [confirm, dialog] = useConfirm();

  useEffect(() => setAggiornato(null), [caricato.data]);
  useEffect(() => {
    const p = leggiPercentuali();
    setSconto(p.sconto);
    setAcquisto(p.acquisto);
  }, []);

  const ricarica = () => caricato.reload();

  // Il libro portato al banco, in due passi: letto il codice compaiono titolo e copertina e il cursore va allo sconto;
  // con le percentuali si vedono i due prezzi, e il secondo Invio registra la copia (esce l'etichetta col nostro codice).
  const aggiungi = async (e: React.FormEvent) => {
    e.preventDefault();
    const isbn = codice.replace(/[\s-]/g, "").toUpperCase();
    if (!isbn || salvando) return;
    if (libro?.isbn !== isbn) {
      setSalvando(true);
      const l = await cercaLibro(isbn);
      setSalvando(false);
      if (!l) {
        setLibro(null);
        lettore.current?.select();
        return;
      }
      setLibro({ isbn, titolo: l.titolo, volume: l.volume, editore: l.editore, prezzo: Number(l.prezzo) });
      setTimeout(() => campoSconto.current?.select(), 0);
      return;
    }
    setSalvando(true);
    try {
      const { copia, inAttesa } = await api<{ copia: CopiaUsata; inAttesa: number }>(`/libri/usati/venditori/${venditoreId}/copie`, {
        method: "POST",
        body: { isbn, scontoVendita: sconto, percentualeAcquisto: acquisto },
      });
      try {
        localStorage.setItem(CHIAVE_PERCENTUALI, JSON.stringify({ sconto, acquisto }));
      } catch {
        // le percentuali restano solo finché la pagina è aperta
      }
      toast.success(
        `«${copia.titolo}»: codice ${copia.codice}, in vendita a ${formatPrice(copia.prezzoVendita)}, al venditore ${formatPrice(copia.prezzoAcquisto)}.` +
          (inAttesa ? ` ${pluralize(inAttesa, "cliente lo aspetta", "clienti lo aspettano")}: assegnalo stasera.` : ""),
        { duration: 7000 }
      );
      setCodice("");
      setLibro(null);
      if (pref.automatica) stampaEtichette([etichettaCopia(copia)]);
      ricarica();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSalvando(false);
      lettore.current?.focus();
    }
  };

  const pagata = async (c: CopiaUsata, si: boolean) => {
    try {
      await api(`/libri/usati/copie/${c.id}/pagata`, { method: "POST", body: { pagata: si } });
      ricarica();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const pagaTutto = async () => {
    if (!v) return;
    const ok = await confirm({
      title: `Pagare ${formatPrice(v.conti.daPagare)} a ${v.cognome} ${v.nome}?`,
      message: "Tutte le copie vendute e non ancora pagate risultano pagate oggi.",
      confirmLabel: "Sì, segna pagato",
    });
    if (!ok) return;
    try {
      const r = await api<{ pagate: number; venditore: Venditore }>(`/libri/usati/venditori/${venditoreId}/paga`, { method: "POST" });
      setAggiornato(r.venditore);
      toast.success(`${pluralize(r.pagate, "copia segnata pagata", "copie segnate pagate")}.`);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const elimina = async (c: CopiaUsata) => {
    const ok = await confirm({
      title: `Togliere la copia ${c.codice}?`,
      message: `«${c.titolo}»: inserita per sbaglio o restituita al venditore.`,
      confirmLabel: "Togli la copia",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/libri/usati/copie/${c.id}`, { method: "DELETE" });
      ricarica();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (caricato.error) return <Callout tone="danger">{caricato.error}</Callout>;
  if (!v) return <Skeleton className="h-96" />;

  return (
    <>
      <div className="space-y-4 print:hidden">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-[15px] font-semibold text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Venditori
        </button>

        <section className="card overflow-hidden">
          <header className="flex flex-col gap-4 border-b border-paper-line p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-muted">Venditore di libri usati · conto vendita</p>
              <h2 className="text-2xl font-extrabold">
                {v.cognome} {v.nome}
              </h2>
              <p className="text-[15px] text-ink-soft">
                {v.telefono ? `tel. ${v.telefono}` : "senza telefono"}
                {v.note ? ` · ${v.note}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={pagaTutto} disabled={!v.conti.daPagare}>
                <HandCoins className="h-4 w-4" /> Segna pagato {v.conti.daPagare ? formatPrice(v.conti.daPagare) : ""}
              </Button>
              <Button variant="outline" onClick={() => setModifica(true)} aria-label="Modifica dati">
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <div className="grid gap-px bg-paper-line sm:grid-cols-4">
            <Cifra label="Copie non ancora vendute" valore={String(v.conti.inNegozio)} />
            <Cifra label="Copie vendute" valore={String(v.conti.vendute)} />
            <Cifra label="Da pagare" valore={formatPrice(v.conti.daPagare)} forte />
            <Cifra label="Già pagato" valore={formatPrice(v.conti.pagato)} />
          </div>

          <form onSubmit={aggiungi} className="grid gap-4 border-t border-paper-line p-4 sm:p-5 lg:grid-cols-[minmax(0,2fr)_160px_160px_auto] lg:items-end">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink-soft">Libro portato (codice e Invio: compare il titolo)</span>
              <span className="relative block">
                <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-600" />
                <input
                  ref={lettore}
                  value={codice}
                  onChange={(e) => {
                    setCodice(e.target.value);
                    setLibro(null);
                  }}
                  placeholder="Codice del libro"
                  inputMode="numeric"
                  autoFocus
                  autoComplete="off"
                  readOnly={salvando}
                  className="w-full rounded-xl border-2 border-brand-200 bg-white py-2.5 pl-10 pr-3 font-mono text-base focus:border-brand-500 focus:outline-none"
                />
              </span>
            </label>
            <Percentuale label="Sconto di vendita" valore={sconto} onCambia={setSconto} campo={campoSconto} />
            <Percentuale label="Al venditore" valore={acquisto} onCambia={setAcquisto} />
            <Button type="submit" disabled={salvando || !codice.trim() || (!!libro && (numero(sconto) === null || numero(acquisto) === null))}>
              {libro ? "Aggiungi" : "Cerca"}
            </Button>
            {libro && <Anteprima libro={libro} sconto={numero(sconto)} acquisto={numero(acquisto)} />}
          </form>

          {v.copie.length > 0 && (
            <div className="overflow-x-auto border-t border-paper-line">
              <table className="w-full min-w-[1000px] text-left text-base">
                <thead className="border-b border-paper-line bg-paper/60 text-sm font-bold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th scope="col" className="py-3 pl-5 pr-2">Codice</th>
                    <th scope="col" className="px-2 py-3">Libro</th>
                    <th scope="col" className="px-2 py-3 text-right">Copertina</th>
                    <th scope="col" className="px-2 py-3 text-right">Vendita</th>
                    <th scope="col" className="px-2 py-3 text-right">Al venditore</th>
                    <th scope="col" className="px-2 py-3">Stato</th>
                    <th scope="col" className="py-3 pl-2 pr-5" aria-label="Azioni" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-line">
                  {v.copie.map((c) => (
                    <tr key={c.id} className="align-top">
                      <td className="whitespace-nowrap py-3 pl-5 pr-2 font-mono text-sm">
                        <span className="block font-bold">{c.codice}</span>
                        <span className="text-ink-muted">{c.isbn}</span>
                      </td>
                      <td className="px-2 py-3">
                        <span className="block font-semibold leading-snug">{c.titolo}</span>
                        <span className="block text-sm text-ink-muted">
                          {c.editore} · vol. {c.volume} · comprato il {formatDate(c.createdAt)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums text-ink-muted">{formatPrice(c.prezzo)}</td>
                      <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums">
                        <span className="block font-semibold">{formatPrice(c.prezzoVendita)}</span>
                        <span className="text-xs text-ink-muted">−{Number(c.scontoVendita)} %</span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums">
                        <span className="block font-semibold">{formatPrice(c.prezzoAcquisto)}</span>
                        <span className="text-xs text-ink-muted">{Number(c.percentualeAcquisto)} %</span>
                      </td>
                      <td className="px-2 py-3">
                        <span className={cn("whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold", STATI_COPIA[c.stato].classe)}>{STATI_COPIA[c.stato].label}</span>
                        {c.libro && (
                          <Link href={`/scuole/clienti?scheda=${c.libro.scheda.id}`} className="mt-1 block text-sm font-semibold text-brand-700 hover:underline">
                            {c.libro.scheda.cognome} {c.libro.scheda.nome}
                          </Link>
                        )}
                        {c.pagataAt && <span className="mt-1 block text-xs text-ink-muted">pagata il {formatDate(c.pagataAt)}</span>}
                      </td>
                      <td className="whitespace-nowrap py-2 pl-2 pr-5 text-right">
                        <button
                          type="button"
                          onClick={() => stampaEtichette([etichettaCopia(c)])}
                          className="rounded-full p-2 text-ink-muted transition hover:bg-paper-warm hover:text-ink"
                          aria-label={`Stampa l'etichetta della copia ${c.codice}`}
                          title="Stampa l'etichetta col nostro codice"
                        >
                          <Tag className="h-4 w-4" />
                        </button>
                        {c.stato === "VENDUTA" && (
                          <Button size="sm" variant="secondary" onClick={() => pagata(c, true)}>
                            Pagata
                          </Button>
                        )}
                        {c.stato === "PAGATA" && (
                          <Button size="sm" variant="ghost" onClick={() => pagata(c, false)}>
                            Annulla pagamento
                          </Button>
                        )}
                        {c.stato === "IN_NEGOZIO" && (
                          <button
                            type="button"
                            onClick={() => elimina(c)}
                            className="rounded-full p-2 text-ink-muted transition hover:bg-magenta-soft hover:text-magenta-ink"
                            aria-label={`Togli la copia ${c.codice}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {etichette && <FogliEtichette etichette={etichette} misura={pref} />}
      <VenditoreModal open={modifica} venditore={v} onClose={() => setModifica(false)} onSaved={setAggiornato} />
      {dialog}
    </>
  );
}

/** Il libro letto e i due prezzi che vengono dalle percentuali, aggiornati mentre si scrive (come li calcola il server). */
function Anteprima({ libro, sconto, acquisto }: { libro: LibroLetto; sconto: number | null; acquisto: number | null }) {
  const vendita = sconto === null ? null : arrotonda(libro.prezzo * (1 - sconto / 100));
  const alVenditore = acquisto === null ? null : arrotonda((libro.prezzo * acquisto) / 100);
  return (
    <div className="grid gap-px overflow-hidden rounded-2xl border border-paper-line bg-paper-line sm:grid-cols-[minmax(0,2fr)_1fr_1fr] lg:col-span-4">
      <div className="bg-white px-5 py-3">
        <p className="font-bold leading-snug">{libro.titolo}</p>
        <p className="text-sm text-ink-muted">
          {libro.editore} · vol. {libro.volume} · copertina <strong className="text-ink">{formatPrice(libro.prezzo)}</strong>
        </p>
      </div>
      <div className="bg-brand-50 px-5 py-3">
        <p className="text-sm font-semibold text-ink-muted">Lo vendi a</p>
        <p className="text-2xl font-extrabold tabular-nums text-brand-800">{vendita === null ? "–" : formatPrice(vendita)}</p>
      </div>
      <div className="bg-orange-soft px-5 py-3">
        <p className="text-sm font-semibold text-ink-muted">Dai al venditore</p>
        <p className="text-2xl font-extrabold tabular-nums text-orange-ink">{alVenditore === null ? "–" : formatPrice(alVenditore)}</p>
      </div>
    </div>
  );
}

function Percentuale({
  label,
  valore,
  onCambia,
  campo,
}: {
  label: string;
  valore: string;
  onCambia: (v: string) => void;
  campo?: React.Ref<HTMLInputElement>;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink-soft">{label}</span>
      <span className="flex items-center gap-2">
        <input
          ref={campo}
          value={valore}
          onChange={(e) => onCambia(e.target.value.replace(/[^\d,.]/g, "").slice(0, 5))}
          inputMode="decimal"
          placeholder="50"
          className="w-full rounded-xl border border-paper-line bg-white px-3 py-2.5 text-right text-base font-bold tabular-nums focus:border-brand-500 focus:outline-none"
        />
        <span className="font-bold">%</span>
      </span>
    </label>
  );
}

function Cifra({ label, valore, forte }: { label: string; valore: string; forte?: boolean }) {
  return (
    <div className={cn("bg-white px-5 py-4", forte && "bg-brand-50")}>
      <span className="block text-sm font-semibold text-ink-muted">{label}</span>
      <span className={cn("mt-1 block text-xl font-extrabold tabular-nums", forte && "text-2xl text-brand-800")}>{valore}</span>
    </div>
  );
}
