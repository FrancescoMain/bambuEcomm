"use client";

import { useState } from "react";
import { BookOpen, Download, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Callout } from "@/components/admin/ops/Callout";
import { useAsync } from "@/components/admin/ops/useAsync";
import { useConfirm } from "@/components/admin/useConfirm";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Spinner";
import { errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import { formatDateTime, formatPrice } from "@/lib/format";
import { pluralize } from "@/components/admin/catalog/utils";
import { ClasseModal } from "./ClasseModal";
import { LibroModal } from "./LibroModal";
import type { EsitoImport, LibroScheda, Scheda } from "./types";

const SiNo = ({ si }: { si: boolean }) => (
  <span className={si ? "font-bold text-brand-700" : "text-ink-faint"}>{si ? "SI" : "NO"}</span>
);

/** Libri adottati da una classe (ex scheda di GS_MAG): righe, totale, import dal Ministero. */
export function SchedaClasse({
  schedaId,
  onChanged,
  onDeleted,
}: {
  schedaId: number;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const { data: scheda, error, reload } = useAsync(() => api<Scheda>(`/libri/schede/${schedaId}`), [schedaId]);
  const [libroAperto, setLibroAperto] = useState<LibroScheda | null | undefined>(undefined);
  const [modificaClasse, setModificaClasse] = useState(false);
  const [importando, setImportando] = useState(false);
  const [confirm, dialog] = useConfirm();

  const aggiorna = () => {
    reload();
    onChanged();
  };

  const importa = async () => {
    setImportando(true);
    try {
      const esito = await api<EsitoImport>(`/libri/schede/${schedaId}/importa`, { method: "POST" });
      toast.success(
        esito.libriAggiunti
          ? `${pluralize(esito.libriAggiunti, "libro aggiunto", "libri aggiunti")} dal Ministero.`
          : "Tutti i libri del Ministero erano già nella classe."
      );
      aggiorna();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setImportando(false);
    }
  };

  // Niente conferma: la riga sparisce subito e si elimina davvero quando il messaggio si chiude, se non si preme «Annulla».
  const [nascosti, setNascosti] = useState<ReadonlySet<number>>(new Set());
  const mostra = (libroId: number) =>
    setNascosti((s) => {
      const n = new Set(s);
      n.delete(libroId);
      return n;
    });
  const eliminaLibro = (l: LibroScheda) => {
    setNascosti((s) => new Set(s).add(l.id));
    let deciso = false;
    const elimina = async () => {
      if (deciso) return;
      deciso = true;
      try {
        await api(`/libri/schede/${schedaId}/libri/${l.id}`, { method: "DELETE" });
        aggiorna();
      } catch (e) {
        mostra(l.id);
        toast.error(errorMessage(e));
      }
    };
    toast(`«${l.titolo}» eliminato.`, {
      duration: 5000,
      action: {
        label: "Annulla",
        onClick: () => {
          if (deciso) return;
          deciso = true;
          mostra(l.id);
        },
      },
      onAutoClose: elimina,
      onDismiss: elimina,
    });
  };

  const eliminaClasse = async () => {
    if (!scheda) return;
    const ok = await confirm({
      title: `Eliminare la classe ${scheda.classe}?`,
      message: `Si eliminano anche ${pluralize(scheda.libri.length, "libro", "libri")} della lista. Non si può annullare.`,
      confirmLabel: "Elimina classe",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/libri/schede/${schedaId}`, { method: "DELETE" });
      toast.success(`Classe ${scheda.classe} eliminata.`);
      onDeleted();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  if (error) return <Callout tone="danger">{error}</Callout>;
  if (!scheda) return <Skeleton className="h-72" />;
  const libri = scheda.libri.filter((l) => !nascosti.has(l.id));
  const totale = libri.reduce((t, l) => t + Number(l.prezzo), 0);

  return (
    <section className="card overflow-hidden">
      <header className="flex flex-col gap-3 border-b border-paper-line p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold">
            Classe {scheda.classe} <span className="font-semibold text-ink-muted">· {scheda.anno}</span>
          </h2>
          {scheda.corso && <p className="text-sm font-semibold text-ink-soft">{scheda.corso}</p>}
          <p className="mt-0.5 text-xs text-ink-muted">Creata il {formatDateTime(scheda.data)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => setLibroAperto(null)}>
            <Plus className="h-4 w-4" /> Aggiungi libro
          </Button>
          <Button size="sm" variant="secondary" onClick={importa} disabled={importando}>
            <Download className="h-4 w-4" /> {importando ? "Importo…" : "Importa OnLine"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setModificaClasse(true)} aria-label="Modifica classe">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={eliminaClasse} aria-label="Elimina classe">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {libri.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-7 w-7" />}
          title="Nessun libro"
          text="Usa «Importa OnLine» per prendere i libri adottati dal sito del Ministero, oppure aggiungili a mano."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-base">
            <thead className="border-b border-paper-line bg-paper/60 text-sm font-bold uppercase tracking-wide text-ink-muted">
              <tr>
                <th scope="col" className="py-3 pl-5 pr-2">Nr</th>
                <th scope="col" className="px-2 py-3">Materia</th>
                <th scope="col" className="px-2 py-3">Titolo e autori</th>
                <th scope="col" className="px-2 py-3">Editore</th>
                <th scope="col" className="px-2 py-3">Vol.</th>
                <th scope="col" className="px-2 py-3">Codice</th>
                <th scope="col" className="px-2 py-3 text-right">Prezzo</th>
                <th scope="col" className="px-2 py-3 text-center">New</th>
                <th scope="col" className="px-2 py-3 text-center">Acq.</th>
                <th scope="col" className="px-2 py-3 text-center">Cons</th>
                <th scope="col" className="py-3 pl-2 pr-5" aria-label="Azioni" />
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-line">
              {libri.map((l, i) => (
                <tr
                  key={l.id}
                  onClick={() => setLibroAperto(l)}
                  className="cursor-pointer align-top transition hover:bg-paper/60"
                >
                  <td className="py-2.5 pl-5 pr-2 tabular-nums text-ink-muted">{i + 1}</td>
                  <td className="w-[170px] px-2 py-3 text-sm font-semibold text-ink-soft">{l.materia}</td>
                  <td className="px-2 py-2.5">
                    <span className="block font-semibold leading-snug">{l.titolo}</span>
                    <span className="block text-sm text-ink-muted">{l.autori}</span>
                  </td>
                  <td className="w-[150px] px-2 py-3 text-sm text-ink-soft">{l.editore}</td>
                  <td className="px-2 py-2.5">{l.volume}</td>
                  <td className="whitespace-nowrap px-2 py-3 font-mono text-sm">{l.isbn}</td>
                  <td className="whitespace-nowrap px-2 py-2.5 text-right tabular-nums">{formatPrice(l.prezzo)}</td>
                  <td className="px-2 py-2.5 text-center text-sm"><SiNo si={l.nuovaAdozione} /></td>
                  <td className="px-2 py-2.5 text-center text-sm"><SiNo si={l.daAcquistare} /></td>
                  <td className="px-2 py-2.5 text-center text-sm"><SiNo si={l.consigliato} /></td>
                  <td className="py-1.5 pl-2 pr-5 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminaLibro(l);
                      }}
                      className="rounded-full p-2 text-ink-muted transition hover:bg-magenta-soft hover:text-magenta-ink"
                      aria-label={`Elimina ${l.titolo}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <footer className="flex items-center justify-between border-t border-paper-line bg-paper/60 px-5 py-3">
        <span className="text-sm text-ink-muted">{pluralize(libri.length, "libro", "libri")}</span>
        <span className="text-lg font-extrabold tabular-nums">Totale {formatPrice(totale)}</span>
      </footer>

      <LibroModal
        open={libroAperto !== undefined}
        schedaId={schedaId}
        libro={libroAperto ?? null}
        onClose={() => setLibroAperto(undefined)}
        onSaved={aggiorna}
      />
      <ClasseModal
        open={modificaClasse}
        scuolaId={scheda.scuolaId}
        schedaId={scheda.id}
        iniziali={{ anno: scheda.anno, classe: scheda.classe, corso: scheda.corso }}
        onClose={() => setModificaClasse(false)}
        onSaved={aggiorna}
      />
      {dialog}
    </section>
  );
}
