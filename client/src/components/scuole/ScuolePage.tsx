"use client";

import { useState } from "react";
import { Download, Plus, School } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/admin/PageTitle";
import { Callout } from "@/components/admin/ops/Callout";
import { useAsync } from "@/components/admin/ops/useAsync";
import { useQueryParams } from "@/components/admin/ops/useQueryParams";
import { useConfirm } from "@/components/admin/useConfirm";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Spinner";
import { errorMessage } from "@/lib/api/client";
import { api } from "@/lib/api/scuole";
import { formatPrice } from "@/lib/format";
import { pluralize } from "@/components/admin/catalog/utils";
import { ClasseModal } from "./ClasseModal";
import { NuovaScuolaModal } from "./NuovaScuolaModal";
import { SchedaClasse } from "./SchedaClasse";
import { anniDisponibili, type EsitoImport, type SchedaRiepilogo, type Scuola } from "./types";

/** Sezione Scuole del gestionale libri: anno → scuola → classe, con le tendine. */
export function ScuolePage() {
  const [params, setParams] = useQueryParams();
  const anno = Number(params.get("anno")) || new Date().getFullYear();
  const scuolaId = Number(params.get("scuola")) || null;
  const schedaId = Number(params.get("classe")) || null;

  const scuole = useAsync(() => api<Scuola[]>("/libri/scuole", { query: { anno } }), [anno]);
  const schede = useAsync(
    () => (scuolaId ? api<SchedaRiepilogo[]>(`/libri/scuole/${scuolaId}/schede`, { query: { anno } }) : Promise.resolve([])),
    [scuolaId, anno]
  );
  const scuola = scuole.data?.find((s) => s.id === scuolaId) ?? null;

  const [nuovaScuola, setNuovaScuola] = useState(false);
  const [nuovaClasse, setNuovaClasse] = useState(false);
  const [importando, setImportando] = useState(false);
  const [confirm, dialog] = useConfirm();

  const aggiornaElenchi = () => {
    scuole.reload();
    schede.reload();
  };

  const importaScuola = async () => {
    // Senza conferma: classi e libri già presenti non vengono toccati
    if (!scuola) return;
    setImportando(true);
    try {
      const e = await api<EsitoImport>(`/libri/scuole/${scuola.id}/importa`, { method: "POST", body: { anno } });
      toast.success(
        `${pluralize(e.schedeCreate, "classe nuova", "classi nuove")}, ${pluralize(e.libriAggiunti, "libro aggiunto", "libri aggiunti")}.`
      );
      aggiornaElenchi();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setImportando(false);
    }
  };

  const eliminaScuola = async () => {
    if (!scuola) return;
    if (!(await confirm({ title: `Eliminare ${scuola.nome}?`, confirmLabel: "Elimina", danger: true }))) return;
    try {
      await api(`/libri/scuole/${scuola.id}`, { method: "DELETE" });
      setParams({ scuola: null, classe: null });
      scuole.reload();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <PageTitle
        title="Scuole"
        description="I libri adottati da ogni classe, presi dal sito del Ministero o scritti a mano. Da qui si copiano nelle prenotazioni dei clienti."
        actions={
          <Button variant="outline" onClick={() => setNuovaScuola(true)}>
            <Plus className="h-4 w-4" /> Nuova scuola
          </Button>
        }
      />

      <div className="card mb-5 grid gap-4 p-4 sm:grid-cols-[120px_minmax(0,2fr)_minmax(0,1fr)] sm:p-5">
        <Select label="Anno" value={anno} onChange={(e) => setParams({ anno: e.target.value, classe: null })}>
          {anniDisponibili().map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
        <Select
          label="Scuola"
          value={scuolaId ?? ""}
          onChange={(e) => setParams({ scuola: e.target.value, classe: null })}
          disabled={!scuole.data?.length}
        >
          <option value="">{scuole.data?.length ? "Scegli la scuola…" : "Nessuna scuola"}</option>
          {scuole.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome} — {s.citta ?? s.codice}
              {s.classi ? ` (${s.classi})` : ""}
            </option>
          ))}
        </Select>
        <Select
          label="Classe"
          value={schedaId ?? ""}
          onChange={(e) => setParams({ classe: e.target.value })}
          disabled={!scuolaId || !schede.data?.length}
        >
          <option value="">{schede.data?.length ? "Tutte le classi" : "Nessuna classe"}</option>
          {schede.data?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.classe}
              {s.corso ? ` · ${s.corso}` : ""}
            </option>
          ))}
        </Select>
      </div>

      {scuole.error ? (
        <Callout tone="danger">{scuole.error}</Callout>
      ) : !scuole.data ? (
        <Skeleton className="h-48" />
      ) : scuole.data.length === 0 ? (
        <EmptyState
          icon={<School className="h-7 w-7" />}
          title="Nessuna scuola"
          text="Aggiungi la prima scuola con il suo codice: l'indirizzo arriva dal sito del Ministero."
          action={<Button onClick={() => setNuovaScuola(true)}>Nuova scuola</Button>}
          className="card"
        />
      ) : !scuola ? (
        <p className="text-[15px] text-ink-muted">Scegli una scuola per vedere le sue classi.</p>
      ) : schedaId ? (
        <SchedaClasse
          key={schedaId}
          schedaId={schedaId}
          onChanged={schede.reload}
          onDeleted={() => {
            setParams({ classe: null });
            aggiornaElenchi();
          }}
        />
      ) : (
        <section className="card overflow-hidden">
          <header className="flex flex-col gap-3 border-b border-paper-line p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div className="min-w-0">
              <h2 className="text-xl font-extrabold">{scuola.nome}</h2>
              <p className="text-sm text-ink-soft">
                {[scuola.tipo, scuola.indirizzo, [scuola.cap, scuola.citta].filter(Boolean).join(" "), scuola.provincia]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="mt-0.5 font-mono text-xs text-ink-muted">{scuola.codice}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => setNuovaClasse(true)}>
                <Plus className="h-4 w-4" /> Nuova classe
              </Button>
              <Button size="sm" variant="secondary" onClick={importaScuola} disabled={importando}>
                <Download className="h-4 w-4" /> {importando ? "Importo…" : "Importa tutte le classi"}
              </Button>
            </div>
          </header>

          {schede.error ? (
            <Callout tone="danger" className="m-4">
              {schede.error}
            </Callout>
          ) : !schede.data ? (
            <Skeleton className="m-4 h-32" />
          ) : schede.data.length === 0 ? (
            <EmptyState
              title={`Nessuna classe nel ${anno}`}
              text="«Importa tutte le classi» le prende dal sito del Ministero con i loro libri."
              action={
                <Button variant="ghost" size="sm" onClick={eliminaScuola}>
                  Elimina la scuola
                </Button>
              }
            />
          ) : (
            <ul className="grid gap-px bg-paper-line sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
              {schede.data.map((s) => (
                <li key={s.id} className="bg-white">
                  <button
                    type="button"
                    onClick={() => setParams({ classe: s.id }, "push")}
                    className="flex h-full w-full items-start justify-between gap-3 px-5 py-4 text-left transition hover:bg-paper/60"
                  >
                    <span className="min-w-0">
                      <span className="block text-xl font-extrabold">{s.classe}</span>
                      {s.corso && <span className="block truncate text-sm text-ink-muted">{s.corso}</span>}
                    </span>
                    <span className="shrink-0 text-right text-base">
                      <span className="block font-semibold tabular-nums">{formatPrice(s.totale)}</span>
                      <span className="block text-sm text-ink-muted">{pluralize(s.numeroLibri, "libro", "libri")}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <NuovaScuolaModal
        open={nuovaScuola}
        anno={anno}
        esistenti={scuole.data ?? []}
        onClose={() => setNuovaScuola(false)}
        onCreated={(s) => {
          scuole.reload();
          setParams({ scuola: s.id, classe: null });
        }}
      />
      {scuola && (
        <ClasseModal
          open={nuovaClasse}
          scuolaId={scuola.id}
          schedaId={null}
          iniziali={{ anno, classe: "", corso: "" }}
          onClose={() => setNuovaClasse(false)}
          onSaved={(s) => {
            setParams({ anno: s.anno, classe: s.id });
            aggiornaElenchi();
          }}
        />
      )}
      {dialog}
    </div>
  );
}
