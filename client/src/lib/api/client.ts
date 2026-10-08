"use client";

/**
 * Client API per il browser: aggiunge il token, normalizza gli errori e
 * restituisce il JSON già tipizzato. Sostituisce axios (più leggero).
 */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://bambu-ecomm-in2g.vercel.app/api").replace(
  /\/$/,
  ""
);

export const TOKEN_KEY = "token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
  }
}

export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

type Options = Omit<RequestInit, "body"> & {
  body?: unknown;
  auth?: boolean;
  /** query string */
  query?: Record<string, unknown>;
};

const buildQuery = (query?: Record<string, unknown>) => {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null || v === "") continue;
    params.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
};

let onUnauthorized: (() => void) | null = null;
/** Registrato dallo store auth: un 401 su una chiamata autenticata fa logout */
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

export async function api<T = any>(path: string, opts: Options = {}): Promise<T> {
  const { body, auth = true, query, headers, ...rest } = opts;
  const token = auth ? getToken() : null;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(`${API_URL}${path}${buildQuery(query)}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    if (res.status === 401 && token && onUnauthorized) onUnauthorized();
    const message =
      (data && (data.message || data.error || data.errors?.[0]?.msg)) ||
      (res.status >= 500 ? "Si è verificato un errore, riprova tra poco." : "Richiesta non valida.");
    throw new ApiError(res.status, message, data);
  }
  return data as T;
}

export const errorMessage = (error: unknown, fallback = "Si è verificato un errore, riprova.") =>
  error instanceof ApiError ? error.message : error instanceof Error && error.message ? error.message : fallback;

/** Chiede a Next.js di rigenerare le pagine in cache dopo una modifica admin. */
export const revalidateStorefront = (tags: string[]) => {
  const token = getToken();
  if (!token) return;
  fetch("/api/revalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ tags }),
  }).catch(() => undefined);
};

/** Upload immagine su Cloudinary tramite l'API (solo admin) */
export const uploadImage = async (file: File, folder = "products"): Promise<string> => {
  const form = new FormData();
  form.append("image", file);
  form.append("folder", folder);
  const res = await api<{ url: string }>("/products/upload-image", { method: "POST", body: form });
  return res.url;
};
