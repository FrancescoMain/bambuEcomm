"use client";

import { useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";

type Value = string | number | null | undefined;

/**
 * Stato della pagina nella query string (?tab=...&id=...): i link restano
 * condivisibili (anche dalle email) e il ricaricamento non perde la vista.
 * Usa la History API, integrata con il router di Next.js: nessun round-trip.
 */
export function useQueryParams() {
  const params = useSearchParams();
  const pathname = usePathname();

  const setParams = useCallback(
    (patch: Record<string, Value>, mode: "replace" | "push" = "replace") => {
      const next = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === undefined || value === "") next.delete(key);
        else next.set(key, String(value));
      }
      const qs = next.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (mode === "push") window.history.pushState(null, "", url);
      else window.history.replaceState(null, "", url);
    },
    [pathname]
  );

  return [params, setParams] as const;
}
