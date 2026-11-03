"use client";

import { useState } from "react";
import { PackageOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/admin/PageTitle";
import { Callout } from "@/components/admin/ops/Callout";
import { useAsync } from "@/components/admin/ops/useAsync";
import { useQueryParams } from "@/components/admin/ops/useQueryParams";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Spinner";
import { errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import { formatDate, formatPrice } from "@/lib/format";
import { anniDisponibili, type Bolla, type BollaRiepilogo } from "../types";
import { BollaView } from "./BollaView";

/** Sezione Bolle (ex Schede Bolle di GS_MAG): l'arrivo della merce dal fornitore, un libro letto alla volta. */
export function BollePage() {
  const [params, setParams] = useQueryParams();
  const bollaId = Number(params.get("bolla")) || null;
  const [anno, setAnno] = useState(new Date().getFullYear());
  const [creando, setCreando] = useState(false);
  const bolle = useAsync(() => (bollaId ? Promise.resolve(null) : api<BollaRiepilogo[]>("/libri/bolle", { query: { anno } })), [anno, bollaId]);

  const apri = (id: number) => setParams({ bolla: id }, "push");

  const nuova = async () => {
    setCreando(true);
    try {
      const b = await api<Bolla>("/libri/bolle", { method: "POST", body: {} });
      apri(b.id);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setCreando(false);
    }
  };

  if (bollaId) return <BollaView key={bollaId} bollaId={bollaId} onBack={() => setParams({ bolla: null })} />;

  return (
    <div>
      <PageTitle
        title="Bolle"
        description="L'arrivo della merce dal fornitore: leggi ogni libro col lettore e va da solo al cliente che lo aspetta, oppure in Magazzino."
        actions={
          <Button onClick={nuova} disabled={creando}>
            <Plus className="h-4 w-4" /> Nuova bolla
          </Button>
        }
      />
      <div className="mb-5 w-32">
        <Select label="Anno" value={anno} onChange={(e) => setAnno(Number(e.target.value))}>
          {anniDisponibili().map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      </div>
      {bolle.error ? (
        <Callout tone="danger">{bolle.error}</Callout>
      ) : !bolle.data ? (
        <Skeleton className="h-64" />
      ) : !bolle.data.length ? (
        <EmptyState
          icon={<PackageOpen className="h-7 w-7" />}
          title={`Nessuna bolla nel ${anno}`}
          text="Quando arriva la merce, crea una bolla e leggi i libri col lettore."
          action={
            <Button onClick={nuova} disabled={creando}>
              Nuova bolla
            </Button>
          }
          className="card"
        />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-base">
            <thead className="border-b border-paper-line bg-paper/60 text-sm font-bold uppercase tracking-wide text-ink-muted">
              <tr>
                <th scope="col" className="py-3 pl-5 pr-2">N.</th>
                <th scope="col" className="px-2 py-3">Data</th>
                <th scope="col" className="px-2 py-3">DDT fornitore</th>
                <th scope="col" className="px-2 py-3 text-right">Copie</th>
                <th scope="col" className="px-2 py-3 text-right">Ai clienti</th>
                <th scope="col" className="px-2 py-3 text-right">In magazzino</th>
                <th scope="col" className="px-2 py-3 text-right">Totale</th>
                <th scope="col" className="py-3 pl-4 pr-5">Appunti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {bolle.data.map((b) => (
                <tr key={b.id} onClick={() => apri(b.id)} className="cursor-pointer align-top transition hover:bg-paper/60">
                  <td className="py-3 pl-5 pr-2 font-bold tabular-nums">{b.numero}</td>
                  <td className="px-2 py-3">{formatDate(b.data)}</td>
                  <td className="px-2 py-3">{b.numeroFornitore || <span className="text-ink-muted">–</span>}</td>
                  <td className="px-2 py-3 text-right font-bold tabular-nums">{b.copie}</td>
                  <td className="px-2 py-3 text-right tabular-nums">{b.aClienti}</td>
                  <td className="px-2 py-3 text-right tabular-nums">{b.inMagazzino}</td>
                  <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums">{formatPrice(b.totale)}</td>
                  <td className="py-3 pl-4 pr-5 text-sm text-ink-muted">{b.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
