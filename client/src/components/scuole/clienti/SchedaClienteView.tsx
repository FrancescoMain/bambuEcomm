"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Download, HandCoins, Pencil, Plus, Printer, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Callout } from "@/components/admin/ops/Callout";
import { useAsync } from "@/components/admin/ops/useAsync";
import { useConfirm } from "@/components/admin/useConfirm";
import { pluralize } from "@/components/admin/catalog/utils";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import { cn } from "@/lib/cn";
import { formatDateTime, formatPrice } from "@/lib/format";
import { LibroModal } from "../LibroModal";
import { STATI, type AzioneLibro, type ClienteCopia, type LibroCliente, type SchedaCliente } from "../types";
import { SchedaClienteModal } from "./SchedaClienteModal";
import { StampaScheda, type TipoStampa } from "./StampaScheda";

const modificabile = (l: LibroCliente) => l.stato === "IN_LISTA" || l.stato === "PRENOTATO";

/** Scheda di prenotazione di un alunno (ex scheda cliente di GS_MAG). */
export function SchedaClienteView({
  schedaId,
  onBack,
  onChanged,
  onDeleted,
}: {
  schedaId: number;
  onBack: () => void;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const caricata = useAsync(() => api<SchedaCliente>(`/libri/clienti/${schedaId}`), [schedaId]);
  // Le azioni rispondono con la scheda aggiornata: la si mostra subito senza ricaricare
  const [aggiornata, setAggiornata] = useState<SchedaCliente | null>(null);
  const scheda = aggiornata ?? caricata.data;
  const [libroAperto, setLibroAperto] = useState<LibroCliente | null | undefined>(undefined);
  const [modifica, setModifica] = useState(false);
  const [lavoro, setLavoro] = useState(false);
  const [acconto, setAcconto] = useState("");
  const [appunti, setAppunti] = useState("");
  const [stampa, setStampa] = useState<TipoStampa | null>(null);
  const [nascosti, setNascosti] = useState<ReadonlySet<number>>(new Set());
  const [daAnnullare, setDaAnnullare] = useState<number | null>(null);
  const [confirm, dialog] = useConfirm();

  // La richiesta di conferma sul pulsante «Annulla ordine» sparisce da sola dopo qualche secondo
  useEffect(() => {
    if (daAnnullare === null) return;
    const t = setTimeout(() => setDaAnnullare(null), 4000);
    return () => clearTimeout(t);
  }, [daAnnullare]);

  useEffect(() => setAggiornata(null), [caricata.data]);
  useEffect(() => {
    if (scheda) setAcconto(Number(scheda.acconto) ? Number(scheda.acconto).toFixed(2).replace(".", ",") : "");
  }, [scheda?.acconto]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setAppunti(scheda?.note ?? ""), [scheda?.note]);

  // Stampa: si monta il foglio, si apre la finestra di stampa del browser, poi lo si smonta
  useEffect(() => {
    if (!stampa) return;
    const fine = () => setStampa(null);
    window.addEventListener("afterprint", fine, { once: true });
    const t = setTimeout(() => window.print(), 50);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", fine);
    };
  }, [stampa]);

  const applica = (s: SchedaCliente) => {
    setAggiornata(s);
    onChanged();
  };

  const cambiaStato = async (azione: AzioneLibro, libri: LibroCliente[]) => {
    if (!libri.length) return;
    setLavoro(true);
    try {
      applica(await api<SchedaCliente>(`/libri/clienti/${schedaId}/stato`, { method: "POST", body: { azione, libri: libri.map((l) => l.id) } }));
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLavoro(false);
    }
  };

  // Il cliente non vuole più un libro già ordinato: la copia passa al primo che aspetta lo stesso libro.
  // Al primo clic il pulsante chiede conferma sul posto (niente finestra), al secondo annulla.
  const annullaOrdine = async (l: LibroCliente) => {
    if (daAnnullare !== l.id) {
      setDaAnnullare(l.id);
      return;
    }
    setDaAnnullare(null);
    setLavoro(true);
    try {
      const esito = await api<{ passatoA: ClienteCopia | null; ordine: { numero: number } | null }>("/libri/ordini/annulla-libro", {
        method: "POST",
        body: { libroId: l.id },
      });
      toast.success(
        esito.passatoA
          ? `«${l.titolo}» annullato. La copia va a ${esito.passatoA.cognome} ${esito.passatoA.nome} (scheda n. ${esito.passatoA.numero}).`
          : `«${l.titolo}» annullato. La copia resta libera nell'ordine n. ${esito.ordine?.numero}: andrà al prossimo che lo prenota.`,
        { duration: 8000 }
      );
      caricata.reload();
      onChanged();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLavoro(false);
    }
  };

  const salvaAcconto = async () => {
    if (!scheda) return;
    const valore = acconto.trim() || "0";
    if (Number(valore.replace(",", ".")) === Number(scheda.acconto)) return;
    try {
      applica(await api<SchedaCliente>(`/libri/clienti/${schedaId}`, { method: "PATCH", body: { acconto: valore } }));
      toast.success("Acconto salvato.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  // Appunti liberi sul cliente (in GS_MAG si usava la casella del codice fiscale): non vanno in stampa
  const salvaAppunti = async () => {
    if (!scheda || appunti.trim() === scheda.note) return;
    try {
      applica(await api<SchedaCliente>(`/libri/clienti/${schedaId}`, { method: "PATCH", body: { note: appunti } }));
      toast.success("Appunti salvati.");
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const importa = async () => {
    setLavoro(true);
    try {
      const s = await api<SchedaCliente>(`/libri/clienti/${schedaId}/importa`, { method: "POST" });
      toast.success(
        s.importazione?.libriAggiunti
          ? `${pluralize(s.importazione.libriAggiunti, "libro aggiunto", "libri aggiunti")} dalla classe.`
          : "Tutti i libri della classe erano già nella scheda."
      );
      applica(s);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLavoro(false);
    }
  };

  // Come nelle classi: niente conferma, la riga sparisce e si elimina se non si preme «Annulla»
  const eliminaLibro = (l: LibroCliente) => {
    const mostra = () =>
      setNascosti((s) => {
        const n = new Set(s);
        n.delete(l.id);
        return n;
      });
    setNascosti((s) => new Set(s).add(l.id));
    let deciso = false;
    const elimina = async () => {
      if (deciso) return;
      deciso = true;
      try {
        await api(`/libri/clienti/${schedaId}/libri/${l.id}`, { method: "DELETE" });
        caricata.reload();
        onChanged();
      } catch (e) {
        mostra();
        toast.error(errorMessage(e));
      }
    };
    toast(`«${l.titolo}» tolto dalla scheda.`, {
      duration: 5000,
      action: {
        label: "Annulla",
        onClick: () => {
          if (deciso) return;
          deciso = true;
          mostra();
        },
      },
      onAutoClose: elimina,
      onDismiss: elimina,
    });
  };

  const eliminaScheda = async () => {
    if (!scheda) return;
    const ok = await confirm({
      title: `Eliminare la scheda n. ${scheda.numero}?`,
      message: `${scheda.cognome} ${scheda.nome}, con tutti i suoi libri. Non si può annullare.`,
      confirmLabel: "Elimina scheda",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/libri/clienti/${schedaId}`, { method: "DELETE" });
      toast.success(`Scheda n. ${scheda.numero} eliminata.`);
      onDeleted();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (caricata.error) return <Callout tone="danger">{caricata.error}</Callout>;
  if (!scheda) return <Skeleton className="h-96" />;

  const libri = scheda.libri.filter((l) => !nascosti.has(l.id));
  const inLista = libri.filter((l) => l.stato === "IN_LISTA");
  const assegnati = libri.filter((l) => l.stato === "ASSEGNATO");
  const t = scheda.totali;

  return (
    <>
      <div className="space-y-4 print:hidden">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-[15px] font-semibold text-brand-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Tutte le schede
        </button>

        <section className="card overflow-hidden">
          <header className="flex flex-col gap-4 border-b border-paper-line p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-muted">
                Scheda n. {scheda.numero} · {scheda.anno} · <span className="font-mono">{scheda.barcode}</span>
              </p>
              <h2 className="text-2xl font-extrabold">
                {scheda.cognome} {scheda.nome}
              </h2>
              <p className="text-[15px] text-ink-soft">
                {scheda.scuola.nome} · classe <strong>{scheda.classe}</strong>
                {scheda.corso ? ` · ${scheda.corso}` : ""}
                {scheda.telefono ? ` · tel. ${scheda.telefono}` : ""}
              </p>
              <p className="mt-0.5 text-xs text-ink-muted">Creata il {formatDateTime(scheda.data)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setStampa("scheda")}>
                <Printer className="h-4 w-4" /> Stampa scheda
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setStampa("lista")}>
                <Printer className="h-4 w-4" /> Lista intera
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setStampa("acquistare")} disabled={!libri.some((l) => l.daAcquistare)}>
                <Printer className="h-4 w-4" /> Da acquistare
              </Button>
              <Button size="sm" variant="outline" onClick={() => setModifica(true)} aria-label="Modifica dati">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={eliminaScheda} aria-label="Elimina scheda">
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
              placeholder="Appunti su questo cliente (non vanno in stampa)"
              aria-label="Appunti sul cliente"
              className="w-full resize-y rounded-lg border border-transparent bg-paper/60 px-3 py-2 text-[15px] hover:border-paper-line focus:border-brand-500 focus:bg-white focus:outline-none"
            />
          </label>

          <div className="grid gap-px bg-paper-line sm:grid-cols-4">
            <Cifra label="Lista della classe" valore={formatPrice(t.lista)} nota={pluralize(libri.length, "libro", "libri")} />
            <Cifra label="Prenotati" valore={formatPrice(t.prenotati)} nota={pluralize(libri.length - inLista.length, "libro", "libri")} />
            <label className="block bg-white px-5 py-4">
              <span className="block text-sm font-semibold text-ink-muted">Acconto</span>
              <span className="mt-1 flex items-center gap-2">
                <HandCoins className="h-5 w-5 text-ink-muted" />
                <input
                  value={acconto}
                  onChange={(e) => setAcconto(e.target.value)}
                  onBlur={salvaAcconto}
                  onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  inputMode="decimal"
                  placeholder="0"
                  aria-label="Acconto in euro"
                  className="w-full rounded-lg border border-paper-line px-2 py-1 text-xl font-extrabold tabular-nums focus:border-brand-500 focus:outline-none"
                />
                <span className="text-lg font-bold">€</span>
              </span>
            </label>
            <Cifra label="Da pagare" valore={formatPrice(t.daPagare)} forte />
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-paper-line p-4 sm:px-5">
            <Button size="sm" onClick={() => cambiaStato("prenota", inLista)} disabled={lavoro || !inLista.length}>
              Prenota tutti ({inLista.length})
            </Button>
            <Button size="sm" variant="secondary" onClick={() => cambiaStato("ritira", assegnati)} disabled={lavoro || !assegnati.length}>
              Ritira gli assegnati ({assegnati.length})
            </Button>
            <span className="flex-1" />
            <Button size="sm" variant="outline" onClick={() => setLibroAperto(null)}>
              <Plus className="h-4 w-4" /> Aggiungi libro
            </Button>
            <Button size="sm" variant="outline" onClick={importa} disabled={lavoro}>
              <Download className="h-4 w-4" /> Importa dalla classe
            </Button>
          </div>

          {libri.length === 0 ? (
            <EmptyState
              icon={<BookOpen className="h-7 w-7" />}
              title="Nessun libro"
              text="«Importa dalla classe» porta i libri adottati, oppure aggiungili a mano."
            />
          ) : (
            <div className="overflow-x-auto border-t border-paper-line">
              <table className="w-full min-w-[1000px] text-left text-base">
                <thead className="border-b border-paper-line bg-paper/60 text-sm font-bold uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th scope="col" className="w-[110px] py-3 pl-5 pr-2">Prenota</th>
                    <th scope="col" className="px-2 py-3">Materia</th>
                    <th scope="col" className="px-2 py-3">Titolo e autori</th>
                    <th scope="col" className="px-2 py-3">Editore</th>
                    <th scope="col" className="px-2 py-3">Vol.</th>
                    <th scope="col" className="px-2 py-3">Codice</th>
                    <th scope="col" className="px-2 py-3 text-right">Prezzo</th>
                    <th scope="col" className="px-2 py-3">Stato</th>
                    <th scope="col" className="py-3 pl-2 pr-5" aria-label="Azioni" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-paper-line">
                  {libri.map((l) => {
                    const preso = l.stato !== "IN_LISTA";
                    return (
                      <tr key={l.id} className={cn("align-top", !preso && "text-ink-muted")}>
                        <td className="py-3 pl-5 pr-2">
                          <input
                            type="checkbox"
                            checked={preso}
                            disabled={lavoro || !modificabile(l)}
                            onChange={() => cambiaStato(preso ? "togli" : "prenota", [l])}
                            aria-label={preso ? `Togli la prenotazione di ${l.titolo}` : `Prenota ${l.titolo}`}
                            className="h-6 w-6 cursor-pointer accent-brand-600 disabled:cursor-not-allowed"
                          />
                        </td>
                        <td className="w-[170px] px-2 py-3 text-sm font-semibold">{l.materia}</td>
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={() => modificabile(l) && setLibroAperto(l)}
                            className={cn("text-left", modificabile(l) && "hover:underline")}
                            disabled={!modificabile(l)}
                          >
                            <span className={cn("block font-semibold leading-snug", preso && "text-ink")}>{l.titolo}</span>
                            <span className="block text-sm text-ink-muted">
                              {l.autori}
                              {l.nuovaAdozione ? " · New" : ""}
                            </span>
                          </button>
                        </td>
                        <td className="w-[150px] px-2 py-3 text-sm">{l.editore}</td>
                        <td className="px-2 py-3 text-lg font-bold">{l.volume}</td>
                        <td className="whitespace-nowrap px-2 py-3 font-mono text-sm">{l.isbn}</td>
                        <td className="whitespace-nowrap px-2 py-3 text-right tabular-nums">{formatPrice(l.prezzo)}</td>
                        <td className="whitespace-nowrap px-2 py-3">
                          <span className={cn("rounded-full px-3 py-1 text-sm font-bold", STATI[l.stato].classe)}>{STATI[l.stato].label}</span>
                        </td>
                        <td className="whitespace-nowrap py-2 pl-2 pr-5 text-right">
                          {l.stato === "CONFERMATO" && (
                            <Button
                              size="sm"
                              variant={daAnnullare === l.id ? "danger" : "ghost"}
                              onClick={() => annullaOrdine(l)}
                              disabled={lavoro}
                            >
                              {daAnnullare === l.id ? "Sì, annulla" : "Annulla ordine"}
                            </Button>
                          )}
                          {l.stato === "ASSEGNATO" && (
                            <Button size="sm" onClick={() => cambiaStato("ritira", [l])} disabled={lavoro}>
                              Ritira
                            </Button>
                          )}
                          {l.stato === "RITIRATO" && (
                            <Button size="sm" variant="ghost" onClick={() => cambiaStato("annullaRitiro", [l])} disabled={lavoro}>
                              Annulla ritiro
                            </Button>
                          )}
                          {modificabile(l) && (
                            <button
                              type="button"
                              onClick={() => eliminaLibro(l)}
                              className="rounded-full p-2 text-ink-muted transition hover:bg-magenta-soft hover:text-magenta-ink"
                              aria-label={`Togli ${l.titolo} dalla scheda`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {stampa && <StampaScheda scheda={scheda} tipo={stampa} />}

      <LibroModal
        open={libroAperto !== undefined}
        percorso={`/libri/clienti/${schedaId}/libri`}
        libro={libroAperto ?? null}
        onClose={() => setLibroAperto(undefined)}
        onSaved={() => {
          caricata.reload();
          onChanged();
        }}
      />
      <SchedaClienteModal open={modifica} anno={scheda.anno} scheda={scheda} onClose={() => setModifica(false)} onSaved={applica} />
      {dialog}
    </>
  );
}

function Cifra({ label, valore, nota, forte }: { label: string; valore: string; nota?: string; forte?: boolean }) {
  return (
    <div className={cn("bg-white px-5 py-4", forte && "bg-brand-50")}>
      <span className="block text-sm font-semibold text-ink-muted">{label}</span>
      <span className={cn("mt-1 block text-xl font-extrabold tabular-nums", forte && "text-2xl text-brand-800")}>{valore}</span>
      {nota && <span className="block text-sm text-ink-muted">{nota}</span>}
    </div>
  );
}
