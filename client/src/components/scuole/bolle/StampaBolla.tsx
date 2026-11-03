import { formatDate, formatPrice } from "@/lib/format";
import type { Bolla } from "../types";

/**
 * Foglio A4 della bolla (come Mike_Bolle_Clienti di GS_MAG): una riga per copia arrivata, in ordine di codice, con il
 * cliente a cui va o «Magazzino». Il layout del report originale non lo conosciamo ancora: versione semplice.
 */
export function StampaBolla({ bolla }: { bolla: Bolla }) {
  const righe = [...bolla.righe].sort((a, b) => a.isbn.localeCompare(b.isbn) || a.id - b.id);
  const totale = Math.round(righe.reduce((t, r) => t + Number(r.prezzo), 0) * 100) / 100;
  const aClienti = righe.filter((r) => r.destinazione === "CLIENTE").length;
  return (
    <div className="hidden text-[11pt] leading-snug text-black print:block">
      <style>{"@page { size: A4; margin: 14mm; }"}</style>
      <header className="flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          <p className="text-[16pt] font-extrabold">Cartoleria Bambù</p>
          <p>Arrivo merce{bolla.numeroFornitore ? ` · DDT fornitore ${bolla.numeroFornitore}` : ""}</p>
        </div>
        <div className="text-right">
          <p className="text-[14pt] font-extrabold">
            Bolla n. {bolla.numero} / {bolla.anno}
          </p>
          <p>{formatDate(bolla.data)}</p>
        </div>
      </header>

      <table className="mt-3 w-full border-collapse text-[10pt]">
        <thead>
          <tr className="border-y border-black text-left">
            <th className="py-1 pr-2">Nr</th>
            <th className="py-1 pr-2">Codice</th>
            <th className="py-1 pr-2">Titolo</th>
            <th className="py-1 pr-2">Vol.</th>
            <th className="py-1 pr-2 text-right">Prezzo</th>
            <th className="py-1">Per chi</th>
          </tr>
        </thead>
        <tbody>
          {righe.map((r, i) => (
            <tr key={r.id} className="break-inside-avoid border-b border-neutral-300 align-top">
              <td className="py-1 pr-2">{i + 1}</td>
              <td className="py-1 pr-2 font-mono">{r.isbn}</td>
              <td className="py-1 pr-2">
                <strong>{r.titolo}</strong>
                <br />
                {r.editore}
              </td>
              <td className="py-1 pr-2 font-bold">{r.volume}</td>
              <td className="whitespace-nowrap py-1 pr-2 text-right">{formatPrice(r.prezzo)}</td>
              <td className="py-1">
                {r.libro ? (
                  <>
                    <strong>
                      {r.libro.scheda.cognome} {r.libro.scheda.nome}
                    </strong>{" "}
                    n. {r.libro.scheda.numero} · {r.libro.scheda.classe}
                  </>
                ) : r.destinazione === "CLIENTE" ? (
                  "Cliente"
                ) : (
                  "Magazzino"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="ml-auto mt-4 w-[80mm] space-y-1 text-[11pt]">
        <p className="flex justify-between">
          <span>Copie arrivate</span>
          <span>{righe.length}</span>
        </p>
        <p className="flex justify-between">
          <span>Ai clienti / in Magazzino</span>
          <span>
            {aClienti} / {righe.length - aClienti}
          </span>
        </p>
        <p className="flex justify-between border-t border-black pt-1 text-[13pt] font-extrabold">
          <span>Totale a prezzo di copertina</span>
          <span>{formatPrice(totale)}</span>
        </p>
      </section>
    </div>
  );
}
