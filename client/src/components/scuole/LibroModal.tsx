"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Checkbox, Input } from "@/components/ui/Field";
import { ApiError, errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import type { LibroScheda } from "./types";

type Campi = {
  isbn: string;
  materia: string;
  autori: string;
  titolo: string;
  volume: string;
  editore: string;
  prezzo: string;
  nuovaAdozione: boolean;
  daAcquistare: boolean;
  consigliato: boolean;
};

const VUOTO: Campi = {
  isbn: "",
  materia: "",
  autori: "",
  titolo: "",
  volume: "",
  editore: "",
  prezzo: "",
  nuovaAdozione: false,
  daAcquistare: false,
  consigliato: false,
};

const daLibro = (l: Omit<LibroScheda, "id">): Campi => ({
  ...l,
  prezzo: String(Number(l.prezzo).toFixed(2)).replace(".", ","),
});

/**
 * Aggiunge o modifica un libro della classe. Uscendo dal codice, se il libro è già stato
 * inserito in un'altra classe i campi si compilano da soli (come in GS_MAG).
 */
export function LibroModal({
  open,
  schedaId,
  libro,
  onClose,
  onSaved,
}: {
  open: boolean;
  schedaId: number;
  /** null = nuovo libro */
  libro: LibroScheda | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [campi, setCampi] = useState<Campi>(VUOTO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open) setCampi(libro ? daLibro(libro) : VUOTO);
  }, [open, libro]);

  const set = (k: keyof Campi) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCampi((c) => ({ ...c, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const compilaDaCodice = async () => {
    const isbn = campi.isbn.replace(/[\s-]/g, "");
    if (libro || !isbn || campi.titolo) return;
    try {
      const trovato = await api<Omit<LibroScheda, "id">>(`/libri/catalogo/${encodeURIComponent(isbn)}`);
      setCampi((c) => (c.titolo ? c : daLibro(trovato)));
    } catch (e) {
      if (!(e instanceof ApiError && e.status === 404)) toast.error(errorMessage(e));
    }
  };

  const salva = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      await api(libro ? `/libri/schede/${schedaId}/libri/${libro.id}` : `/libri/schede/${schedaId}/libri`, {
        method: libro ? "PUT" : "POST",
        body: campi,
      });
      toast.success(libro ? "Libro salvato." : "Libro aggiunto.");
      onSaved();
      if (libro) onClose();
      else setCampi(VUOTO);
    } catch (err) {
      toast.error(errorMessage(err, "Non è stato possibile salvare il libro."));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={libro ? "Modifica libro" : "Aggiungi libro"} className="max-w-2xl">
      <form onSubmit={salva} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
          <Input
            label="Codice (ISBN)"
            value={campi.isbn}
            onChange={set("isbn")}
            onBlur={compilaDaCodice}
            inputMode="numeric"
            required
            autoFocus
          />
          <Input label="Materia" value={campi.materia} onChange={set("materia")} required />
        </div>
        <Input label="Titolo" value={campi.titolo} onChange={set("titolo")} required />
        <Input label="Autori" value={campi.autori} onChange={set("autori")} required />
        <div className="grid gap-4 sm:grid-cols-[1fr_100px_130px]">
          <Input label="Editore" value={campi.editore} onChange={set("editore")} required />
          <Input label="Vol." value={campi.volume} onChange={set("volume")} required />
          <Input label="Prezzo (€)" value={campi.prezzo} onChange={set("prezzo")} inputMode="decimal" required />
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <Checkbox label="New (nuovo, non si trova usato)" checked={campi.nuovaAdozione} onChange={set("nuovaAdozione")} />
          <Checkbox label="Da acquistare" checked={campi.daAcquistare} onChange={set("daAcquistare")} />
          <Checkbox label="Consigliato" checked={campi.consigliato} onChange={set("consigliato")} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            {libro ? "Annulla" : "Chiudi"}
          </Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvataggio…" : libro ? "Salva" : "Aggiungi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
