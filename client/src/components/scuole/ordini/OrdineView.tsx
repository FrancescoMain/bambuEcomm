"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download, Printer, StickyNote, Trash2, X } from "lucide-react";
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
import { formatDate, formatDateTime, formatPrice } from "@/lib/format";
import type { Ordine, RigaOrdine } from "../types";
import { PerChi } from "./OrdiniPage";
import { StampaOrdine } from "./StampaOrdine";
import { perCodice, scaricaCsv, useStampa } from "./utils";

/** Un ordine al fornitore: una riga per copia, con il cliente che la aspetta. */
export function OrdineView({ ordineId, onBack }: { ordineId: number; onBack: () => void }) {
  const caricato = useAsync(() => api<Ordine>(`/libri/ordini/${ordineId}`), [ordineId]);
  const [aggiornato, setAggiornato] = useState<Ordine | null>(null);
  const ordine = aggiornato ?? caricato.data;
  const [appunti, setAppunti] = useState("");
  const [nascoste, setNascoste] = useState<ReadonlySet<number>>(new Set());
  const [stampa, stampaOra] = useStampa();
  const [confirm, dialog] = useConfirm();

  useEffect(() => setAggiornato(null), [caricato.data]);
  useEffect(() => setAppunti(ordine?.note ?? ""), [ordine?.note]);

  const salvaAppunti = async () => {
    if (!ordine || appunti.trim() === ordine.note) return;
    try {
      setAggiornato(await api<Ordine>(`/libri/ordini/${ordineId}`, { method: "PATCH", body: { note: appunti } }));
      toast.success("Appunti salvati.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  // Come per i libri della scheda: niente conferma, la riga sparisce e si toglie se non si preme «Annulla»
  const togli = (r: RigaOrdine) => {
    const mostra = () =>
      setNascoste((s) => {
        const n = new Set(s);
        n.delete(r.id);
        return n;
      });
    setNascoste((s) => new Set(s).add(r.id));
    let deciso = false;
    const esegui = async () => {
      if (deciso) return;
      deciso = true;
      try {
        setAggiornato(await api<Ordine>(`/libri/ordini/${ordineId}/righe/${r.id}`, { method: "DELETE" }));
      } catch (e) {
        mostra();
        toast.error(errorMessage(e));
      }
    };
    const chi = r.libro ? ` Torna «Prenotato» per ${r.libro.scheda.cognome} ${r.libro.scheda.nome}.` : "";
    toast(`«${r.titolo}» tolto dall'ordine.${chi}`, {
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
    if (!ordine) return;
    const ok = await confirm({
      title: `Eliminare l'ordine n. ${ordine.numero}?`,
      message: `${pluralize(ordine.righe.length, "copia", "copie")}: i libri dei clienti tornano «Prenotato» e ricompaiono in «Da ordinare».`,
      confirmLabel: "Elimina ordine",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/libri/ordini/${ordineId}`, { method: "DELETE" });
      toast.success(`Ordine n. ${ordine.numero} eliminato.`);
      onBack();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (caricato.error) return <Callout tone="danger">{caricato.error}</Callout>;
  if (!ordine) return <Skeleton className="h-96" />;

  const righe = ordine.righe.filter((r) => !nascoste.has(r.id));
  const gruppi = perCodice(righe);
  const arrivate = righe.filter((r) => r.arrivatoAt).length;
  const libere = righe.filter((r) => !r.libro && !r.arrivatoAt).length;
  const totale = righe.reduce((t, r) => t + Number(r.prezzo), 0);
  const nomeFile = `ordine-${ordine.anno}-${String(ordine.numero).padStart(3, "0")}.csv`;

  return (
    <>
      <div className="space-y-4 print:hidden">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-[15px] font-semibold text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Ordini
        </button>

        <section className="card overflow-hidden">
          <header className="flex flex-col gap-4 border-b border-paper-line p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-muted">
                {ordine.anno} · <span className="font-mono">{ordine.barcode}</span>
              </p>
              <h2 className="text-2xl font-extrabold">Ordine n. {ordine.numero}</h2>
              <p className="text-[15px] text-ink-soft">Inoltrato il {formatDateTime(ordine.data)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => scaricaCsv(nomeFile, gruppi)} disabled={!gruppi.length}>
                <Download className="h-4 w-4" /> Scarica CSV
              </Button>
              <Button variant="secondary" onClick={stampaOra} disabled={!gruppi.length}>
                <Printer className="h-4 w-4" /> Stampa
              </Button>
              <Button variant="outline" onClick={elimina} disabled={arrivate > 0} aria-label="Elimina ordine">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <label className="flex items-start gap-3 border-b border-paper-line px-4 py-3 sm:px-5">
            <StickyNote className="mt-2 h-5 w-5 shrink-0 text-ink-muted" />
            <textarea
              value={appunti}
              onChange={(e) => setAppunti(e.target.value)}
              onBlur={salvaAppunti}
              rows={appunti.includes("\n") ? 3 : 1}
              maxLength={1000}
              placeholder="Appunti sull'ordine (a chi è stato mandato, come…)"
              aria-label="Appunti sull'ordine"
              className="w-full resize-y rounded-lg border border-transparent bg-paper/60 px-3 py-2 text-[15px] hover:border-paper-line focus:border-brand-500 focus:bg-white focus:outline-none"
            />
          </label>

          <div className="grid gap-px bg-paper-line sm:grid-cols-4">
            <Cifra label="Titoli" valore={String(gruppi.length)} />
            <Cifra label="Copie" valore={String(righe.length)} nota={libere ? `${libere} libere` : undefined} />
            <Cifra label="Arrivate" valore={`${arrivate} su ${righe.length}`} />
            <Cifra label="Totale a prezzo di copertina" valore={formatPrice(totale)} forte />
          </div>

          <div className="overflow-x-auto border-t border-paper-line">
            <table className="w-full min-w-[1000px] text-left text-base">
              <thead className="border-b border-paper-line bg-paper/60 text-sm font-bold uppercase tracking-wide text-ink-muted">
                <tr>
                  <th scope="col" className="py-3 pl-5 pr-2">Codice</th>
                  <th scope="col" className="px-2 py-3">Titolo e autori</th>
                  <th scope="col" className="px-2 py-3">Editore</th>
                  <th scope="col" className="px-2 py-3">Vol.</th>
                  <th scope="col" className="px-2 py-3 text-right">Prezzo</th>
                  <th scope="col" className="px-2 py-3">Per chi</th>
                  <th scope="col" className="px-2 py-3">Stato</th>
                  <th scope="col" className="py-3 pl-2 pr-5" aria-label="Azioni" />
                </tr>
              </thead>
              <tbody className="divide-y divide-paper-line">
                {righe.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="whitespace-nowrap py-3 pl-5 pr-2 font-mono text-sm">{r.isbn}</td>
                    <td className="px-2 py-3">
                      <span className="block font-semibold leading-snug">{r.titolo}</span>
                      <span className="block text-sm text-ink-muted">{r.autori}</span>
                    </td>
                    <td className="w-[150px] px-2 py-3 text-sm">{r.editore}</td>
                    <td className="px-2 py-3 text-lg font-bold">{r.volume}</td>
                    <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums">{formatPrice(r.prezzo)}</td>
                    <td className="px-2 py-3 text-sm">
                      <PerChi righe={[r]} />
                    </td>
                    <td className="whitespace-nowrap px-2 py-3">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-sm font-bold",
                          r.arrivatoAt ? "bg-brand-100 text-brand-800" : "bg-sky-soft text-sky-ink"
                        )}
                      >
                        {r.arrivatoAt ? `Arrivato il ${formatDate(r.arrivatoAt)}` : "In arrivo"}
                      </span>
                    </td>
                    <td className="py-2 pl-2 pr-5 text-right">
                      {!r.arrivatoAt && (
                        <button
                          type="button"
                          onClick={() => togli(r)}
                          className="rounded-full p-2 text-ink-muted transition hover:bg-magenta-soft hover:text-magenta-ink"
                          aria-label={`Togli ${r.titolo} dall'ordine`}
                          title="Togli dall'ordine"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {stampa && <StampaOrdine titolo="Ordine al fornitore" sottotitolo={`Ordine n. ${ordine.numero} / ${ordine.anno}`} data={ordine.data} righe={gruppi} />}
      {dialog}
    </>
  );
}

function Cifra({ label, valore, nota, forte }: { label: string; valore: string; nota?: string; forte?: boolean }) {
  return (
    <div className={cn("bg-white px-5 py-4", forte && "bg-brand-50")}>
      <span className="block text-sm font-semibold text-ink-muted">{label}</span>
      <span className={cn("mt-1 block text-xl font-extrabold tabular-nums", forte && "text-2xl text-brand-800")}>{valore}</span>
      {nota && <span className="block text-sm font-semibold text-orange-ink">{nota}</span>}
    </div>
  );
}
