"use client";

import { Download, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/Button";

const COLUMNS: { name: string; required?: boolean; text: string }[] = [
  { name: "TITOLO", required: true, text: "Il nome del prodotto." },
  { name: "PREZZO", required: true, text: "Usa il punto per i decimali: 12.50" },
  {
    name: "CATEGORIA",
    required: true,
    text: "Es. Scuola. Per una sottocategoria scrivi Scuola|Quaderni. Se non esiste viene creata.",
  },
  { name: "DESCRIZIONE", text: "Materiali, misure e caratteristiche del prodotto." },
  { name: "IMMAGINE", text: "Il link di una foto già online (https://…)." },
];

// Niente lettere accentate: il CSV di esempio deve aprirsi bene anche in Excel
const EXAMPLE_ROWS = [
  "TITOLO;PREZZO;CATEGORIA;DESCRIZIONE;IMMAGINE",
  "Quaderno A4 a righe;2.50;Scuola|Quaderni;Quaderno da 80 fogli con rigatura di prima;",
  "Penna gel blu;1.20;Ufficio|Penne e Matite;Penna a inchiostro gel con punta 0.7 mm;",
  "Zaino scuola fantasia;39.90;Scuola|Zaini e Astucci;Zaino con due scomparti e spallacci imbottiti;",
];

const downloadExample = () => {
  const blob = new Blob([EXAMPLE_ROWS.join("\r\n") + "\r\n"], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "esempio-importazione-prodotti.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/** Istruzioni per preparare il file da importare */
export function ImportGuide() {
  return (
    <aside className="card h-fit p-5 sm:p-6" aria-labelledby="guida-import">
      <h2 id="guida-import" className="text-lg font-bold">
        Come preparare il file
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        Una riga per prodotto. La prima riga contiene i nomi delle colonne, scritti in maiuscolo come qui sotto.
      </p>
      <dl className="mt-4 divide-y divide-paper-line rounded-2xl border border-paper-line">
        {COLUMNS.map((c) => (
          <div key={c.name} className="px-3.5 py-2.5">
            <dt className="flex items-center gap-2">
              <code className="rounded-md bg-paper-warm px-1.5 py-0.5 font-mono text-[13px] font-bold text-ink">{c.name}</code>
              {c.required ? (
                <span className="text-[11px] font-bold uppercase text-magenta-ink">obbligatoria</span>
              ) : (
                <span className="text-[11px] font-semibold uppercase text-ink-faint">facoltativa</span>
              )}
            </dt>
            <dd className="mt-0.5 text-sm text-ink-soft">{c.text}</dd>
          </div>
        ))}
      </dl>
      <Button variant="secondary" className="mt-4 w-full" onClick={downloadExample}>
        <Download className="h-4 w-4" /> Scarica il file di esempio
      </Button>
      <ul className="mt-5 space-y-2.5 text-sm text-ink-soft">
        <li className="flex gap-2">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
          <span>
            Se un prodotto con lo <strong>stesso nome</strong> esiste già nella stessa categoria viene{" "}
            <strong>aggiornato</strong> (prezzo, descrizione, foto), altrimenti viene creato.
          </span>
        </li>
        <li className="flex gap-2">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
          <span>
            Consigliato: carica direttamente il file <strong>Excel (.xlsx)</strong>. Se usi il CSV separa le colonne con
            il punto e virgola (;) e scrivi i prezzi con il punto.
          </span>
        </li>
        <li className="flex gap-2">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
          <span>Dopo l&apos;importazione puoi aggiungere foto, varianti e sconti dalla pagina Prodotti.</span>
        </li>
      </ul>
    </aside>
  );
}
