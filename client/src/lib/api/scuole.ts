"use client";

import { api as apiNegozio, ApiError } from "@/lib/api/client";
import { useScuoleAuth } from "@/store/scuoleAuth";

/** Come `api` del negozio, ma col token del gestionale /scuole: un 401 riporta al login del gestionale. */
export async function api<T = any>(path: string, opts: Parameters<typeof apiNegozio>[1] = {}): Promise<T> {
  try {
    return await apiNegozio<T>(path, { ...opts, token: useScuoleAuth.getState().token });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) useScuoleAuth.getState().logout();
    throw e;
  }
}
