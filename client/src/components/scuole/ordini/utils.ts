"use client";

import { useEffect, useState } from "react";
import type { RigaOrdine } from "../types";

export type RigaPerCodice = {
  isbn: string;
  titolo: string;
  autori: string;
  editore: string;
  volume: string;
  prezzo: number;
  quantita: number;
  /** Numeri degli ordini in cui sono le copie (per «Ancora in ordine») */
  ordini: number[];
};

/** Una riga per copia → una per codice con la quantità, in ordine di codice (come il CSV del server). */
export function perCodice(righe: (RigaOrdine & { ordine?: { numero: number } })[]): RigaPerCodice[] {
  const mappa = new Map<string, RigaPerCodice>();
  for (const r of righe) {
    const g = mappa.get(r.isbn) ?? {
      isbn: r.isbn,
      titolo: r.titolo,
      autori: r.autori,
      editore: r.editore,
      volume: r.volume,
      prezzo: Number(r.prezzo),
      quantita: 0,
      ordini: [],
    };
    g.quantita++;
    if (r.ordine && !g.ordini.includes(r.ordine.numero)) g.ordini.push(r.ordine.numero);
    mappa.set(r.isbn, g);
  }
  return [...mappa.values()].sort((a, b) => a.isbn.localeCompare(b.isbn));
}

/** CSV per il distributore come lo esportava GS_MAG: «codice;quantità», niente intestazione. */
export function scaricaCsv(nomeFile: string, righe: RigaPerCodice[]) {
  const testo = righe.map((r) => `${r.isbn};${r.quantita}\n`).join("");
  const url = URL.createObjectURL(new Blob([testo], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeFile;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Stampa: si monta il foglio, si apre la finestra di stampa del browser, poi lo si smonta. */
export function useStampa() {
  const [stampa, setStampa] = useState(false);
  useEffect(() => {
    if (!stampa) return;
    const fine = () => setStampa(false);
    window.addEventListener("afterprint", fine, { once: true });
    const t = setTimeout(() => window.print(), 50);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", fine);
    };
  }, [stampa]);
  return [stampa, () => setStampa(true)] as const;
}
