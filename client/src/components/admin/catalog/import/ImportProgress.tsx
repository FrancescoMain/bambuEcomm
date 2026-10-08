"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import type { ImportStatus } from "../types";
import { pluralize } from "../utils";

export type Counts = { created: number; updated: number; errors: NonNullable<ImportStatus["errors"]> };

/** Avanzamento e riepilogo di un'importazione */
export function ImportProgress({
  running,
  status,
  counts,
  fatal,
  progress,
  partial,
  newProducts,
  fileName,
}: {
  running: boolean;
  status: ImportStatus | null;
  counts: Counts | null;
  fatal: string | null;
  progress: number;
  partial: boolean;
  newProducts: number | null;
  fileName?: string;
}) {
  const state = status?.status;
  const failed = !!fatal || state === "error";
  const title = running
    ? "Importazione in corso…"
    : failed
      ? "L'importazione si è interrotta"
      : state === "cancelled"
        ? "Importazione interrotta"
        : "Importazione completata";
  const Icon = running ? null : failed ? AlertTriangle : state === "cancelled" ? XCircle : CheckCircle2;
  const total = status?.totalRows;
  const row = status?.currentRow !== undefined ? status.currentRow + 1 : null;

  return (
    <div>
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            running ? "bg-sky-soft text-sky-ink" : failed ? "bg-magenta-soft text-magenta-ink" : state === "cancelled" ? "bg-paper-warm text-ink-muted" : "bg-brand-50 text-brand-700"
          )}
        >
          {Icon ? <Icon className="h-5 w-5" /> : <Spinner className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <h2 id="stato-import" className="text-lg font-bold">
            {title}
          </h2>
          <p className="text-sm text-ink-muted">
            {running
              ? "Puoi restare su questa pagina o tornarci più tardi: l'importazione continua da sola."
              : fileName
                ? `File: ${fileName}`
                : "Ecco il riepilogo."}
          </p>
        </div>
      </div>

      {(running || progress > 0) && (
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-sm">
            <span className="font-semibold">{progress}%</span>
            {total ? (
              <span className="text-ink-muted">
                Riga {Math.min(row ?? 0, total)} di {total}
              </span>
            ) : null}
          </div>
          <div
            className="h-3 overflow-hidden rounded-full bg-paper-warm"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Avanzamento importazione"
          >
            <div className="h-full rounded-full bg-brand-500 transition-[width] duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {(fatal || (failed && status?.message)) && (
        <p className="mt-4 rounded-xl bg-magenta-soft p-3 text-sm text-magenta-ink">{fatal || status?.message}</p>
      )}

      {partial && !running && newProducts !== null ? (
        <p className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
          {newProducts > 0
            ? `${pluralize(newProducts, "nuovo prodotto aggiunto", "nuovi prodotti aggiunti")} al catalogo. Le righe con un prodotto già presente (stesso nome e categoria) lo hanno aggiornato.`
            : "Nessun nuovo prodotto nel catalogo: le righe del file corrispondevano a prodotti già presenti, che sono stati aggiornati."}
          <span className="mt-1 block text-ink-soft">
            Se qualche prodotto manca, controlla che nel file abbia nome, prezzo e categoria e importalo di nuovo.
          </span>
        </p>
      ) : counts ? (
        <>
          <dl className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-brand-50 p-3 text-center">
              <dt className="text-xs font-semibold text-brand-700">Creati</dt>
              <dd className="text-2xl font-extrabold text-brand-800">{counts.created}</dd>
            </div>
            <div className="rounded-2xl bg-sky-soft p-3 text-center">
              <dt className="text-xs font-semibold text-sky-ink">Aggiornati</dt>
              <dd className="text-2xl font-extrabold text-sky-ink">{counts.updated}</dd>
            </div>
            <div className={cn("rounded-2xl p-3 text-center", counts.errors.length ? "bg-magenta-soft" : "bg-paper")}>
              <dt className={cn("text-xs font-semibold", counts.errors.length ? "text-magenta-ink" : "text-ink-muted")}>
                Righe con errori
              </dt>
              <dd className={cn("text-2xl font-extrabold", counts.errors.length ? "text-magenta-ink" : "text-ink-muted")}>
                {counts.errors.length}
              </dd>
            </div>
          </dl>
          {partial && !running && (
            <p className="mt-2 text-xs text-ink-muted">Numeri aggiornati all&apos;ultimo controllo dell&apos;avanzamento.</p>
          )}
        </>
      ) : null}

      {counts && counts.errors.length > 0 && (
        <details className="mt-4 rounded-2xl border border-paper-line" open={!running && counts.errors.length <= 5}>
          <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold">
            Vedi le righe con errori ({counts.errors.length})
          </summary>
          <ol className="max-h-64 list-decimal space-y-1 overflow-y-auto border-t border-paper-line py-3 pl-10 pr-4 text-sm text-ink-soft">
            {counts.errors.map((e, i) => (
              <li key={i}>
                {e.row !== undefined ? `Riga ${e.row + 2}: ` : ""}
                {e.error}
              </li>
            ))}
          </ol>
          <p className="border-t border-paper-line px-4 py-2.5 text-xs text-ink-muted">
            Correggi queste righe nel file e importalo di nuovo: i prodotti già importati verranno solo aggiornati.
          </p>
        </details>
      )}

      {!running && !failed && state !== "cancelled" && (
        <p className="mt-4 text-sm text-ink-muted">
          Controlla i nuovi prodotti nella{" "}
          <Link href="/dashboard/prodotti" className="font-semibold text-brand-600 hover:text-brand-700">
            lista prodotti
          </Link>
          : puoi aggiungere foto, varianti e sconti in qualsiasi momento.
        </p>
      )}
    </div>
  );
}
