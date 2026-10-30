"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import { anniDisponibili } from "./types";

type Valori = { anno: number; classe: string; corso: string };

/** Nuova classe a mano, o modifica di anno/classe/corso di una esistente. */
export function ClasseModal({
  open,
  scuolaId,
  schedaId,
  iniziali,
  onClose,
  onSaved,
}: {
  open: boolean;
  scuolaId: number;
  /** null = nuova classe */
  schedaId: number | null;
  iniziali: Valori;
  onClose: () => void;
  onSaved: (s: { id: number } & Valori) => void;
}) {
  const [v, setV] = useState<Valori>(iniziali);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open) setV(iniziali);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const salva = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const s = await api<{ id: number } & Valori>(schedaId ? `/libri/schede/${schedaId}` : "/libri/schede", {
        method: schedaId ? "PUT" : "POST",
        body: { ...v, scuolaId },
      });
      toast.success(`Classe ${s.classe} salvata.`);
      onSaved(s);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Non è stato possibile salvare la classe."));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={schedaId ? "Modifica classe" : "Nuova classe"}>
      <form onSubmit={salva} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
          <Select label="Anno" value={v.anno} onChange={(e) => setV({ ...v, anno: Number(e.target.value) })}>
            {anniDisponibili().map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
          <Input
            label="Classe"
            value={v.classe}
            onChange={(e) => setV({ ...v, classe: e.target.value.replace(/\s+/g, "").toUpperCase() })}
            placeholder="1A"
            hint="Anno e sezione attaccati, come li scrive il Ministero."
            required
            autoFocus
          />
        </div>
        <Input
          label="Corso"
          value={v.corso}
          onChange={(e) => setV({ ...v, corso: e.target.value })}
          hint="Facoltativo: indirizzo o tempo scuola."
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={salvando || !v.classe}>
            {salvando ? "Salvataggio…" : "Salva"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
