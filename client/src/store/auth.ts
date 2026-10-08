"use client";

import { create } from "zustand";
import { api, setUnauthorizedHandler, TOKEN_KEY } from "@/lib/api/client";
import type { User } from "@/lib/types";

interface AuthState {
  user: User | null;
  token: string | null;
  /** true finché non sappiamo se l'utente è loggato (evita flash di UI) */
  ready: boolean;
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const writeToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // storage non disponibile (navigazione privata): il login dura la sessione
  }
};

let initPromise: Promise<void> | null = null;

export const useAuth = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  ready: false,

  init: () => {
    initPromise ??= (async () => {
      const token = readToken();
      if (!token) {
        set({ ready: true });
        return;
      }
      set({ token });
      try {
        const user = await api<User>("/auth/me");
        set({ user, ready: true });
      } catch {
        writeToken(null);
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
    writeToken(res.token);
    set({ token: res.token, user: res.user, ready: true });
    return res.user;
  },

  register: async ({ name, email, password }) => {
    await api("/auth/register", {
      method: "POST",
      body: { name: name.trim(), email: email.trim().toLowerCase(), password },
      auth: false,
    });
    await get().login(email.trim().toLowerCase(), password);
  },

  logout: () => {
    writeToken(null);
    set({ user: null, token: null, ready: true });
    api("/auth/logout", { method: "POST", auth: false }).catch(() => undefined);
  },

  setUser: (user) => set({ user }),
}));

setUnauthorizedHandler(() => useAuth.getState().logout());

export const isAdmin = (user: User | null) => user?.role === "ADMIN";
