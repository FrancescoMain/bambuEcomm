import { formatDate, formatPrice } from "@/lib/format";
import { prezzoCliente, STATI, type SchedaCliente } from "../types";

/**
 * «scheda» = solo i libri prenotati (come Mike_Cliente.rpt); «lista» = tutti i libri della classe;
 * «acquistare» = i libri con «Da acquistare» = Sì del Ministero, per dire al cliente quali sono e quanto costano.
 */
export type TipoStampa = "scheda" | "lista" | "acquistare";

const TITOLI: Record<TipoStampa, string> = {
  scheda: "Prenotazione libri scolastici",
  lista: "Lista completa dei libri della classe",
  acquistare: "Libri da acquistare",
};

/**
 * Foglio A4 per la stampa del browser: visibile solo in stampa. Il layout di Mike_Cliente.rpt non lo
 * conosciamo ancora (aspettiamo una stampa d'esempio dal negozio), quindi è una versione semplice.
 */
export function StampaScheda({ scheda, tipo }: { scheda: SchedaCliente; tipo: TipoStampa }) {
  const libri =
    tipo === "scheda"
      ? scheda.libri.filter((l) => l.stato !== "IN_LISTA")
      : tipo === "acquistare"
        ? scheda.libri.filter((l) => l.daAcquistare)
        : scheda.libri;
  const t = scheda.totali;
  const totaleStampati = Math.round(libri.reduce((s, l) => s + prezzoCliente(l), 0) * 100) / 100;
  return (
    <div className="hidden text-[11pt] leading-snug text-black print:block">
      <style>{"@page { size: A4; margin: 14mm; }"}</style>
      <header className="flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          <p className="text-[16pt] font-extrabold">Cartoleria Bambù</p>
          <p>{TITOLI[tipo]}</p>
        </div>
        <div className="text-right">
          <p className="text-[14pt] font-extrabold">
            Scheda n. {scheda.numero} / {scheda.anno}
          </p>
          <p className="font-mono">{scheda.barcode}</p>
          <p>{formatDate(scheda.data)}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-x-8 py-3">
        <p>
          Alunno: <strong>{scheda.cognome} {scheda.nome}</strong>
        </p>
        <p>Telefono: {scheda.telefono || "—"}</p>
        <p>
          Scuola: <strong>{scheda.scuola.nome}</strong>
        </p>
        <p>
          Classe: <strong>{scheda.classe}</strong>
          {scheda.corso ? ` · ${scheda.corso}` : ""}
        </p>
      </section>

      <table className="w-full border-collapse text-[10pt]">
        <thead>
          <tr className="border-y border-black text-left">
            <th className="py-1 pr-2">Nr</th>
            <th className="py-1 pr-2">Materia</th>
            <th className="py-1 pr-2">Titolo e autori</th>
            <th className="py-1 pr-2">Editore</th>
            <th className="py-1 pr-2">Vol.</th>
            <th className="py-1 pr-2">Codice</th>
            <th className="py-1 pr-2 text-right">Prezzo</th>
            {tipo !== "acquistare" && <th className="py-1">{tipo === "lista" ? "Prenotato" : "Stato"}</th>}
          </tr>
        </thead>
        <tbody>
          {libri.map((l, i) => (
            <tr key={l.id} className="break-inside-avoid border-b border-neutral-300 align-top">
              <td className="py-1 pr-2">{i + 1}</td>
              <td className="py-1 pr-2">{l.materia}</td>
              <td className="py-1 pr-2">
                <strong>{l.titolo}</strong>
                <br />
                {l.autori}
              </td>
              <td className="py-1 pr-2">{l.editore}</td>
              <td className="py-1 pr-2 font-bold">{l.volume}</td>
              <td className="py-1 pr-2 font-mono">{l.isbn}</td>
              <td className="whitespace-nowrap py-1 pr-2 text-right">
                {formatPrice(prezzoCliente(l))}
                {l.copiaUsata && <span className="block text-[8pt]">usato</span>}
              </td>
              {tipo !== "acquistare" && (
                <td className="py-1">{tipo === "lista" ? (l.stato === "IN_LISTA" ? "—" : "Sì") : STATI[l.stato].label}</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {tipo === "acquistare" ? (
        <section className="ml-auto mt-4 w-[80mm] text-[11pt]">
          <div className="border-t border-black pt-1">
            <Riga label={`Totale (${libri.length} libri)`} valore={formatPrice(totaleStampati)} forte />
          </div>
        </section>
      ) : (
        <section className="ml-auto mt-4 w-[70mm] space-y-1 text-[11pt]">
          {tipo === "lista" && <Riga label="Totale lista" valore={formatPrice(t.lista)} />}
          <Riga label="Totale prenotati" valore={formatPrice(t.prenotati)} />
          <Riga label="Acconto" valore={formatPrice(t.acconto)} />
          <div className="border-t border-black pt-1">
            <Riga label="Da pagare" valore={formatPrice(t.daPagare)} forte />
          </div>
        </section>
      )}
    </div>
  );
}

function Riga({ label, valore, forte }: { label: string; valore: string; forte?: boolean }) {
  return (
    <p className={`flex justify-between ${forte ? "text-[13pt] font-extrabold" : ""}`}>
      <span>{label}</span>
      <span>{valore}</span>
    </p>
  );
}
