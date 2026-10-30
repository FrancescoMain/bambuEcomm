"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Search, Users } from "lucide-react";
import { PageTitle } from "@/components/admin/PageTitle";
import { Callout } from "@/components/admin/ops/Callout";
import { useAsync } from "@/components/admin/ops/useAsync";
import { useQueryParams } from "@/components/admin/ops/useQueryParams";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Spinner";
import { api } from "@/lib/api/scuole";
import { formatPrice } from "@/lib/format";
import { anniDisponibili, type SchedaClienteRiepilogo, type SchedaRiepilogo, type Scuola } from "../types";
import { SchedaClienteModal } from "./SchedaClienteModal";
import { SchedaClienteView } from "./SchedaClienteView";

/** Sezione Clienti: schede di prenotazione per anno, scuola e classe; il barcode letto con lo scanner apre la scheda. */
export function ClientiPage() {
  const [params, setParams] = useQueryParams();
  const anno = Number(params.get("anno")) || new Date().getFullYear();
  const scuolaId = Number(params.get("scuola")) || null;
  const classe = params.get("classe") ?? "";
  const schedaId = Number(params.get("scheda")) || null;
  const [testo, setTesto] = useState(params.get("q") ?? "");
  const [q, setQ] = useState(testo);
  const [nuova, setNuova] = useState(false);
  const ricerca = useRef<HTMLInputElement>(null);

  // La ricerca parte da sola mentre si scrive; lo scanner scrive tutto in un colpo e preme Invio
  useEffect(() => {
    const t = setTimeout(() => setQ(testo.trim()), 250);
    return () => clearTimeout(t);
  }, [testo]);

  const scuole = useAsync(() => api<Scuola[]>("/libri/scuole", { query: { anno } }), [anno]);
  const classi = useAsync(
    () => (scuolaId ? api<SchedaRiepilogo[]>(`/libri/scuole/${scuolaId}/schede`, { query: { anno } }) : Promise.resolve([])),
    [scuolaId, anno]
  );
  const schede = useAsync(
    () => api<SchedaClienteRiepilogo[]>("/libri/clienti", { query: { anno, scuolaId, classe, q } }),
    [anno, scuolaId, classe, q]
  );

  const apri = (id: number) => setParams({ scheda: id }, "push");

  const invio = async (e: React.FormEvent) => {
    e.preventDefault();
    const valore = testo.trim();
    if (!valore) return;
    // Barcode della scheda (13 cifre): si apre direttamente
    if (/^\d{13}$/.test(valore)) {
      const trovate = await api<SchedaClienteRiepilogo[]>("/libri/clienti", { query: { q: valore } }).catch(() => []);
      if (trovate.length === 1) {
        setTesto("");
        apri(trovate[0].id);
        return;
      }
    }
    setQ(valore);
    if (schede.data?.length === 1) apri(schede.data[0].id);
  };

  if (schedaId) {
    return (
      <SchedaClienteView
        key={schedaId}
        schedaId={schedaId}
        onBack={() => {
          setParams({ scheda: null });
          setTimeout(() => ricerca.current?.focus(), 0);
        }}
        onChanged={schede.reload}
        onDeleted={() => {
          setParams({ scheda: null });
          schede.reload();
        }}
      />
    );
  }

  return (
    <div>
      <PageTitle
        title="Clienti"
        description="Le schede di prenotazione dei libri: una per alunno, con i libri della classe da spuntare."
        actions={
          <Button onClick={() => setNuova(true)}>
            <Plus className="h-4 w-4" /> Nuova scheda
          </Button>
        }
      />

      <div className="card mb-5 grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,2fr)_110px_minmax(0,2fr)_minmax(0,1fr)]">
        <form onSubmit={invio}>
          <label htmlFor="cerca-scheda" className="mb-1.5 block text-sm font-semibold text-ink-soft">
            Cerca
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
            <input
              id="cerca-scheda"
              ref={ricerca}
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              placeholder="Cognome, nome, telefono, numero o barcode"
              autoFocus
              autoComplete="off"
              className="w-full rounded-xl border border-paper-line bg-white py-2.5 pl-10 pr-3 text-base focus:border-brand-500 focus:outline-none"
            />
          </div>
        </form>
        <Select label="Anno" value={anno} onChange={(e) => setParams({ anno: e.target.value, classe: null })}>
          {anniDisponibili().map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
        <Select label="Scuola" value={scuolaId ?? ""} onChange={(e) => setParams({ scuola: e.target.value, classe: null })}>
          <option value="">Tutte le scuole</option>
          {scuole.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </Select>
        <Select label="Classe" value={classe} onChange={(e) => setParams({ classe: e.target.value })} disabled={!scuolaId}>
          <option value="">Tutte le classi</option>
          {classi.data?.map((c) => (
            <option key={c.id} value={c.classe}>
              {c.classe}
            </option>
          ))}
        </Select>
      </div>

      {schede.error ? (
        <Callout tone="danger">{schede.error}</Callout>
      ) : !schede.data ? (
        <Skeleton className="h-64" />
      ) : schede.data.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title={q ? "Nessuna scheda trovata" : "Nessuna scheda"}
          text={q ? "Prova con un'altra parola, oppure crea una scheda nuova." : "Crea la prima scheda: arrivano da soli i libri della classe."}
          action={<Button onClick={() => setNuova(true)}>Nuova scheda</Button>}
          className="card"
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-base">
            <thead className="border-b border-paper-line bg-paper/60 text-sm font-bold uppercase tracking-wide text-ink-muted">
              <tr>
                <th scope="col" className="py-3 pl-5 pr-2">N.</th>
                <th scope="col" className="px-2 py-3">Alunno</th>
                <th scope="col" className="px-2 py-3">Scuola e classe</th>
                <th scope="col" className="px-2 py-3">Libri</th>
                <th scope="col" className="px-2 py-3 text-right">Prenotati</th>
                <th scope="col" className="px-2 py-3 text-right">Acconto</th>
                <th scope="col" className="py-3 pl-2 pr-5 text-right">Da pagare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {schede.data.map((s) => {
                const prenotati = s.conteggi.PRENOTATO + s.conteggi.CONFERMATO + s.conteggi.ASSEGNATO + s.conteggi.RITIRATO;
                return (
                  <tr key={s.id} onClick={() => apri(s.id)} className="cursor-pointer align-top transition hover:bg-paper/60">
                    <td className="py-3 pl-5 pr-2 font-bold tabular-nums">
                      {s.numero}
                      {s.anno !== anno && <span className="block text-xs font-normal text-ink-muted">{s.anno}</span>}
                    </td>
                    <td className="px-2 py-3">
                      <span className="block font-bold">
                        {s.cognome} {s.nome}
                      </span>
                      {s.telefono && <span className="block text-sm text-ink-muted">{s.telefono}</span>}
                    </td>
                    <td className="px-2 py-3">
                      <span className="block text-sm">{s.scuola.nome}</span>
                      <span className="block font-semibold">{s.classe}</span>
                    </td>
                    <td className="px-2 py-3 text-sm">
                      <span className="block">
                        {prenotati} prenotati su {prenotati + s.conteggi.IN_LISTA}
                      </span>
                      {s.conteggi.ASSEGNATO > 0 && (
                        <span className="mt-1 inline-block rounded-full bg-brand-100 px-2.5 py-0.5 font-bold text-brand-800">
                          {s.conteggi.ASSEGNATO} da ritirare
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums">{formatPrice(s.totali.prenotati)}</td>
                    <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums">{formatPrice(s.totali.acconto)}</td>
                    <td className="whitespace-nowrap py-3 pl-2 pr-5 text-right font-bold tabular-nums">{formatPrice(s.totali.daPagare)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <SchedaClienteModal
        open={nuova}
        anno={anno}
        scheda={null}
        iniziali={{ scuolaId, classe }}
        onClose={() => setNuova(false)}
        onSaved={(s) => {
          schede.reload();
          apri(s.id);
        }}
      />
    </div>
  );
}
