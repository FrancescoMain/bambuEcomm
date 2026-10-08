"use client";

import { useCallback, useEffect, useState } from "react";
import { errorMessage } from "@/lib/api/client";

/**
 * Caricamento dati con stato (loading / errore) e ricarica manuale.
 * Durante una ricarica i dati precedenti restano visibili, così la pagina
 * non "salta" dopo ogni azione.
 */
export function useAsync<T>(load: () => Promise<T>, deps: React.DependencyList) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    load()
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((e) => {
        if (alive) setError(errorMessage(e, "Impossibile caricare i dati, riprova."));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // `load` cambia a ogni render: le dipendenze reali sono quelle passate
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { data, setData, error, loading, reload };
}
