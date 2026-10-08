import { Request, Response, NextFunction, RequestHandler } from "express";
import { waitUntil } from "@vercel/functions";

/**
 * Esegue un lavoro dopo aver risposto al client. Su Vercel la funzione viene
 * congelata appena inviata la risposta: waitUntil la tiene viva finché il
 * lavoro non è finito. In locale è un semplice fire-and-forget.
 */
export const runInBackground = (task: Promise<unknown>): void => {
  const safe = task.catch((error) => console.error("Errore attività in background:", error));
  try {
    waitUntil(safe);
  } catch {
    // fuori da Vercel waitUntil non è disponibile: la promise prosegue comunque
  }
};

/**
 * Cache CDN per le GET pubbliche (catalogo, categorie, impostazioni).
 * Vercel serve la risposta dalla edge per `sMaxAge` secondi e, scaduto quel
 * tempo, continua a servirla mentre la rigenera in background
 * (stale-while-revalidate): il cliente non aspetta mai il database.
 * Le richieste autenticate non vengono messe in cache.
 */
export const publicCache =
  (sMaxAge = 60, staleWhileRevalidate = 600): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    if (req.method === "GET" && !req.headers.authorization) {
      res.setHeader(
        "Cache-Control",
        `public, max-age=0, s-maxage=${sMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`
      );
    } else {
      res.setHeader("Cache-Control", "private, no-store");
    }
    next();
  };

export const noStore: RequestHandler = (req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store");
  next();
};

/** parseInt che accetta anche "72-nome-prodotto" (id + slug). */
export const parseId = (value: unknown): number => {
  const n = parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : NaN;
};

/** Accetta 1 | "1,2,3" | ["1","2"] e restituisce gli interi validi. */
export const parseIdList = (value: unknown): number[] => {
  if (value === undefined || value === null || value === "") return [];
  const raw = Array.isArray(value) ? value : String(value).split(",");
  return raw
    .map((v) => parseInt(String(v), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
};

export const clampInt = (value: unknown, fallback: number, min: number, max: number) => {
  const n = parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};

/** Notifica il frontend Next.js di rigenerare le pagine in cache dopo una modifica admin. */
export const revalidateStorefront = (tags: string[]): void => {
  const url = process.env.FRONTEND_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) return;
  runInBackground(
    fetch(`${url.replace(/\/$/, "")}/api/revalidate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify({ tags }),
      signal: AbortSignal.timeout(3000),
    }).catch((error) => console.warn("Revalidate storefront fallita:", (error as Error).message))
  );
};

/**
 * Limite di richieste per IP (in memoria, per istanza): basta a fermare
 * l'invio ripetuto di form pubblici (contatti, newsletter, recensioni).
 */
export const rateLimit = (max: number, windowMs: number): RequestHandler => {
  const hits = new Map<string, number[]>();
  return (req, res, next) => {
    const ip =
      String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "unknown";
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      res.status(429).json({ message: "Troppe richieste, riprova tra qualche minuto." });
      return;
    }
    recent.push(now);
    hits.set(ip, recent);
    if (hits.size > 5000) hits.clear();
    next();
  };
};

/** Campo trappola per i bot: i form pubblici hanno un input nascosto "website". */
export const isBot = (body: any): boolean => !!(body && body.website);

export const isEmail = (value: unknown): value is string =>
  typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) && value.length <= 254;

export const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
