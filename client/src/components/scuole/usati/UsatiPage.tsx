"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Plus, ScanLine, Search, Tag, UserRound, Users, Warehouse } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/admin/PageTitle";
import { Callout } from "@/components/admin/ops/Callout";
import { useAsync } from "@/components/admin/ops/useAsync";
import { useQueryParams } from "@/components/admin/ops/useQueryParams";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import { cn } from "@/lib/cn";
import { formatDate, formatPrice } from "@/lib/format";
import { etichettaCliente, FogliEtichette, usePreferenzeEtichette, useStampaEtichette } from "../Etichette";
import type { CopiaUsata, VenditoreRiepilogo } from "../types";
import { VenditoreModal } from "./VenditoreModal";
import { VenditoreView } from "./VenditoreView";

const VISTE = [
  { id: "venditori", label: "Venditori" },
  { id: "assegna", label: "Assegna ai clienti" },
  { id: "negozio", label: "In negozio" },
] as const;
type Vista = (typeof VISTE)[number]["id"];

/**
 * Libri usati (chiamata col negozio del 3 nov 2026): si comprano al banco in conto vendita da chi li porta, ogni copia
 * ha un codice nostro sull'etichetta, la sera si leggono e vanno ai clienti che aspettano l'usato.
 */
export function UsatiPage() {
  const [params, setParams] = useQueryParams();
  const vista = (VISTE.find((v) => v.id === params.get("vista"))?.id ?? "venditori") as Vista;
  const venditoreId = Number(params.get("venditore")) || null;

  if (venditoreId) return <VenditoreView key={venditoreId} venditoreId={venditoreId} onBack={() => setParams({ venditore: null })} />;

  return (
    <div>
      {/* In stampa resta solo l'etichetta, quando se ne stampa una */}
      <div className="print:hidden">
        <PageTitle
          title="Usati"
          description="Libri comprati al banco in conto vendita: si paga chi li porta solo quando la copia è venduta."
          actions={<GiorniAttesa />}
        />
      </div>
      <div className="mb-5 flex flex-wrap gap-2 print:hidden">
        {VISTE.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setParams({ vista: v.id === "venditori" ? null : v.id })}
            className={cn(
              "rounded-xl border px-4 py-2 text-[15px] font-bold transition",
              vista === v.id ? "border-ink bg-ink text-white" : "border-paper-line bg-white text-ink-soft hover:bg-paper-warm"
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
      {vista === "venditori" && <Venditori onApri={(id) => setParams({ venditore: id }, "push")} />}
      {vista === "assegna" && <Assegna />}
      {vista === "negozio" && <InNegozio />}
    </div>
  );
}

/** Dopo quanti giorni chi aspetta l'usato si ordina nuovo (compare in «Da ordinare»). */
function GiorniAttesa() {
  const caricati = useAsync(() => api<{ giorniAttesa: number }>("/libri/usati/impostazioni"), []);
  const [giorni, setGiorni] = useState("");
  useEffect(() => {
    if (caricati.data) setGiorni(String(caricati.data.giorniAttesa));
  }, [caricati.data]);

  const salva = async () => {
    if (!caricati.data || giorni === String(caricati.data.giorniAttesa)) return;
    try {
      await api("/libri/usati/impostazioni", { method: "PUT", body: { giorniAttesa: Number(giorni) } });
      toast.success(`Chi aspetta l'usato si ordina nuovo dopo ${giorni} giorni.`);
      caricati.reload();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <label className="flex items-center gap-2 text-[15px] font-semibold text-ink-soft">
      Attesa dell&apos;usato
      <input
        value={giorni}
        onChange={(e) => setGiorni(e.target.value.replace(/\D/g, "").slice(0, 3))}
        onBlur={salva}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
        inputMode="numeric"
        aria-label="Giorni di attesa dell'usato"
        className="w-16 rounded-xl border border-paper-line bg-white px-2 py-2 text-center text-base font-bold tabular-nums focus:border-brand-500 focus:outline-none"
      />
      giorni, poi si ordina nuovo
    </label>
  );
}

// ── Venditori ──

function Venditori({ onApri }: { onApri: (id: number) => void }) {
  const [testo, setTesto] = useState("");
  const [q, setQ] = useState("");
  const [nuovo, setNuovo] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setQ(testo.trim()), 250);
    return () => clearTimeout(t);
  }, [testo]);
  const venditori = useAsync(() => api<VenditoreRiepilogo[]>("/libri/usati/venditori", { query: { q } }), [q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="relative w-full max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
          <input
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            placeholder="Cerca per cognome, nome o telefono"
            aria-label="Cerca un venditore"
            autoFocus
            className="w-full rounded-xl border border-paper-line bg-white py-2.5 pl-10 pr-3 text-base focus:border-brand-500 focus:outline-none"
          />
        </span>
        <Button onClick={() => setNuovo(true)}>
          <Plus className="h-4 w-4" /> Nuovo venditore
        </Button>
      </div>
      {venditori.error ? (
        <Callout tone="danger">{venditori.error}</Callout>
      ) : !venditori.data ? (
        <Skeleton className="h-64" />
      ) : !venditori.data.length ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title={q ? "Nessun venditore trovato" : "Nessun venditore"}
          text="Quando qualcuno porta libri usati, crea la sua scheda e leggi i libri che lascia."
          action={<Button onClick={() => setNuovo(true)}>Nuovo venditore</Button>}
          className="card"
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-base">
            <thead className="border-b border-paper-line bg-paper/60 text-sm font-bold uppercase tracking-wide text-ink-muted">
              <tr>
                <th scope="col" className="py-3 pl-5 pr-2">Venditore</th>
                <th scope="col" className="px-2 py-3 text-right">Non vendute</th>
                <th scope="col" className="px-2 py-3 text-right">Vendute</th>
                <th scope="col" className="px-2 py-3 text-right">Da pagare</th>
                <th scope="col" className="py-3 pl-2 pr-5 text-right">Già pagato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {venditori.data.map((v) => (
                <tr key={v.id} onClick={() => onApri(v.id)} className="cursor-pointer align-top transition hover:bg-paper/60">
                  <td className="py-3 pl-5 pr-2">
                    <span className="block font-bold">
                      {v.cognome} {v.nome}
                    </span>
                    {v.telefono && <span className="text-sm text-ink-muted">{v.telefono}</span>}
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums">{v.conti.inNegozio}</td>
                  <td className="px-2 py-3 text-right tabular-nums">{v.conti.vendute}</td>
                  <td className={cn("whitespace-nowrap px-2 py-3 text-right tabular-nums", v.conti.daPagare > 0 && "font-extrabold text-orange-ink")}>
                    {formatPrice(v.conti.daPagare)}
                  </td>
                  <td className="whitespace-nowrap py-3 pl-2 pr-5 text-right tabular-nums text-ink-muted">{formatPrice(v.conti.pagato)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <VenditoreModal open={nuovo} venditore={null} onClose={() => setNuovo(false)} onSaved={(v) => onApri(v.id)} />
    </div>
  );
}

// ── Assegna ai clienti (la sera) ──

type Assegnazione = { copia: CopiaUsata; giaAssegnata: boolean };

/** La sera si leggono le copie comprate (il nostro codice sull'etichetta): ognuna va al primo cliente che aspetta l'usato. */
function Assegna() {
  const [codice, setCodice] = useState("");
  const [leggendo, setLeggendo] = useState(false);
  const [ultima, setUltima] = useState<Assegnazione | null>(null);
  const [lette, setLette] = useState<Assegnazione[]>([]);
  const [pref] = usePreferenzeEtichette();
  const lettore = useRef<HTMLInputElement>(null);
  const [etichette, stampaEtichette] = useStampaEtichette(() => lettore.current?.focus());

  const leggi = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = codice.trim();
    if (!c || leggendo) return;
    setLeggendo(true);
    try {
      const a = await api<Assegnazione>("/libri/usati/assegna", { method: "POST", body: { codice: c } });
      setUltima(a);
      setLette((l) => [a, ...l.filter((x) => x.copia.id !== a.copia.id)]);
      // Qui non si stampa niente da solo (richiesta del negozio, 3 nov 2026): l'etichetta, se serve, dalla riga
      setCodice("");
    } catch (err) {
      setCodice("");
      toast.error(errorMessage(err));
    } finally {
      setLeggendo(false);
      lettore.current?.focus();
    }
  };

  const cliente = ultima?.copia.libro?.scheda;
  return (
    <>
      <div className="card overflow-hidden print:hidden">
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <form onSubmit={leggi}>
            <label htmlFor="lettore-usati" className="mb-1.5 block text-sm font-semibold text-ink-soft">
              Leggi il nostro codice sull&apos;etichetta della copia
            </label>
            <span className="relative block">
              <ScanLine className="pointer-events-none absolute left-3 top-1/2 h-6 w-6 -translate-y-1/2 text-brand-600" />
              <input
                id="lettore-usati"
                ref={lettore}
                value={codice}
                onChange={(e) => setCodice(e.target.value)}
                placeholder="Codice e Invio"
                inputMode="numeric"
                autoFocus
                autoComplete="off"
                readOnly={leggendo}
                className="w-full rounded-xl border-2 border-brand-200 bg-white py-3.5 pl-12 pr-3 font-mono text-lg focus:border-brand-500 focus:outline-none"
              />
            </span>
            <p className="mt-2 text-sm text-ink-muted">Se serve l&apos;etichetta del cliente, stampala dalla riga qui sotto.</p>
          </form>
          {!ultima ? (
            <div className="flex items-center rounded-2xl border-2 border-dashed border-paper-line px-5 py-4 text-[15px] text-ink-muted">
              Qui compare a chi va ogni copia letta, oppure se resta in negozio.
            </div>
          ) : (
            <div className={cn("flex items-center gap-4 rounded-2xl px-5 py-4", cliente ? "bg-brand-100 text-brand-900" : "bg-sky-soft text-sky-ink")}>
              {cliente ? <UserRound className="h-9 w-9 shrink-0" /> : <Warehouse className="h-9 w-9 shrink-0" />}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {ultima.copia.codice} · {ultima.copia.titolo} · vol. {ultima.copia.volume}
                </p>
                {cliente ? (
                  <p className="text-2xl font-extrabold leading-tight">
                    {cliente.cognome} {cliente.nome}
                    <span className="ml-2 text-lg font-bold">
                      scheda n. {cliente.numero} · {cliente.classe}
                    </span>
                    {ultima.giaAssegnata && <span className="block text-sm font-semibold">era già sua</span>}
                  </p>
                ) : (
                  <p className="text-2xl font-extrabold leading-tight">Nessuno l&apos;aspetta: resta in negozio</p>
                )}
              </div>
            </div>
          )}
        </div>
        {lette.length > 0 && (
          <ul className="divide-y divide-paper-line border-t border-paper-line">
            {lette.map((a) => (
              <li key={a.copia.id} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-4 py-2.5 sm:px-5">
                <span className="font-mono text-sm">{a.copia.codice}</span>
                <span className="min-w-0 flex-1 font-semibold">{a.copia.titolo}</span>
                {a.copia.libro ? (
                  <span className="flex items-center gap-2">
                    <Link href={`/scuole/clienti?scheda=${a.copia.libro.scheda.id}`} className="font-semibold text-brand-700 hover:underline">
                      {a.copia.libro.scheda.cognome} {a.copia.libro.scheda.nome}
                    </Link>
                    <button
                      type="button"
                      onClick={() => a.copia.libro && stampaEtichette([etichettaCliente(`a${a.copia.id}`, a.copia.isbn, a.copia.libro.scheda)])}
                      className="rounded-full p-1.5 text-ink-muted transition hover:bg-paper-warm hover:text-ink"
                      aria-label={`Stampa l'etichetta di ${a.copia.libro.scheda.cognome} per ${a.copia.titolo}`}
                      title="Stampa l'etichetta del cliente"
                    >
                      <Tag className="h-4 w-4" />
                    </button>
                  </span>
                ) : (
                  <span className="text-ink-muted">in negozio</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {etichette && <FogliEtichette etichette={etichette} misura={pref} />}
    </>
  );
}

// ── In negozio ──

function InNegozio() {
  const copie = useAsync(() => api<(CopiaUsata & { inAttesa: number })[]>("/libri/usati/in-negozio"), []);
  if (copie.error) return <Callout tone="danger">{copie.error}</Callout>;
  if (!copie.data) return <Skeleton className="h-64" />;
  if (!copie.data.length) {
    return <EmptyState icon={<Warehouse className="h-7 w-7" />} title="Nessun usato in negozio" text="Le copie comprate al banco e non ancora date a un cliente compaiono qui." className="card" />;
  }
  const valore = copie.data.reduce((t, c) => t + Number(c.prezzoVendita), 0);
  return (
    <div className="card overflow-hidden">
      <p className="border-b border-paper-line p-4 text-[15px] sm:px-5">
        <strong className="text-2xl font-extrabold tabular-nums">{copie.data.length}</strong> copie usate in negozio
        <span className="text-ink-muted"> · in vendita per {formatPrice(valore)}</span>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-base">
          <thead className="border-b border-paper-line bg-paper/60 text-sm font-bold uppercase tracking-wide text-ink-muted">
            <tr>
              <th scope="col" className="py-3 pl-5 pr-2">Codice</th>
              <th scope="col" className="px-2 py-3">Libro</th>
              <th scope="col" className="px-2 py-3 text-right">Vendita</th>
              <th scope="col" className="px-2 py-3">Venditore</th>
              <th scope="col" className="py-3 pl-2 pr-5 text-right">Lo aspettano</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-paper-line">
            {copie.data.map((c) => (
              <tr key={c.id} className="align-top">
                <td className="whitespace-nowrap py-3 pl-5 pr-2 font-mono text-sm">
                  <span className="block font-bold">{c.codice}</span>
                  <span className="text-ink-muted">{c.isbn}</span>
                </td>
                <td className="px-2 py-3">
                  <span className="block font-semibold leading-snug">{c.titolo}</span>
                  <span className="block text-sm text-ink-muted">
                    {c.editore} · vol. {c.volume} · dal {formatDate(c.createdAt)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums">{formatPrice(c.prezzoVendita)}</td>
                <td className="px-2 py-3 text-sm">
                  {c.venditore.cognome} {c.venditore.nome}
                </td>
                <td className={cn("py-3 pl-2 pr-5 text-right tabular-nums", c.inAttesa > 0 && "font-extrabold text-orange-ink")}>{c.inAttesa || "–"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
