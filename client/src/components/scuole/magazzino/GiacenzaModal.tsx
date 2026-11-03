"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAsync } from "@/components/admin/ops/useAsync";
import { Modal } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { ApiError, errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { CAUSALI, type GiacenzaDettaglio, type GiacenzaRiepilogo, type LibroScheda } from "../types";

type Campi = { isbn: string; materia: string; autori: string; titolo: string; volume: string; editore: string; prezzo: string; quantita: string };

const VUOTO: Campi = { isbn: "", materia: "", autori: "", titolo: "", volume: "", editore: "", prezzo: "", quantita: "1" };

const prezzoScritto = (p: string | number) => Number(p).toFixed(2).replace(".", ",");

/**
 * Un libro del magazzino: nuovo (codice, dati e copie) o già presente (dati, quantità contata e movimenti).
 * Per un codice nuovo i dati arrivano dalle classi uscendo dal campo, come nelle schede.
 */
export function GiacenzaModal({
  open,
  giacenza,
  isbnIniziale,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** null = libro nuovo */
  giacenza: GiacenzaRiepilogo | null;
  /** Codice letto col lettore e mai visto prima */
  isbnIniziale: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [campi, setCampi] = useState<Campi>(VUOTO);
  const [salvando, setSalvando] = useState(false);
  const isbn = giacenza?.isbn;
  const dettaglio = useAsync(
    () => (open && isbn ? api<GiacenzaDettaglio>(`/libri/magazzino/${encodeURIComponent(isbn)}`) : Promise.resolve(null)),
    [open, isbn]
  );

  useEffect(() => {
    if (!open) return;
    setCampi(
      giacenza
        ? { ...giacenza, prezzo: prezzoScritto(giacenza.prezzo), quantita: String(giacenza.quantita) }
        : { ...VUOTO, isbn: isbnIniziale }
    );
  }, [open, giacenza, isbnIniziale]);

  const set = (k: keyof Campi) => (e: React.ChangeEvent<HTMLInputElement>) => setCampi((c) => ({ ...c, [k]: e.target.value }));

  const compilaDaCodice = async () => {
    const codice = campi.isbn.replace(/[\s-]/g, "");
    if (giacenza || !codice || campi.titolo) return;
    try {
      const l = await api<Omit<LibroScheda, "id">>(`/libri/catalogo/${encodeURIComponent(codice)}`);
      setCampi((c) => (c.titolo ? c : { ...c, ...l, prezzo: prezzoScritto(l.prezzo), quantita: c.quantita }));
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) toast.error(errorMessage(e));
    }
  };

  const salva = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      if (giacenza) {
        await api(`/libri/magazzino/${encodeURIComponent(giacenza.isbn)}`, { method: "PUT", body: campi });
        toast.success("Libro salvato.");
      } else {
        const g = await api<GiacenzaDettaglio>("/libri/magazzino/carico", { method: "POST", body: campi });
        toast.success(`«${g.titolo}»: ${g.quantita} in negozio.`);
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Non è stato possibile salvare il libro."));
    } finally {
      setSalvando(false);
    }
  };

  const elimina = async () => {
    if (!giacenza) return;
    try {
      await api(`/libri/magazzino/${encodeURIComponent(giacenza.isbn)}`, { method: "DELETE" });
      toast.success(`«${giacenza.titolo}» tolto dal magazzino.`);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const movimenti = dettaglio.data?.movimenti ?? [];

  return (
    <Modal open={open} onClose={onClose} title={giacenza ? "Libro in magazzino" : "Aggiungi libro al magazzino"} className="max-w-2xl">
      <form onSubmit={salva} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <Input
            label="Codice (ISBN)"
            value={campi.isbn}
            onChange={set("isbn")}
            onBlur={compilaDaCodice}
            inputMode="numeric"
            required
            disabled={!!giacenza}
            autoFocus={!giacenza && !isbnIniziale}
          />
          <Input
            label={giacenza ? "In negozio" : "Copie"}
            value={campi.quantita}
            onChange={set("quantita")}
            inputMode="numeric"
            required
            autoFocus={!!giacenza}
          />
        </div>
        <Input label="Titolo" value={campi.titolo} onChange={set("titolo")} required autoFocus={!giacenza && !!isbnIniziale} />
        <Input label="Autori" value={campi.autori} onChange={set("autori")} required />
        <Input label="Materia" value={campi.materia} onChange={set("materia")} required />
        <div className="grid gap-4 sm:grid-cols-[1fr_90px_120px]">
          <Input label="Editore" value={campi.editore} onChange={set("editore")} required />
          <Input label="Vol." value={campi.volume} onChange={set("volume")} required />
          <Input label="Prezzo (€)" value={campi.prezzo} onChange={set("prezzo")} inputMode="decimal" required />
        </div>
        {giacenza && <p className="text-sm text-ink-muted">Se conti le copie e il numero non torna, scrivi quante ce ne sono davvero.</p>}

        <div className="flex items-center gap-2 pt-2">
          {giacenza && giacenza.quantita === 0 && (
            <Button type="button" variant="ghost" onClick={elimina}>
              <Trash2 className="h-4 w-4" /> Togli dal magazzino
            </Button>
          )}
          <span className="flex-1" />
          <Button type="button" variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvataggio…" : giacenza ? "Salva" : "Aggiungi"}
          </Button>
        </div>
      </form>

      {giacenza && movimenti.length > 0 && (
        <section className="mt-6 border-t border-paper-line pt-4">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-muted">Movimenti</h3>
          <ul className="max-h-60 divide-y divide-paper-line overflow-y-auto text-[15px]">
            {movimenti.map((m) => (
              <li key={m.id} className="flex items-baseline gap-3 py-2">
                <span className={cn("w-12 text-right font-extrabold tabular-nums", m.delta > 0 ? "text-leaf-ink" : "text-magenta-ink")}>
                  {m.delta > 0 ? `+${m.delta}` : m.delta}
                </span>
                <span className="flex-1">
                  {CAUSALI[m.causale]}
                  {m.cliente && (
                    <span className="text-ink-muted">
                      {" "}
                      · {m.cliente.cognome} {m.cliente.nome} (scheda n. {m.cliente.numero})
                    </span>
                  )}
                  {m.bolla && <span className="text-ink-muted"> n. {m.bolla.numero}</span>}
                </span>
                <span className="whitespace-nowrap text-sm text-ink-muted">{formatDateTime(m.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Modal>
  );
}
