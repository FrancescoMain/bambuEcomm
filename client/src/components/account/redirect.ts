import type { User } from "@/lib/types";

const AUTH_PAGES = /^\/(login|register|forgot-password|reset-password)(?=[/?#]|$)/;

/** Accetta solo percorsi interni ("/checkout"), mai URL esterni o "//dominio" */
export const safeRedirect = (value: string | null | undefined): string | null => {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  if (AUTH_PAGES.test(value)) return null;
  return value;
};

/** Dopo l'accesso: la pagina richiesta oppure l'area personale (gli admin il pannello) */
export const afterLoginPath = (user: User, redirect: string | null | undefined) =>
  safeRedirect(redirect) ?? (user.role === "ADMIN" ? "/dashboard" : "/account");

/** Aggiunge ?redirect= ai link tra login e registrazione */
export const withRedirect = (path: string, redirect: string | null | undefined) => {
  const target = safeRedirect(redirect);
  return target ? `${path}?redirect=${encodeURIComponent(target)}` : path;
};
