"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Printer, ScanLine, StickyNote, Tag, Trash2, UserRound, Warehouse, X } from "lucide-react";
import { toast } from "sonner";
import { Callout } from "@/components/admin/ops/Callout";
import { useAsync } from "@/components/admin/ops/useAsync";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Spinner";
import { ApiError, errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import { cn } from "@/lib/cn";
import { formatDateTime, formatPrice } from "@/lib/format";
import { FogliEtichette, SceltaMisura, usePreferenzeEtichette, useStampaEtichette, type Etichetta } from "../Etichette";
import { LibroModal } from "../LibroModal";
import { useStampa } from "../ordini/utils";
import type { Bolla, RigaBolla } from "../types";
import { StampaBolla } from "./StampaBolla";

type Arrivo = { riga: RigaBolla; bolla: Bolla };

/** L'etichetta da attaccare al libro arrivato per un cliente (codice, cognome, nome, telefono) */
const etichetta = (r: RigaBolla): Etichetta[] =>
  r.libro ? [{ chiave: r.id, isbn: r.isbn, cognome: r.libro.scheda.cognome, nome: r.libro.scheda.nome, telefono: r.libro.scheda.telefono }] : [];

/**
 * Una bolla di arrivo: si legge ogni libro col lettore (una copia per lettura) e si vede subito, in grande, dove
 * va: al cliente che lo aspetta (da mettere da parte col suo nome) o in Magazzino.
 */
export function BollaView({ bollaId, onBack }: { bollaId: number; onBack: () => void }) {
  const caricata = useAsync(() => api<Bolla>(`/libri/bolle/${bollaId}`), [bollaId]);
  const [aggiornata, setAggiornata] = useState<Bolla | null>(null);
  const bolla = aggiornata ?? caricata.data;
  const [codice, setCodice] = useState("");
  const [leggendo, setLeggendo] = useState(false);
  const [ultimo, setUltimo] = useState<RigaBolla | null>(null);
  const [sconosciuto, setSconosciuto] = useState<string | null>(null);
  const [ddt, setDdt] = useState("");
  const [appunti, setAppunti] = useState("");
  const [nascoste, setNascoste] = useState<ReadonlySet<number>>(new Set());
  const [stampa, stampaOra] = useStampa();
  const lettore = useRef<HTMLInputElement>(null);
  const [pref, cambiaPref] = usePreferenzeEtichette();
  const [etichette, stampaEtichette] = useStampaEtichette(() => lettore.current?.focus());

  useEffect(() => setAggiornata(null), [caricata.data]);
  useEffect(() => setDdt(bolla?.numeroFornitore ?? ""), [bolla?.numeroFornitore]);
  useEffect(() => setAppunti(bolla?.note ?? ""), [bolla?.note]);

  const arrivato = (a: Arrivo) => {
    setAggiornata(a.bolla);
    setUltimo(a.riga);
    // Come «abilita stampa» di GS_MAG: l'etichetta esce subito, solo per i libri dei clienti
    if (pref.automatica) stampaEtichette(etichetta(a.riga));
  };

  const leggi = async (e: React.FormEvent) => {
    e.preventDefault();
    const isbn = codice.trim();
    if (!isbn || leggendo) return;
    setLeggendo(true);
    try {
      arrivato(await api<Arrivo>(`/libri/bolle/${bollaId}/righe`, { method: "POST", body: { isbn } }));
      setCodice("");
    } catch (err) {
      setCodice("");
      if (err instanceof ApiError && err.status === 404 && err.data?.daCompilare) setSconosciuto(isbn);
      else toast.error(errorMessage(err));
    } finally {
      setLeggendo(false);
      lettore.current?.focus();
    }
  };

  const salva = async (campo: "numeroFornitore" | "note", valore: string) => {
    if (!bolla || valore.trim() === bolla[campo]) return;
    try {
      setAggiornata(await api<Bolla>(`/libri/bolle/${bollaId}`, { method: "PATCH", body: { [campo]: valore } }));
      toast.success("Salvato.");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  // Come per le righe d'ordine: niente conferma, la riga sparisce e l'arrivo si annulla se non si preme «Annulla»
  const annulla = (r: RigaBolla) => {
    const mostra = () =>
      setNascoste((s) => {
        const n = new Set(s);
        n.delete(r.id);
        return n;
      });
    setNascoste((s) => new Set(s).add(r.id));
    if (ultimo?.id === r.id) setUltimo(null);
    let deciso = false;
    const esegui = async () => {
      if (deciso) return;
      deciso = true;
      try {
        setAggiornata(await api<Bolla>(`/libri/bolle/${bollaId}/righe/${r.id}`, { method: "DELETE" }));
      } catch (err) {
        mostra();
        toast.error(errorMessage(err));
      }
    };
    const dove = r.libro ? `Torna in attesa per ${r.libro.scheda.cognome} ${r.libro.scheda.nome}.` : "Esce dal Magazzino.";
    toast(`Arrivo di «${r.titolo}» annullato. ${dove}`, {
      duration: 5000,
      action: {
        label: "Annulla",
        onClick: () => {
          if (deciso) return;
          deciso = true;
          mostra();
        },
      },
      onAutoClose: esegui,
      onDismiss: esegui,
    });
  };

  const elimina = async () => {
    try {
      await api(`/libri/bolle/${bollaId}`, { method: "DELETE" });
      toast.success("Bolla eliminata.");
      onBack();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (caricata.error) return <Callout tone="danger">{caricata.error}</Callout>;
  if (!bolla) return <Skeleton className="h-96" />;

  const righe = bolla.righe.filter((r) => !nascoste.has(r.id));
  const aClienti = righe.filter((r) => r.destinazione === "CLIENTE").length;
  const tutteLeEtichette = [...righe].reverse().flatMap(etichetta);
  const totale = righe.reduce((t, r) => t + Number(r.prezzo), 0);

  return (
    <>
      <div className="space-y-4 print:hidden">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-[15px] font-semibold text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Bolle
        </button>

        <section className="card overflow-hidden">
          <header className="flex flex-col gap-4 border-b border-paper-line p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-muted">
                {bolla.anno} · <span className="font-mono">{bolla.barcode}</span>
              </p>
              <h2 className="text-2xl font-extrabold">Bolla n. {bolla.numero}</h2>
              <p className="text-[15px] text-ink-soft">Creata il {formatDateTime(bolla.data)}</p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-ink-soft">N. DDT del fornitore</span>
                <input
                  value={ddt}
                  onChange={(e) => setDdt(e.target.value)}
                  onBlur={() => salva("numeroFornitore", ddt)}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  maxLength={100}
                  className="w-48 rounded-xl border border-paper-line bg-white px-3 py-2 text-base focus:border-brand-500 focus:outline-none"
                />
              </label>
              <Button variant="secondary" onClick={stampaOra} disabled={!righe.length}>
                <Printer className="h-4 w-4" /> Stampa
              </Button>
              <Button variant="outline" onClick={elimina} disabled={righe.length > 0} aria-label="Elimina bolla" title="Si elimina solo una bolla vuota">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <label className="flex items-start gap-3 border-b border-paper-line px-4 py-3 sm:px-5">
            <StickyNote className="mt-2 h-5 w-5 shrink-0 text-ink-muted" />
            <textarea
              value={appunti}
              onChange={(e) => setAppunti(e.target.value)}
              onBlur={() => salva("note", appunti)}
              rows={appunti.includes("\n") ? 3 : 1}
              maxLength={1000}
              placeholder="Appunti sulla bolla (colli, mancanti…)"
              aria-label="Appunti sulla bolla"
              className="w-full resize-y rounded-lg border border-transparent bg-paper/60 px-3 py-2 text-[15px] hover:border-paper-line focus:border-brand-500 focus:bg-white focus:outline-none"
            />
          </label>

          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <form onSubmit={leggi}>
              <label htmlFor="lettore-bolla" className="mb-1.5 block text-sm font-semibold text-ink-soft">
                Leggi i libri arrivati (una copia per lettura)
              </label>
              <div className="relative">
                <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 text-brand-600" />
                <input
                  id="lettore-bolla"
                  ref={lettore}
                  value={codice}
                  onChange={(e) => setCodice(e.target.value)}
                  placeholder="Codice e Invio"
                  inputMode="numeric"
                  autoFocus
                  autoComplete="off"
                  // Sola lettura e non disattivata: una casella disattivata perde il cursore e la lettura dopo andrebbe persa
                  readOnly={leggendo}
                  className="w-full rounded-xl border-2 border-brand-200 bg-white py-3.5 pl-12 pr-3 font-mono text-lg focus:border-brand-500 focus:outline-none"
                />
              </div>
            </form>
            <Destinazione riga={ultimo} />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[15px] lg:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 font-semibold">
                <input
                  type="checkbox"
                  checked={pref.automatica}
                  onChange={(e) => cambiaPref({ automatica: e.target.checked })}
                  className="h-5 w-5 accent-brand-600"
                />
                Stampa l&apos;etichetta a ogni libro per un cliente
              </label>
              <SceltaMisura misura={pref} onCambia={cambiaPref} />
              <Button size="sm" variant="secondary" onClick={() => stampaEtichette(tutteLeEtichette)} disabled={!tutteLeEtichette.length}>
                <Tag className="h-4 w-4" /> Stampa tutte le etichette ({tutteLeEtichette.length})
              </Button>
            </div>
          </div>

          <div className="grid gap-px border-t border-paper-line bg-paper-line sm:grid-cols-4">
            <Cifra label="Copie arrivate" valore={String(righe.length)} />
            <Cifra label="Ai clienti" valore={String(aClienti)} />
            <Cifra label="In Magazzino" valore={String(righe.length - aClienti)} />
            <Cifra label="Totale a prezzo di copertina" valore={formatPrice(totale)} forte />
          </div>

          {righe.length > 0 && (
            <div className="overflow-x-auto border-t border-paper-line">
              <table className="w-full min-w-[1000px] text-left text-base">
                <thead className="border-b border-paper-line bg-paper/60 text-sm font-bold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th scope="col" className="py-3 pl-5 pr-2">Codice</th>
                    <th scope="col" className="px-2 py-3">Titolo e autori</th>
                    <th scope="col" className="px-2 py-3">Vol.</th>
                    <th scope="col" className="px-2 py-3 text-right">Prezzo</th>
                    <th scope="col" className="px-2 py-3">Dove va</th>
                    <th scope="col" className="px-2 py-3">Ordine</th>
                    <th scope="col" className="py-3 pl-2 pr-5" aria-label="Azioni" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-line">
                  {righe.map((r) => (
                    <tr key={r.id} className={cn("align-top", ultimo?.id === r.id && "bg-brand-50")}>
                      <td className="whitespace-nowrap py-3 pl-5 pr-2 font-mono text-sm">{r.isbn}</td>
                      <td className="px-2 py-3">
                        <span className="block font-semibold leading-snug">{r.titolo}</span>
                        <span className="block text-sm text-ink-muted">
                          {r.autori} · {r.editore}
                        </span>
                      </td>
                      <td className="px-2 py-3 text-lg font-bold">{r.volume}</td>
                      <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums">{formatPrice(r.prezzo)}</td>
                      <td className="px-2 py-3">
                        <DoveVa riga={r} />
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-sm">
                        {r.ordineRiga ? `n. ${r.ordineRiga.ordine.numero}` : <span className="text-ink-muted">fuori ordine</span>}
                      </td>
                      <td className="whitespace-nowrap py-2 pl-2 pr-5 text-right">
                        {r.libro && (
                          <button
                            type="button"
                            onClick={() => stampaEtichette(etichetta(r))}
                            className="rounded-full p-2 text-ink-muted transition hover:bg-paper-warm hover:text-ink"
                            aria-label={`Stampa l'etichetta di ${r.titolo}`}
                            title="Stampa l'etichetta"
                          >
                            <Tag className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => annulla(r)}
                          className="rounded-full p-2 text-ink-muted transition hover:bg-magenta-soft hover:text-magenta-ink"
                          aria-label={`Annulla l'arrivo di ${r.titolo}`}
                          title="Annulla l'arrivo (letto per sbaglio)"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {stampa && !etichette && <StampaBolla bolla={{ ...bolla, righe }} />}
      {etichette && <FogliEtichette etichette={etichette} misura={pref} />}

      <LibroModal
        open={sconosciuto !== null}
        percorso={`/libri/bolle/${bollaId}/righe`}
        libro={null}
        isbnIniziale={sconosciuto ?? ""}
        onClose={() => {
          setSconosciuto(null);
          setTimeout(() => lettore.current?.focus(), 0);
        }}
        onSaved={(r) => {
          arrivato(r as Arrivo);
          setSconosciuto(null);
          setTimeout(() => lettore.current?.focus(), 0);
        }}
      />
    </>
  );
}

/** Il libro appena letto, in grande: a chi va (da mettere da parte col suo nome) o in Magazzino. */
function Destinazione({ riga }: { riga: RigaBolla | null }) {
  if (!riga) {
    return (
      <div className="flex items-center rounded-2xl border-2 border-dashed border-paper-line px-5 py-4 text-[15px] text-ink-muted">
        Qui compare dove va ogni libro letto: al cliente che lo aspetta o in Magazzino.
      </div>
    );
  }
  const cliente = riga.libro?.scheda;
  return (
    <div className={cn("flex items-center gap-4 rounded-2xl px-5 py-4", cliente ? "bg-brand-100 text-brand-900" : "bg-sky-soft text-sky-ink")}>
      {cliente ? <UserRound className="h-9 w-9 shrink-0" /> : <Warehouse className="h-9 w-9 shrink-0" />}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">
          {riga.titolo} · vol. {riga.volume}
        </p>
        {cliente ? (
          <p className="text-2xl font-extrabold leading-tight">
            {cliente.cognome} {cliente.nome}
            <span className="ml-2 text-lg font-bold">
              scheda n. {cliente.numero} · {cliente.classe}
            </span>
          </p>
        ) : (
          <p className="text-2xl font-extrabold leading-tight">In Magazzino</p>
        )}
      </div>
    </div>
  );
}

function DoveVa({ riga }: { riga: RigaBolla }) {
  if (riga.destinazione === "MAGAZZINO") return <span className="rounded-full bg-sky-soft px-3 py-1 text-sm font-bold text-sky-ink">Magazzino</span>;
  if (!riga.libro) return <span className="text-sm text-ink-muted">Cliente (scheda eliminata)</span>;
  const s = riga.libro.scheda;
  return (
    <Link href={`/scuole/clienti?scheda=${s.id}`} className="font-semibold text-brand-700 hover:underline">
      {s.cognome} {s.nome} <span className="whitespace-nowrap font-normal text-ink-muted">n. {s.numero}</span>
      {riga.libro.stato === "RITIRATO" && <span className="ml-2 text-xs font-bold text-ink-muted">ritirato</span>}
    </Link>
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
