"use client";

import { create } from "zustand";
import { api, ApiError } from "@/lib/api/client";
import type { User } from "@/lib/types";

/** Il gestionale /scuole ha un suo account (ruolo SCUOLE) e un suo token, separato da quello del negozio. */
export const TOKEN_SCUOLE_KEY = "token_scuole";

interface ScuoleAuthState {
  user: User | null;
  token: string | null;
  ready: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const leggi = () => {
  try {
    return localStorage.getItem(TOKEN_SCUOLE_KEY);
  } catch {
    return null;
  }
};

const scrivi = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_SCUOLE_KEY, token);
    else localStorage.removeItem(TOKEN_SCUOLE_KEY);
  } catch {
    // storage non disponibile: il login dura la sessione
  }
};

let initPromise: Promise<void> | null = null;

export const useScuoleAuth = create<ScuoleAuthState>((set) => ({
  user: null,
  token: null,
  ready: false,

  init: () => {
    initPromise ??= (async () => {
      const token = leggi();
      if (!token) {
        set({ ready: true });
        return;
      }
      try {
        const user = await api<User>("/auth/me", { token });
        if (user.role !== "SCUOLE") throw new Error("ruolo");
        set({ user, token, ready: true });
      } catch {
        scrivi(null);
        set({ user: null, token: null, ready: true });
      }
    })();
    return initPromise;
  },

  login: async (email, password) => {
    const res = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { email: email.trim(), password },
      auth: false,
    });
    if (res.user.role !== "SCUOLE") {
      throw new ApiError(403, "Questo account non è quello del gestionale scuole.");
    }
    scrivi(res.token);
    set({ token: res.token, user: res.user, ready: true });
  },

  logout: () => {
    scrivi(null);
    set({ user: null, token: null, ready: true });
  },
}));
