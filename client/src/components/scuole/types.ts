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

// ── Clienti (schede di prenotazione) ──

export type StatoLibro = "IN_LISTA" | "PRENOTATO" | "CONFERMATO" | "ASSEGNATO" | "RITIRATO";
export type AzioneLibro = "prenota" | "togli" | "ritira" | "annullaRitiro";

/** Nomi e colori degli stati, con le parole del negozio */
export const STATI: Record<StatoLibro, { label: string; classe: string }> = {
  IN_LISTA: { label: "In lista", classe: "bg-paper-warm text-ink-muted" },
  PRENOTATO: { label: "Prenotato", classe: "bg-orange-soft text-orange-ink" },
  CONFERMATO: { label: "Confermato", classe: "bg-sky-soft text-sky-ink" },
  ASSEGNATO: { label: "Assegnato", classe: "bg-brand-100 text-brand-800" },
  RITIRATO: { label: "Ritirato", classe: "bg-ink/80 text-white" },
};

export type TotaliCliente = { lista: number; prenotati: number; acconto: number; daPagare: number };

export type SchedaClienteRiepilogo = {
  id: number;
  anno: number;
  numero: number;
  barcode: string;
  cognome: string;
  nome: string;
  telefono: string;
  scuolaId: number;
  scuola: { nome: string };
  classe: string;
  corso: string;
  data: string;
  conteggi: Record<StatoLibro, number>;
  totali: TotaliCliente;
};

export type LibroCliente = LibroScheda & { stato: StatoLibro };

export type SchedaCliente = Omit<SchedaClienteRiepilogo, "conteggi" | "scuola"> & {
  scuola: { id: number; codice: string; nome: string; citta: string | null };
  acconto: string | number;
  note: string;
  libri: LibroCliente[];
  importazione?: { classeTrovata: boolean; libriAggiunti: number };
};

// ── Ordini al fornitore ──

/** Il cliente a cui è destinata una copia ordinata */
export type ClienteCopia = { id: number; anno: number; numero: number; cognome: string; nome: string };

export type DaOrdinare = {
  isbn: string;
  titolo: string;
  autori: string;
  editore: string;
  volume: string;
  prezzo: number;
  /** Copie prenotate dai clienti e non ancora ordinate */
  prenotati: number;
  /** Di queste, quante trovano già una copia libera in un ordine */
  giaInOrdine: number;
  daOrdinare: number;
};

export type OrdineRiepilogo = {
  id: number;
  anno: number;
  numero: number;
  barcode: string;
  data: string;
  note: string;
  copie: number;
  arrivate: number;
  libere: number;
  totale: number;
};

export type RigaOrdine = {
  id: number;
  isbn: string;
  materia: string;
  autori: string;
  titolo: string;
  volume: string;
  editore: string;
  prezzo: string | number;
  arrivatoAt: string | null;
  libro: { id: number; stato?: StatoLibro; scheda: ClienteCopia } | null;
};

export type Ordine = Omit<OrdineRiepilogo, "copie" | "arrivate" | "libere"> & { righe: RigaOrdine[] };

export type RigaInOrdine = RigaOrdine & { ordine: { id: number; anno: number; numero: number; data: string } };
