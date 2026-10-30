"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import { pluralize } from "@/components/admin/catalog/utils";
import type { EsitoImport, Scuola } from "./types";

const VUOTA = { codice: "", nome: "", tipo: "", indirizzo: "", cap: "", citta: "", provincia: "" };
type Campi = typeof VUOTA;

/**
 * Nuova scuola in un passo: codice meccanografico + Invio → anagrafica dal Ministero, scuola salvata
 * e tutte le classi dell'anno importate coi loro libri. Se il Ministero non la trova si scrive a mano.
 */
export function NuovaScuolaModal({
  open,
  anno,
  esistenti,
  onClose,
  onCreated,
}: {
  open: boolean;
  anno: number;
  /** Scuole già in elenco: se il codice è fra queste si apre quella invece di dare errore */
  esistenti: Scuola[];
  onClose: () => void;
  onCreated: (s: Scuola) => void;
}) {
  const [campi, setCampi] = useState<Campi>(VUOTA);
  const [aMano, setAMano] = useState(false);
  const [lavoro, setLavoro] = useState<string | null>(null);
  const set = (k: keyof Campi) => (e: React.ChangeEvent<HTMLInputElement>) => setCampi({ ...campi, [k]: e.target.value });

  const chiudi = () => {
    setCampi(VUOTA);
    setAMano(false);
    onClose();
  };

  const salva = (dati: Campi) => api<Scuola>("/libri/scuole", { method: "POST", body: dati });

  const dalMinistero = async () => {
    const codice = campi.codice.trim().toUpperCase();
    const presente = esistenti.find((s) => s.codice === codice);
    if (presente) {
      toast.info(`${presente.nome} è già in elenco: la apro.`);
      onCreated(presente);
      chiudi();
      return;
    }
    let trovata: Scuola;
    setLavoro("Cerco la scuola…");
    try {
      trovata = await api<Scuola>(`/libri/scuole/ministero/${encodeURIComponent(campi.codice.trim())}`);
    } catch (e) {
      toast.error(errorMessage(e, "Scuola non trovata."));
      setAMano(true);
      setLavoro(null);
      return;
    }
    try {
      setLavoro("Salvo la scuola…");
      const { id: _id, classi: _c, ...anagrafica } = trovata;
      const s = await salva({ ...VUOTA, ...anagrafica } as Campi);
      setLavoro("Importo classi e libri…");
      try {
        const e = await api<EsitoImport>(`/libri/scuole/${s.id}/importa`, { method: "POST", body: { anno } });
        toast.success(
          `${s.nome}: ${pluralize(e.schedeCreate, "classe", "classi")} e ${pluralize(e.libriAggiunti, "libro", "libri")} del ${anno}.`
        );
      } catch (err) {
        toast.warning(`${s.nome} aggiunta, ma le classi non sono arrivate: ${errorMessage(err)} Riprova con «Importa tutte le classi».`);
      }
      onCreated(s);
      chiudi();
    } catch (err) {
      toast.error(errorMessage(err, "Non è stato possibile salvare la scuola."));
    } finally {
      setLavoro(null);
    }
  };

  const invia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aMano) return dalMinistero();
    setLavoro("Salvo la scuola…");
    try {
      const s = await salva(campi);
      toast.success(`${s.nome} aggiunta.`);
      onCreated(s);
      chiudi();
    } catch (err) {
      toast.error(errorMessage(err, "Non è stato possibile salvare la scuola."));
    } finally {
      setLavoro(null);
    }
  };

  const codiceOk = campi.codice.trim().length === 10;

  return (
    <Modal open={open} onClose={chiudi} title="Nuova scuola" className="max-w-xl">
      <form onSubmit={invia} className="space-y-4">
        <Input
          label="Codice scuola"
          value={campi.codice}
          onChange={set("codice")}
          placeholder="NAPS930006"
          hint={
            aMano
              ? "Il Ministero non l'ha trovata: scrivi i dati qui sotto."
              : `Scrivi il codice e premi Invio: arrivano la scuola e tutte le classi del ${anno} coi libri.`
          }
          required
          autoFocus
        />
        {aMano && (
          <>
            <Input label="Scuola" value={campi.nome} onChange={set("nome")} required />
            <Input label="Tipo scuola" value={campi.tipo} onChange={set("tipo")} />
            <Input label="Indirizzo" value={campi.indirizzo} onChange={set("indirizzo")} />
            <div className="grid gap-4 sm:grid-cols-[110px_1fr_140px]">
              <Input label="CAP" value={campi.cap} onChange={set("cap")} />
              <Input label="Città" value={campi.citta} onChange={set("citta")} />
              <Input label="Provincia" value={campi.provincia} onChange={set("provincia")} />
            </div>
          </>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={() => setAMano(!aMano)}
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            {aMano ? "Cerca sul sito del Ministero" : "Scrivi i dati a mano"}
          </button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={chiudi}>
              Annulla
            </Button>
            {aMano ? (
              <Button type="submit" disabled={!!lavoro || !campi.codice.trim() || !campi.nome.trim()}>
                {lavoro ?? "Salva scuola"}
              </Button>
            ) : (
              <Button type="submit" disabled={!!lavoro || !codiceOk}>
                <Download className="h-4 w-4" /> {lavoro ?? "Aggiungi con le classi"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
