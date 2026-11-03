"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import type { Venditore, VenditoreRiepilogo } from "../types";

const VUOTO = { cognome: "", nome: "", telefono: "", note: "" };

/** Nuovo venditore (chi porta libri usati al banco) o modifica dei suoi dati. */
export function VenditoreModal({
  open,
  venditore,
  onClose,
  onSaved,
}: {
  open: boolean;
  /** null = nuovo */
  venditore: VenditoreRiepilogo | null;
  onClose: () => void;
  onSaved: (v: Venditore) => void;
}) {
  const [campi, setCampi] = useState(VUOTO);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open) setCampi(venditore ? { cognome: venditore.cognome, nome: venditore.nome, telefono: venditore.telefono, note: venditore.note } : VUOTO);
  }, [open, venditore]);

  const set = (k: keyof typeof VUOTO) => (e: React.ChangeEvent<HTMLInputElement>) => setCampi((c) => ({ ...c, [k]: e.target.value }));

  const salva = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const v = await api<Venditore>(venditore ? `/libri/usati/venditori/${venditore.id}` : "/libri/usati/venditori", {
        method: venditore ? "PUT" : "POST",
        body: campi,
      });
      toast.success(venditore ? "Venditore salvato." : "Venditore creato.");
      onSaved(v);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={venditore ? "Dati del venditore" : "Nuovo venditore"} className="max-w-lg">
      <form onSubmit={salva} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Cognome" value={campi.cognome} onChange={set("cognome")} required autoFocus />
          <Input label="Nome" value={campi.nome} onChange={set("nome")} required />
        </div>
        <Input label="Telefono" value={campi.telefono} onChange={set("telefono")} inputMode="tel" />
        <Input label="Appunti" value={campi.note} onChange={set("note")} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvataggio…" : venditore ? "Salva" : "Crea"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
