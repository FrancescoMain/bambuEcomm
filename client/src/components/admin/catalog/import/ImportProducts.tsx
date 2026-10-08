"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FileSpreadsheet, Upload, X, XCircle } from "lucide-react";
import { toast } from "sonner";
import { PageTitle } from "@/components/admin/PageTitle";
import { Button, LinkButton } from "@/components/ui/Button";
import { api, ApiError, errorMessage, revalidateStorefront } from "@/lib/api/client";
import { cn } from "@/lib/cn";
import type { Paginated, ListProduct } from "@/lib/types";
import type { ImportStatus } from "../types";
import { ImportGuide } from "./ImportGuide";
import { ImportProgress, type Counts } from "./ImportProgress";

const POLL_MS = 1500;
const ACCEPT = [".xlsx", ".xls", ".csv"];

/**
 * Il server attuale, finita l'importazione, prova a cancellare un file
 * temporaneo che non esiste e segna il lavoro come "error" anche se i prodotti
 * sono stati importati. Riconosciamo quel messaggio e lo trattiamo come
 * completato (vedi productImport.controller.ts, fs.unlinkSync).
 */
const isCleanupGlitch = (s: ImportStatus) => s.status === "error" && /"path" argument/i.test(s.message || "");


const countProducts = () =>
  api<Paginated<ListProduct>>("/products", { query: { limit: 1 } })
    .then((r) => r.totalProducts)
    .catch(() => null);

export function ImportProducts() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<ImportStatus | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [finished, setFinished] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [fatal, setFatal] = useState<string | null>(null);
  const [newProducts, setNewProducts] = useState<number | null>(null);
  // Il server non ha inviato il riepilogo finale: i conteggi intermedi potrebbero essere incompleti
  const [partial, setPartial] = useState(false);
  const totalBefore = useRef<number | null>(null);
  const cancelRequested = useRef(false);
  const lastProgress = useRef<number | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const running = !!jobId && !finished;

  // Riprende un'importazione già in corso (es. dopo aver ricaricato la pagina)
  useEffect(() => {
    api<{ active: boolean; jobId?: string; status?: ImportStatus }>("/products/import/active")
      .then((res) => {
        if (res.active && res.jobId) {
          setJobId(res.jobId);
          if (res.status) setStatus(res.status);
          toast.info("C'è un'importazione in corso: ne mostro l'avanzamento.");
        }
      })
      .catch(() => undefined);
  }, []);

  const finish = useCallback(async (final: ImportStatus) => {
    setFinished(true);
    if (final.status === "cancelled") toast.info("Importazione interrotta.");
    // Anche un'importazione interrotta o con errori può aver creato prodotti
    revalidateStorefront(["products", "categories"]);
    if (totalBefore.current !== null) {
      const after = await countProducts();
      if (after !== null) setNewProducts(Math.max(0, after - totalBefore.current));
    }
  }, []);

  // Controllo dello stato ogni 1,5 secondi
  useEffect(() => {
    if (!jobId || finished) return;
    let alive = true;
    const tick = async () => {
      try {
        const raw = await api<ImportStatus>("/products/import/status", { query: { jobId } });
        if (!alive) return;
        const glitch = isCleanupGlitch(raw);
        const s: ImportStatus = glitch
          ? {
              ...raw,
              status: cancelRequested.current ? "cancelled" : "done",
              message: undefined,
              // se interrotta resta l'ultimo avanzamento reale, non il 100% del messaggio di errore
              progress: cancelRequested.current ? (lastProgress.current ?? raw.progress) : 100,
            }
          : raw;
        if (glitch) setPartial(true);
        lastProgress.current = s.progress;
        setStatus(s);
        if (s.created !== undefined || s.updated !== undefined || s.errors) {
          setCounts({ created: s.created ?? 0, updated: s.updated ?? 0, errors: s.errors ?? [] });
        }
        if (s.status === "done" || s.status === "error" || s.status === "cancelled") void finish(s);
      } catch (e) {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 404) {
          setFatal("Non trovo più questa importazione: il server potrebbe essere stato riavviato. Controlla i prodotti e, se serve, riprova.");
          void finish({ progress: 0, status: "error" });
        }
        // altri errori di rete: riproviamo al prossimo giro
      }
    };
    void tick();
    const timer = setInterval(tick, POLL_MS);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [jobId, finished, finish]);

  const pick = (f: File | undefined | null) => {
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPT.includes(ext)) {
      toast.error("Formato non supportato: carica un file Excel (.xlsx) o CSV (.csv).");
      return;
    }
    setFile(f);
  };

  const start = async () => {
    if (!file) return;
    setUploading(true);
    setFatal(null);
    setCounts(null);
    setStatus(null);
    setNewProducts(null);
    setPartial(false);
    setFinished(false);
    cancelRequested.current = false;
    lastProgress.current = null;
    try {
      totalBefore.current = await countProducts();
      const form = new FormData();
      form.append("file", file);
      const res = await api<{ jobId: string; alreadyActive?: boolean }>("/products/import", { method: "POST", body: form });
      if (res.alreadyActive) toast.info("C'era già un'importazione in corso: ne mostro l'avanzamento.");
      setJobId(res.jobId);
    } catch (e) {
      toast.error(errorMessage(e, "Caricamento del file non riuscito."));
    } finally {
      setUploading(false);
    }
  };

  const cancel = async () => {
    if (!jobId) return;
    setCancelling(true);
    cancelRequested.current = true;
    try {
      await api("/products/import/cancel", { method: "POST", body: { jobId } });
    } catch (e) {
      toast.error(errorMessage(e, "Non è stato possibile interrompere l'importazione."));
    } finally {
      setCancelling(false);
    }
  };

  const reset = () => {
    setFile(null);
    setJobId(null);
    setStatus(null);
    setCounts(null);
    setFinished(false);
    setFatal(null);
    setNewProducts(null);
    setPartial(false);
    totalBefore.current = null;
    if (input.current) input.current.value = "";
  };

  const progress = Math.max(0, Math.min(100, status?.progress ?? 0));

  return (
    <div>
      <PageTitle
        title="Importa prodotti"
        description="Carica tanti prodotti in una volta da un file Excel o CSV: quelli nuovi vengono creati, quelli già presenti aggiornati."
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          {!jobId ? (
            <section className="card p-5 sm:p-6" aria-labelledby="scegli-file">
              <h2 id="scegli-file" className="mb-4 text-lg font-bold">
                Scegli il file
              </h2>
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  pick(e.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition focus-within:ring-2 focus-within:ring-brand-500 focus-within:ring-offset-2",
                  dragging ? "border-brand-500 bg-brand-50" : "border-paper-line bg-paper hover:border-brand-300 hover:bg-brand-50/40"
                )}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-card">
                  <Upload className="h-6 w-6" />
                </span>
                <span className="mt-4 text-[15px] font-bold text-ink">Trascina qui il file oppure clicca per sceglierlo</span>
                <span className="mt-1 text-sm text-ink-muted">Excel (.xlsx) o CSV (.csv)</span>
                <input
                  ref={input}
                  type="file"
                  accept={ACCEPT.join(",")}
                  className="sr-only"
                  onChange={(e) => pick(e.target.files?.[0])}
                />
              </label>

              {file && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl border border-paper-line p-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <FileSpreadsheet className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold">{file.name}</p>
                    <p className="text-xs text-ink-muted">{(file.size / 1024).toLocaleString("it-IT", { maximumFractionDigits: 0 })} KB</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      if (input.current) input.current.value = "";
                    }}
                    className="rounded-full p-2 text-ink-muted hover:bg-paper-warm hover:text-ink"
                    aria-label="Togli il file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={() => void start()} disabled={!file} loading={uploading}>
                  <Upload className="h-4 w-4" /> Avvia importazione
                </Button>
                {!file && <span className="text-sm text-ink-muted">Prima scegli un file.</span>}
              </div>
            </section>
          ) : (
            <section className="card p-5 sm:p-6" aria-labelledby="stato-import" aria-live="polite">
              <ImportProgress
                running={running}
                status={status}
                counts={counts}
                fatal={fatal}
                progress={progress}
                partial={partial}
                newProducts={newProducts}
                fileName={file?.name}
              />
              <div className="mt-6 flex flex-wrap gap-2">
                {running ? (
                  <Button variant="outline" onClick={() => void cancel()} loading={cancelling} disabled={status?.status === "cancelled"}>
                    <XCircle className="h-4 w-4" /> Interrompi importazione
                  </Button>
                ) : (
                  <>
                    <LinkButton href="/dashboard/prodotti?ordine=newest">Vai ai prodotti</LinkButton>
                    <Button variant="outline" onClick={reset}>
                      Importa un altro file
                    </Button>
                  </>
                )}
              </div>
            </section>
          )}
        </div>
        <ImportGuide />
      </div>
    </div>
  );
}
