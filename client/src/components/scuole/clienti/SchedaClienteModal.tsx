"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAsync } from "@/components/admin/ops/useAsync";
import { Modal } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import type { SchedaCliente, SchedaRiepilogo, Scuola } from "../types";

type Campi = { cognome: string; nome: string; telefono: string; scuolaId: string; classe: string; acconto: string; note: string };

const daScheda = (s: SchedaCliente): Campi => ({
  cognome: s.cognome,
  nome: s.nome,
  telefono: s.telefono,
  scuolaId: String(s.scuolaId),
  classe: s.classe,
  acconto: Number(s.acconto) ? Number(s.acconto).toFixed(2).replace(".", ",") : "",
  note: s.note,
});

/**
 * Nuova scheda cliente, o modifica dei suoi dati. Scuola e classe si scelgono dalle tendine (le classi
 * dell'anno della scuola); alla creazione arrivano da soli i libri della classe.
 */
export function SchedaClienteModal({
  open,
  anno,
  scheda,
  iniziali,
  onClose,
  onSaved,
}: {
  open: boolean;
  anno: number;
  /** null = nuova scheda */
  scheda: SchedaCliente | null;
  /** Scuola e classe proposte per una nuova scheda (i filtri dell'elenco) */
  iniziali?: { scuolaId?: number | null; classe?: string };
  onClose: () => void;
  onSaved: (s: SchedaCliente) => void;
}) {
  const [campi, setCampi] = useState<Campi>({ cognome: "", nome: "", telefono: "", scuolaId: "", classe: "", acconto: "", note: "" });
  const [salvando, setSalvando] = useState(false);
  const annoScheda = scheda?.anno ?? anno;

  useEffect(() => {
    if (!open) return;
    setCampi(
      scheda
        ? daScheda(scheda)
        : {
            cognome: "",
            nome: "",
            telefono: "",
            scuolaId: iniziali?.scuolaId ? String(iniziali.scuolaId) : "",
            classe: iniziali?.classe ?? "",
            acconto: "",
            note: "",
          }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scheda]);

  const scuole = useAsync(() => (open ? api<Scuola[]>("/libri/scuole", { query: { anno: annoScheda } }) : Promise.resolve([])), [open, annoScheda]);
  const classi = useAsync(
    () =>
      open && campi.scuolaId
        ? api<SchedaRiepilogo[]>(`/libri/scuole/${campi.scuolaId}/schede`, { query: { anno: annoScheda } })
        : Promise.resolve([]),
    [open, campi.scuolaId, annoScheda]
  );
  const classeScelta = classi.data?.find((c) => c.classe === campi.classe);
  // Una classe senza lista dei libri resta selezionabile (in GS_MAG: «Classe inesistente, registrare lo stesso?»)
  const classeFuoriElenco = campi.classe && classi.data && !classeScelta;

  const set = (k: keyof Campi) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setCampi((c) => ({ ...c, [k]: e.target.value, ...(k === "scuolaId" ? { classe: "" } : {}) }));

  const salva = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    try {
      const body = { ...campi, anno: annoScheda, corso: classeScelta?.corso ?? scheda?.corso ?? "" };
      const s = await api<SchedaCliente>(scheda ? `/libri/clienti/${scheda.id}` : "/libri/clienti", {
        method: scheda ? "PUT" : "POST",
        body,
      });
      if (scheda) toast.success("Scheda salvata.");
      else if (s.importazione?.classeTrovata) toast.success(`Scheda n. ${s.numero}: ${s.libri.length} libri della classe ${s.classe}.`);
      else toast.warning(`Scheda n. ${s.numero} creata. La classe ${s.classe} non ha ancora la lista dei libri.`);
      onSaved(s);
      onClose();
    } catch (err) {
      toast.error(errorMessage(err, "Non è stato possibile salvare la scheda."));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={scheda ? `Scheda n. ${scheda.numero}` : `Nuova scheda ${annoScheda}`} className="max-w-xl">
      <form onSubmit={salva} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Cognome" value={campi.cognome} onChange={set("cognome")} required autoFocus />
          <Input label="Nome dell'alunno" value={campi.nome} onChange={set("nome")} required />
        </div>
        <Input label="Telefono" value={campi.telefono} onChange={set("telefono")} inputMode="tel" />
        <Select label="Scuola" value={campi.scuolaId} onChange={set("scuolaId")} required>
          <option value="">{scuole.data?.length ? "Scegli la scuola…" : "Nessuna scuola: aggiungila in Scuole"}</option>
          {scuole.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome} — {s.citta ?? s.codice}
            </option>
          ))}
        </Select>
        <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
          <Select label="Classe" value={campi.classe} onChange={set("classe")} required disabled={!campi.scuolaId}>
            <option value="">{classi.data?.length ? "Scegli la classe…" : "Nessuna classe nel " + annoScheda}</option>
            {classeFuoriElenco && <option value={campi.classe}>{campi.classe} (senza lista)</option>}
            {classi.data?.map((c) => (
              <option key={c.id} value={c.classe}>
                {c.classe}
                {c.corso ? ` · ${c.corso}` : ""} — {c.numeroLibri} libri
              </option>
            ))}
          </Select>
          <Input label="Acconto (€)" value={campi.acconto} onChange={set("acconto")} inputMode="decimal" placeholder="0" hint="Anche dopo, dalla scheda" />
        </div>
        <Textarea label="Appunti" value={campi.note} onChange={set("note")} rows={2} maxLength={1000} hint="Solo per voi: non vanno in stampa." />
        {!scheda && <p className="text-sm text-ink-muted">Salvando arrivano tutti i libri della classe: poi spunti quelli che prenota.</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button type="submit" disabled={salvando}>
            {salvando ? "Salvataggio…" : scheda ? "Salva" : "Crea scheda"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
