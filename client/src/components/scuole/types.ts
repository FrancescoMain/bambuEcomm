// Tipi del gestionale libri scolastici (sezione Scuole), come li restituisce /api/libri

export type Scuola = {
  id: number;
  codice: string;
  nome: string;
  tipo: string | null;
  indirizzo: string | null;
  cap: string | null;
  citta: string | null;
  provincia: string | null;
  /** Classi dell'anno scelto */
  classi?: number;
};

export type SchedaRiepilogo = {
  id: number;
  scuolaId: number;
  anno: number;
  classe: string;
  corso: string;
  numeroLibri: number;
  totale: number;
};

export type LibroScheda = {
  id: number;
  isbn: string;
  materia: string;
  autori: string;
  titolo: string;
  volume: string;
  editore: string;
  prezzo: string | number;
  nuovaAdozione: boolean;
  daAcquistare: boolean;
  consigliato: boolean;
};

export type Scheda = {
  id: number;
  scuolaId: number;
  anno: number;
  classe: string;
  corso: string;
  data: string;
  scuola: Scuola;
  libri: LibroScheda[];
  totale: number;
};

export type EsitoImport = { schedeCreate: number; libriAggiunti: number; libriGiaPresenti: number };

/** Anni proposti nella tendina: l'anno è quello solare, come in GS_MAG. */
export const anniDisponibili = (corrente = new Date().getFullYear()) => [corrente + 1, corrente, corrente - 1, corrente - 2];
