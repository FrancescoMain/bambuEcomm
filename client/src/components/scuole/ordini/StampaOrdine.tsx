import { formatDate, formatPrice } from "@/lib/format";
import type { RigaPerCodice } from "./utils";

/**
 * Foglio A4 con i libri per codice e la quantità: l'ordine da mandare al fornitore, oppure tutti i libri
 * ancora in ordine per controllare che i conti tornino. Il layout dei report di GS_MAG non lo conosciamo
 * ancora (aspettiamo una stampa d'esempio dal negozio), quindi è una versione semplice.
 */
export function StampaOrdine({
  titolo,
  sottotitolo,
  data,
  righe,
  conOrdini,
}: {
  titolo: string;
  sottotitolo?: string;
  data: string;
  righe: RigaPerCodice[];
  /** Colonna con i numeri d'ordine (per «Ancora in ordine») */
  conOrdini?: boolean;
}) {
  const copie = righe.reduce((t, r) => t + r.quantita, 0);
  const totale = Math.round(righe.reduce((t, r) => t + r.prezzo * r.quantita, 0) * 100) / 100;
  return (
    <div className="hidden text-[11pt] leading-snug text-black print:block">
      <style>{"@page { size: A4; margin: 14mm; }"}</style>
      <header className="flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          <p className="text-[16pt] font-extrabold">Cartoleria Bambù</p>
          <p>{titolo}</p>
        </div>
        <div className="text-right">
          {sottotitolo && <p className="text-[14pt] font-extrabold">{sottotitolo}</p>}
          <p>{formatDate(data)}</p>
        </div>
      </header>

      <table className="mt-3 w-full border-collapse text-[10pt]">
        <thead>
          <tr className="border-y border-black text-left">
            <th className="py-1 pr-2">Nr</th>
            <th className="py-1 pr-2">Codice</th>
            <th className="py-1 pr-2">Titolo e autori</th>
            <th className="py-1 pr-2">Editore</th>
            <th className="py-1 pr-2">Vol.</th>
            {conOrdini && <th className="py-1 pr-2">Ordini</th>}
            <th className="py-1 pr-2 text-right">Q.tà</th>
            <th className="py-1 pr-2 text-right">Prezzo</th>
            <th className="py-1 text-right">Importo</th>
          </tr>
        </thead>
        <tbody>
          {righe.map((r, i) => (
            <tr key={r.isbn} className="break-inside-avoid border-b border-neutral-300 align-top">
              <td className="py-1 pr-2">{i + 1}</td>
              <td className="py-1 pr-2 font-mono">{r.isbn}</td>
              <td className="py-1 pr-2">
                <strong>{r.titolo}</strong>
                <br />
                {r.autori}
              </td>
              <td className="py-1 pr-2">{r.editore}</td>
              <td className="py-1 pr-2 font-bold">{r.volume}</td>
              {conOrdini && <td className="py-1 pr-2">{r.ordini.map((n) => `n. ${n}`).join(", ")}</td>}
              <td className="py-1 pr-2 text-right text-[11pt] font-bold">{r.quantita}</td>
              <td className="whitespace-nowrap py-1 pr-2 text-right">{formatPrice(r.prezzo)}</td>
              <td className="whitespace-nowrap py-1 text-right">{formatPrice(r.prezzo * r.quantita)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="ml-auto mt-4 w-[80mm] space-y-1 text-[11pt]">
        <p className="flex justify-between">
          <span>Titoli</span>
          <span>{righe.length}</span>
        </p>
        <p className="flex justify-between">
          <span>Copie</span>
          <span>{copie}</span>
        </p>
        <p className="flex justify-between border-t border-black pt-1 text-[13pt] font-extrabold">
          <span>Totale a prezzo di copertina</span>
          <span>{formatPrice(totale)}</span>
        </p>
      </section>
    </div>
  );
}
