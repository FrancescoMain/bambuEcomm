import { parse } from "csv-parse/sync";

// Open data del Ministero (dati.istruzione.it) per il gestionale libri:
// anagrafe delle scuole statali e libri adottati in Campania, come «Importa OnLine» di GS_MAG.
const BASE = "https://dati.istruzione.it/opendata";
const PREFIX = "PREFIX miur: <http://www.miur.it/ns/miur#> ";
const TIMEOUT_MS = 45_000;

/** Codice meccanografico: 10 lettere o cifre (es. NAPS930006). Validato prima di finire nella query. */
export const normalizzaCodiceScuola = (codice: unknown): string | null => {
  const c = String(codice ?? "").trim().toUpperCase();
  return /^[A-Z0-9]{10}$/.test(c) ? c : null;
};

/** Classe come la scrive il Ministero: anno di corso e sezione attaccati («1 a» → «1A»). */
export const normalizzaClasse = (classe: unknown): string => String(classe ?? "").replace(/\s+/g, "").toUpperCase();

/** «3ASA» → anno di corso 3, sezione «ASA». Le sezioni possono avere più lettere. */
export const dividiClasse = (classe: string): { annoCorso: number; sezione: string } | null => {
  const m = /^(\d)([A-Z0-9]{1,8})$/.exec(normalizzaClasse(classe));
  return m ? { annoCorso: Number(m[1]), sezione: m[2] } : null;
};

/** Prezzo del Ministero con la virgola decimale («29,30», «1.020,00»). */
export const leggiPrezzo = (valore: unknown): number => {
  const s = String(valore ?? "").trim();
  const n = Number(s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : s);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
};

/** I flag arrivano come «Si»/«No» (a volte sporchi, es. «Mo»): vale solo «Si». */
export const leggiFlag = (valore: unknown): boolean => /^s[iì]$/i.test(String(valore ?? "").trim());

export type ScuolaMiur = {
  codice: string;
  nome: string;
  tipo: string | null;
  indirizzo: string | null;
  cap: string | null;
  citta: string | null;
  provincia: string | null;
};

export type LibroMiur = {
  classe: string;
  combinazione: string;
  isbn: string;
  materia: string;
  autori: string;
  titolo: string;
  volume: string;
  editore: string;
  prezzo: number;
  nuovaAdozione: boolean;
  daAcquistare: boolean;
  consigliato: boolean;
};

const testo = (v: unknown) => String(v ?? "").trim();
const facoltativo = (v: unknown) => testo(v) || null;

/** Una riga del CSV delle adozioni → libro della classe; null se manca l'ISBN o la classe. */
export const rigaInLibro = (r: Record<string, string>): LibroMiur | null => {
  const isbn = testo(r.codiceisbn).replace(/[\s-]/g, "");
  const annoCorso = Number.parseInt(testo(r.annocorso), 10);
  const sezione = normalizzaClasse(r.sezioneanno);
  if (!isbn || !Number.isInteger(annoCorso) || !sezione) return null;
  return {
    classe: `${annoCorso}${sezione}`,
    combinazione: testo(r.combinazione),
    isbn,
    materia: testo(r.disciplina),
    autori: testo(r.autori),
    titolo: testo(r.titolo),
    volume: testo(r.volume),
    editore: testo(r.editore),
    prezzo: leggiPrezzo(r.prezzo),
    nuovaAdozione: leggiFlag(r.nuovaadoz),
    daAcquistare: leggiFlag(r.daacquist),
    consigliato: leggiFlag(r.consigliato),
  };
};

async function sparql(dataset: string, query: string): Promise<Record<string, string>[]> {
  const url = `${BASE}/${dataset}/query?${new URLSearchParams({ query: PREFIX + query, dataType: "csv" })}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Il sito del Ministero ha risposto ${res.status}`);
  return parse(await res.text(), { columns: true, skip_empty_lines: true, bom: true });
}

/** Anagrafica di una scuola statale; se il Ministero ne ha più anni prende il più recente. */
export async function cercaScuolaMiur(codice: string): Promise<ScuolaMiur | null> {
  const rows = await sparql(
    "SCUANAGRAFESTAT",
    `SELECT ?nome ?tipo ?anno ?indirizzo ?cap ?citta ?provincia WHERE {
      ?s miur:CODICESCUOLA "${codice}" ; miur:DENOMINAZIONESCUOLA ?nome ; miur:ANNOSCOLASTICO ?anno .
      OPTIONAL { ?s miur:DESCRIZIONETIPOLOGIAGRADOISTRUZIONESCUOLA ?tipo }
      OPTIONAL { ?s miur:INDIRIZZOSCUOLA ?indirizzo }
      OPTIONAL { ?s miur:CAPSCUOLA ?cap }
      OPTIONAL { ?s miur:DESCRIZIONECOMUNE ?citta }
      OPTIONAL { ?s miur:PROVINCIA ?provincia }
    } ORDER BY DESC(?anno) LIMIT 1`
  );
  const r = rows[0];
  if (!r || !testo(r.nome)) return null;
  return {
    codice,
    nome: testo(r.nome),
    tipo: facoltativo(r.tipo),
    indirizzo: facoltativo(r.indirizzo),
    cap: facoltativo(r.cap),
    citta: facoltativo(r.citta),
    provincia: facoltativo(r.provincia),
  };
}

/** Libri adottati da una scuola: tutte le classi, oppure una sola (es. «3ASA»). */
export async function libriAdottatiMiur(codice: string, classe?: string): Promise<LibroMiur[]> {
  const parti = classe ? dividiClasse(classe) : null;
  if (classe && !parti) throw new Error("Classe non valida: scrivi anno e sezione attaccati, es. 1A.");
  const filtroClasse = parti ? ` && ?annocorso = ${parti.annoCorso} && ?sezioneanno = "${parti.sezione}"` : "";
  const rows = await sparql(
    "ALTCAMPANIA",
    `SELECT DISTINCT ?annocorso ?sezioneanno ?combinazione ?codiceisbn ?disciplina ?autori ?titolo ?volume
      ?editore ?prezzo ?nuovaadoz ?daacquist ?consigliato WHERE {
      ?s miur:CODICESCUOLA ?codicescuola ; miur:ANNOCORSO ?annocorso ; miur:SEZIONEANNO ?sezioneanno ;
         miur:CODICEISBN ?codiceisbn ; miur:TITOLO ?titolo .
      OPTIONAL { ?s miur:COMBINAZIONE ?combinazione }
      OPTIONAL { ?s miur:DISCIPLINA ?disciplina }
      OPTIONAL { ?s miur:AUTORI ?autori }
      OPTIONAL { ?s miur:VOLUME ?volume }
      OPTIONAL { ?s miur:EDITORE ?editore }
      OPTIONAL { ?s miur:PREZZO ?prezzo }
      OPTIONAL { ?s miur:NUOVAADOZ ?nuovaadoz }
      OPTIONAL { ?s miur:DAACQUIST ?daacquist }
      OPTIONAL { ?s miur:CONSIGLIATO ?consigliato }
      FILTER(?codicescuola = "${codice}"${filtroClasse})
    } LIMIT 20000`
  );
  return rows.map(rigaInLibro).filter((l): l is LibroMiur => l !== null);
}
