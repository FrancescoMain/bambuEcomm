"use client";

import { API_URL, getToken } from "@/lib/api/client";

/** Scarica un file protetto dall'API (es. CSV) inviando il token admin */
export async function downloadWithAuth(path: string, filename: string): Promise<void> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    let message = "Download non riuscito, riprova.";
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {
      // risposta non JSON: resta il messaggio generico
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
