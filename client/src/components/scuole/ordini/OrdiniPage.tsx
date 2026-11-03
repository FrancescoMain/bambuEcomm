"use client";

import Link from "next/link";
import { useState } from "react";
import { Download, PackageCheck, Printer, Truck } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/admin/PageTitle";
import { Callout } from "@/components/admin/ops/Callout";
import { useAsync } from "@/components/admin/ops/useAsync";
import { useQueryParams } from "@/components/admin/ops/useQueryParams";
import { pluralize } from "@/components/admin/catalog/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Spinner";
import { errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import { cn } from "@/lib/cn";
import { formatDate, formatPrice } from "@/lib/format";
import { anniDisponibili, type DaOrdinare, type Ordine, type OrdineRiepilogo, type RigaInOrdine } from "../types";
import { OrdineView } from "./OrdineView";
import { PerIlNegozio, useCopieNegozio } from "./PerIlNegozio";
import { StampaOrdine } from "./StampaOrdine";
import { perCodice, scaricaCsv, useStampa } from "./utils";

const VISTE = [
  { id: "da", label: "Da ordinare" },
  { id: "fatti", label: "Ordini fatti" },
  { id: "in", label: "Ancora in ordine" },
] as const;
type Vista = (typeof VISTE)[number]["id"];

/** Sezione Ordini: i libri prenotati si ordinano al fornitore e diventano «Confermato». */
export function OrdiniPage() {
  const [params, setParams] = useQueryParams();
  const vista = (VISTE.find((v) => v.id === params.get("vista"))?.id ?? "da") as Vista;
  const ordineId = Number(params.get("ordine")) || null;

  if (ordineId) {
    return <OrdineView key={ordineId} ordineId={ordineId} onBack={() => setParams({ ordine: null })} />;
  }

  return (
    <div>
      <PageTitle title="Ordini" description="I libri prenotati dai clienti si ordinano al fornitore: nell'ordine diventano «Confermato»." />
      <div className="mb-5 flex flex-wrap gap-2">
        {VISTE.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setParams({ vista: v.id === "da" ? null : v.id })}
            className={cn(
              "rounded-xl border px-4 py-2 text-[15px] font-bold transition",
              vista === v.id ? "border-ink bg-ink text-white" : "border-paper-line bg-white text-ink-soft hover:bg-paper-warm"
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
      {vista === "da" && <DaOrdinareVista onCreato={(id) => setParams({ ordine: id, vista: null }, "push")} />}
      {vista === "fatti" && <OrdiniFatti onApri={(id) => setParams({ ordine: id }, "push")} />}
      {vista === "in" && <AncoraInOrdine />}
    </div>
  );
}

// ── Da ordinare ──

function DaOrdinareVista({ onCreato }: { onCreato: (ordineId: number) => void }) {
  const libri = useAsync(() => api<DaOrdinare[]>("/libri/ordini/da-ordinare"), []);
  // Si tengono i codici esclusi, così un libro prenotato nel frattempo entra già spuntato
  const [esclusi, setEsclusi] = useState<ReadonlySet<string>>(new Set());
  const [lavoro, setLavoro] = useState(false);
  const [negozio, setNegozio] = useCopieNegozio();

  if (libri.error) return <Callout tone="danger">{libri.error}</Callout>;
  if (!libri.data) return <Skeleton className="h-64" />;

  const scelti = libri.data.filter((l) => !esclusi.has(l.isbn));
  const daOrdinare = scelti.reduce((t, l) => t + l.daOrdinare, 0);
  const giaInOrdine = scelti.reduce((t, l) => t + l.giaInOrdine, 0);
  const perNegozio = negozio.reduce((t, c) => t + c.quantita, 0);
  const copie = daOrdinare + perNegozio;
  const totale = scelti.reduce((t, l) => t + l.prezzo * l.daOrdinare, 0) + negozio.reduce((t, c) => t + c.prezzo * c.quantita, 0);
  const tutti = esclusi.size === 0;

  const inverti = (isbn: string) =>
    setEsclusi((s) => {
      const n = new Set(s);
      if (n.has(isbn)) n.delete(isbn);
      else n.add(isbn);
      return n;
    });

  const crea = async () => {
    setLavoro(true);
    try {
      const esito = await api<{ ordine: Ordine | null; abbinati: number; ordinati: number; perNegozio: number }>("/libri/ordini", {
        method: "POST",
        body: { ...(tutti ? {} : { isbn: scelti.map((l) => l.isbn) }), negozio: negozio.map(({ isbn, quantita }) => ({ isbn, quantita })) },
      });
      setNegozio([]);
      const abbinati = esito.abbinati ? ` ${pluralize(esito.abbinati, "copia già in ordine assegnata", "copie già in ordine assegnate")}.` : "";
      const delNegozio = esito.perNegozio ? `, di cui ${esito.perNegozio} per il negozio` : "";
      if (esito.ordine) {
        toast.success(
          `Ordine n. ${esito.ordine.numero}: ${pluralize(esito.ordinati + esito.perNegozio, "copia", "copie")}${delNegozio}.${abbinati} Ora scarica il CSV per il fornitore.`
        );
        onCreato(esito.ordine.id);
      } else {
        toast.success(abbinati.trim());
        setEsclusi(new Set());
        libri.reload();
      }
    } catch (e) {
      toast.error(errorMessage(e));
      libri.reload();
    } finally {
      setLavoro(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center gap-x-6 gap-y-3 p-4 sm:px-5">
        <p className="text-[15px]">
          <strong className="text-2xl font-extrabold tabular-nums">{copie}</strong> {copie === 1 ? "copia" : "copie"} da ordinare
          {perNegozio > 0 && <span className="text-ink-muted"> · {perNegozio} per il negozio</span>}
          {giaInOrdine > 0 && <span className="text-ink-muted"> · {giaInOrdine} già in ordine, libere</span>}
          <span className="text-ink-muted"> · {formatPrice(totale)}</span>
        </p>
        <span className="flex-1" />
        <Button size="lg" onClick={crea} disabled={lavoro || (!copie && !giaInOrdine)}>
          <Truck className="h-5 w-5" />
          {copie ? `Crea l'ordine (${pluralize(copie, "copia", "copie")})` : `Assegna le copie già in ordine (${giaInOrdine})`}
        </Button>
      </div>
      {!libri.data.length ? (
        <EmptyState
          icon={<PackageCheck className="h-7 w-7" />}
          title="Nessun libro prenotato da ordinare"
          text="Tutti i libri prenotati sono già in un ordine. Quando un cliente prenota un libro, compare qui."
          className="card"
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-base">
            <thead className="border-b border-paper-line bg-paper/60 text-sm font-bold uppercase tracking-wide text-ink-muted">
              <tr>
                <th scope="col" className="w-[60px] py-3 pl-5 pr-2">
                  <input
                    type="checkbox"
                    checked={tutti}
                    onChange={() => setEsclusi(tutti ? new Set(libri.data!.map((l) => l.isbn)) : new Set())}
                    aria-label={tutti ? "Togli tutti" : "Scegli tutti"}
                    className="h-6 w-6 cursor-pointer accent-brand-600"
                  />
                </th>
                <th scope="col" className="px-2 py-3">Codice</th>
                <th scope="col" className="px-2 py-3">Titolo e autori</th>
                <th scope="col" className="px-2 py-3">Editore</th>
                <th scope="col" className="px-2 py-3">Vol.</th>
                <th scope="col" className="px-2 py-3 text-right">Prezzo</th>
                <th scope="col" className="px-2 py-3 text-right">Prenotati</th>
                <th scope="col" className="py-3 pl-2 pr-5 text-right">Da ordinare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {libri.data.map((l) => {
                const scelto = !esclusi.has(l.isbn);
                return (
                  <tr key={l.isbn} onClick={() => inverti(l.isbn)} className={cn("cursor-pointer align-top hover:bg-paper/60", !scelto && "text-ink-muted")}>
                    <td className="py-3 pl-5 pr-2">
                      <input
                        type="checkbox"
                        checked={scelto}
                        onChange={() => inverti(l.isbn)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Ordina ${l.titolo}`}
                        className="h-6 w-6 cursor-pointer accent-brand-600"
                      />
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 font-mono text-sm">{l.isbn}</td>
                    <td className="px-2 py-3">
                      <span className={cn("block font-semibold leading-snug", scelto && "text-ink")}>{l.titolo}</span>
                      <span className="block text-sm text-ink-muted">{l.autori}</span>
                    </td>
                    <td className="w-[150px] px-2 py-3 text-sm">{l.editore}</td>
                    <td className="px-2 py-3 text-lg font-bold">{l.volume}</td>
                    <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums">{formatPrice(l.prezzo)}</td>
                    <td className="px-2 py-3 text-right tabular-nums">
                      {l.prenotati}
                      {l.giaInOrdine > 0 && <span className="block text-xs text-ink-muted">{l.giaInOrdine} già in ordine</span>}
                      {l.inNegozio > 0 && (
                        <span className="block text-xs font-bold text-leaf-ink" title="Dalli dalla scheda del cliente con «Dai dal negozio»">
                          {l.inNegozio} in negozio
                        </span>
                      )}
                    </td>
                    <td className="py-3 pl-2 pr-5 text-right text-xl font-extrabold tabular-nums">{l.daOrdinare}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <PerIlNegozio copie={negozio} onChange={setNegozio} />
    </div>
  );
}

// ── Ordini fatti ──

function OrdiniFatti({ onApri }: { onApri: (ordineId: number) => void }) {
  const [anno, setAnno] = useState(new Date().getFullYear());
  const ordini = useAsync(() => api<OrdineRiepilogo[]>("/libri/ordini", { query: { anno } }), [anno]);

  return (
    <div className="space-y-4">
      <div className="w-32">
        <Select label="Anno" value={anno} onChange={(e) => setAnno(Number(e.target.value))}>
          {anniDisponibili().map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      </div>
      {ordini.error ? (
        <Callout tone="danger">{ordini.error}</Callout>
      ) : !ordini.data ? (
        <Skeleton className="h-64" />
      ) : !ordini.data.length ? (
        <EmptyState icon={<Truck className="h-7 w-7" />} title={`Nessun ordine nel ${anno}`} text="Gli ordini si creano da «Da ordinare»." className="card" />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-base">
            <thead className="border-b border-paper-line bg-paper/60 text-sm font-bold uppercase tracking-wide text-ink-muted">
              <tr>
                <th scope="col" className="py-3 pl-5 pr-2">N.</th>
                <th scope="col" className="px-2 py-3">Data</th>
                <th scope="col" className="px-2 py-3 text-right">Copie</th>
                <th scope="col" className="px-2 py-3 text-right">Arrivate</th>
                <th scope="col" className="px-2 py-3 text-right">Totale</th>
                <th scope="col" className="py-3 pl-4 pr-5">Appunti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {ordini.data.map((o) => (
                <tr key={o.id} onClick={() => onApri(o.id)} className="cursor-pointer align-top transition hover:bg-paper/60">
                  <td className="py-3 pl-5 pr-2 font-bold tabular-nums">{o.numero}</td>
                  <td className="px-2 py-3">{formatDate(o.data)}</td>
                  <td className="px-2 py-3 text-right tabular-nums">
                    {o.copie}
                    {o.libere > 0 && <span className="block text-xs font-semibold text-orange-ink">{o.libere} per il negozio</span>}
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums">{o.arrivate}</td>
                  <td className="whitespace-nowrap px-2 py-3 text-right font-bold tabular-nums">{formatPrice(o.totale)}</td>
                  <td className="py-3 pl-4 pr-5 text-sm text-ink-muted">{o.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Ancora in ordine ──

/** Tutte le copie ordinate e non ancora arrivate: da stampare o ri-esportare (risposta 6 del negozio). */
function AncoraInOrdine() {
  const righe = useAsync(() => api<RigaInOrdine[]>("/libri/ordini/in-ordine"), []);
  const [stampa, stampaOra] = useStampa();

  if (righe.error) return <Callout tone="danger">{righe.error}</Callout>;
  if (!righe.data) return <Skeleton className="h-64" />;
  if (!righe.data.length) {
    return <EmptyState icon={<PackageCheck className="h-7 w-7" />} title="Nessun libro in ordine" text="Tutte le copie ordinate sono arrivate." className="card" />;
  }

  const gruppi = perCodice(righe.data);
  const perChi = new Map<string, RigaInOrdine[]>();
  for (const r of righe.data) perChi.set(r.isbn, [...(perChi.get(r.isbn) ?? []), r]);
  const oggi = new Date().toISOString();

  return (
    <>
      <div className="card overflow-hidden print:hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-paper-line p-4 sm:px-5">
          <p className="text-[15px]">
            <strong className="text-2xl font-extrabold tabular-nums">{righe.data.length}</strong> copie ordinate e non ancora arrivate ·{" "}
            {pluralize(gruppi.length, "titolo", "titoli")}
          </p>
          <span className="flex-1" />
          <Button variant="secondary" onClick={stampaOra}>
            <Printer className="h-4 w-4" /> Stampa
          </Button>
          <Button variant="secondary" onClick={() => scaricaCsv(`ancora-in-ordine-${oggi.slice(0, 10)}.csv`, gruppi)}>
            <Download className="h-4 w-4" /> Scarica CSV
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-base">
            <thead className="border-b border-paper-line bg-paper/60 text-sm font-bold uppercase tracking-wide text-ink-muted">
              <tr>
                <th scope="col" className="py-3 pl-5 pr-2">Codice</th>
                <th scope="col" className="px-2 py-3">Titolo e autori</th>
                <th scope="col" className="px-2 py-3">Vol.</th>
                <th scope="col" className="px-2 py-3 text-right">Q.tà</th>
                <th scope="col" className="py-3 pl-4 pr-5">Per chi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {gruppi.map((g) => (
                <tr key={g.isbn} className="align-top">
                  <td className="whitespace-nowrap py-3 pl-5 pr-2 font-mono text-sm">{g.isbn}</td>
                  <td className="px-2 py-3">
                    <span className="block font-semibold leading-snug">{g.titolo}</span>
                    <span className="block text-sm text-ink-muted">
                      {g.editore} · ordine {g.ordini.map((n) => `n. ${n}`).join(", ")}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-lg font-bold">{g.volume}</td>
                  <td className="px-2 py-3 text-right text-xl font-extrabold tabular-nums">{g.quantita}</td>
                  <td className="py-3 pl-4 pr-5 text-sm">
                    <PerChi righe={perChi.get(g.isbn) ?? []} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {stampa && <StampaOrdine titolo="Libri ancora in ordine (ordinati e non arrivati)" data={oggi} righe={gruppi} conOrdini />}
    </>
  );
}

/** I clienti a cui vanno le copie, con il link alla scheda; le copie senza cliente sono «per il negozio» (libere). */
export function PerChi({ righe }: { righe: { id: number; libro: { scheda: { id: number; numero: number; cognome: string; nome: string } } | null }[] }) {
  const libere = righe.filter((r) => !r.libro).length;
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {righe.map(
        (r) =>
          r.libro && (
            <Link key={r.id} href={`/scuole/clienti?scheda=${r.libro.scheda.id}`} className="font-semibold text-brand-700 hover:underline">
              {r.libro.scheda.cognome} {r.libro.scheda.nome}{" "}
              <span className="whitespace-nowrap font-normal text-ink-muted">n. {r.libro.scheda.numero}</span>
            </Link>
          )
      )}
      {libere > 0 && <span className="rounded-full bg-orange-soft px-2.5 py-0.5 font-bold text-orange-ink">{libere} per il negozio</span>}
    </span>
  );
}
