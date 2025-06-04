"use client";
import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { fetchCategoriesStart } from "@/redux/categorySlice";
import {
  selectParentCategories,
  selectCategoriesLoading,
} from "@/redux/categorySelectors";

type ImportError = { codiceProdotto?: string; error: string };
type ImportResult = {
  created: number;
  updated: number;
  errors: ImportError[];
  currentRow?: number;
  totalRows?: number;
};

const ProductImportForm: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const token = useSelector((state: RootState) => state.auth.token);
  const dispatch = useDispatch();
  const parentCategories = useSelector(selectParentCategories);
  const categoriesLoading = useSelector(selectCategoriesLoading);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setJobId(null);
    setProgress(0);
    setStatus(null);
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000/api/products/import";
      const res = await fetch(backendUrl, {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Errore importazione");
      if (data.jobId) {
        setJobId(data.jobId);
        setStatus("processing");
        setIsPolling(true);
        // Se il backend segnala che c'è già un job attivo, avvia polling senza aspettare upload
        if (data.alreadyActive) {
          // Avvia polling immediato per jobId già attivo
          pollingRef.current = setInterval(async () => {
            try {
              const statusRes = await fetch(
                `${backendUrl}/status?jobId=${data.jobId}`,
                {
                  headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : undefined,
                }
              );
              if (statusRes.status === 401 || statusRes.status === 403) {
                setError(
                  "Sessione scaduta o non autorizzata. L'importazione prosegue in background. Effettua di nuovo il login per monitorare lo stato."
                );
                setIsPolling(false);
                setLoading(false);
                if (pollingRef.current) clearInterval(pollingRef.current);
                return;
              }
              const statusData = await statusRes.json();
              setProgress(statusData.progress || 0);
              setStatus(statusData.status);
              setResult(statusData);
              if (
                statusData.status === "done" ||
                statusData.status === "error"
              ) {
                setIsPolling(false);
                setLoading(false);
                if (pollingRef.current) clearInterval(pollingRef.current);
              }
            } catch (err) {
              setError("Errore nel polling dello stato import");
              setIsPolling(false);
              if (pollingRef.current) clearInterval(pollingRef.current);
            }
          }, 1500);
          setLoading(false); // Non mostrare loading se non stiamo caricando un nuovo file
          return;
        }
        // Avvia polling normale dopo upload
        pollingRef.current = setInterval(async () => {
          try {
            const statusRes = await fetch(
              `${backendUrl}/status?jobId=${data.jobId}`,
              {
                headers: token
                  ? { Authorization: `Bearer ${token}` }
                  : undefined,
              }
            );
            if (statusRes.status === 401 || statusRes.status === 403) {
              setError(
                "Sessione scaduta o non autorizzata. L'importazione prosegue in background. Effettua di nuovo il login per monitorare lo stato."
              );
              setIsPolling(false);
              setLoading(false);
              if (pollingRef.current) clearInterval(pollingRef.current);
              return;
            }
            const statusData = await statusRes.json();
            setProgress(statusData.progress || 0);
            setStatus(statusData.status);
            setResult(statusData);
            if (statusData.status === "done" || statusData.status === "error") {
              setIsPolling(false);
              setLoading(false);
              if (pollingRef.current) clearInterval(pollingRef.current);
            }
          } catch (err) {
            setError("Errore nel polling dello stato import");
            setIsPolling(false);
            if (pollingRef.current) clearInterval(pollingRef.current);
          }
        }, 1500);
      } else {
        setError("Risposta backend senza jobId");
        setLoading(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  const handleStopPolling = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setIsPolling(false);
    setLoading(false);
    setStatus("interrotto");
  };

  // Annulla davvero il job di import
  const handleCancelJob = async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000/api/products/import";
      const res = await fetch(`${backendUrl}/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Errore annullamento job");
      setStatus("cancelled");
      setError("Importazione annullata dall'utente.");
      setIsPolling(false);
      setLoading(false);
      if (pollingRef.current) clearInterval(pollingRef.current);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    }
  };

  // Polling per job attivo all'avvio
  useEffect(() => {
    const checkActiveJob = async () => {
      setError(null);
      setResult(null);
      setJobId(null);
      setProgress(0);
      setStatus(null);
      const backendUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:5000/api/products/import";
      try {
        const res = await fetch(`${backendUrl}/active`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const data = await res.json();
        if (data.active && data.jobId) {
          setJobId(data.jobId);
          setStatus(data.status?.status || "processing");
          setIsPolling(true);
          // Mostra subito lo stato attuale del job (dettagli)
          if (data.status) {
            setProgress(data.status.progress || 0);
            setResult(data.status);
          }
          // Avvia polling per jobId attivo
          pollingRef.current = setInterval(async () => {
            try {
              const statusRes = await fetch(
                `${backendUrl}/status?jobId=${data.jobId}`,
                {
                  headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : undefined,
                }
              );
              if (statusRes.status === 401 || statusRes.status === 403) {
                setError(
                  "Sessione scaduta o non autorizzata. L'importazione prosegue in background. Effettua di nuovo il login per monitorare lo stato."
                );
                setIsPolling(false);
                setLoading(false);
                if (pollingRef.current) clearInterval(pollingRef.current);
                return;
              }
              const statusData = await statusRes.json();
              setProgress(statusData.progress || 0);
              setStatus(statusData.status);
              setResult(statusData);
              if (
                statusData.status === "done" ||
                statusData.status === "error"
              ) {
                setIsPolling(false);
                setLoading(false);
                if (pollingRef.current) clearInterval(pollingRef.current);
              }
            } catch (err) {
              setError("Errore nel polling dello stato import");
              setIsPolling(false);
              if (pollingRef.current) clearInterval(pollingRef.current);
            }
          }, 1500);
        }
      } catch (err) {
        // Non mostrare errore se endpoint non esiste o non autorizzato
      }
    };
    checkActiveJob();
    // Pulizia polling su unmount
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 p-4 border rounded bg-white max-w-md"
    >
      <label>
        Seleziona file Excel (.xlsx) o CSV (.csv):
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          required
        />
      </label>
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Importazione in corso..." : "Importa prodotti"}
      </button>
      {error && <div className="text-red-600">{error}</div>}
      {result && (
        <div className="mt-4">
          <div>Creati: {result.created}</div>
          <div>Aggiornati: {result.updated}</div>
          {result.errors && result.errors.length > 0 && (
            <details>
              <summary>Errori ({result.errors.length})</summary>
              <ul className="text-red-600 text-xs">
                {result.errors.map((err, i: number) => (
                  <li key={i}>
                    {err.codiceProdotto}: {err.error}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
      {jobId && (
        <>
          <div className="w-full bg-gray-200 rounded h-4 mt-2">
            <div
              className="bg-green-500 h-4 rounded"
              style={{ width: `${progress}%`, transition: "width 0.5s" }}
            ></div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-600">
              Stato: {status} {progress}%
            </span>
            {isPolling && status !== "cancelled" && (
              <button
                type="button"
                className="ml-2 px-2 py-1 bg-red-500 text-white rounded text-xs"
                onClick={handleCancelJob}
              >
                Annulla importazione
              </button>
            )}
          </div>
          {result && result.currentRow !== undefined && (
            <div className="text-xs text-gray-500 mt-1">
              Riga attuale: {result.currentRow + 1} / {result.totalRows}
            </div>
          )}
        </>
      )}
    </form>
  );
};

export default ProductImportForm;
