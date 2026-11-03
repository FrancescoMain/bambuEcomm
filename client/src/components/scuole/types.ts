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

export type LibroCliente = LibroScheda & {
  stato: StatoLibro;
  /** Copie libere in negozio dello stesso libro */
  inNegozio: number;
  /** La copia è stata data dal negozio: «Rimetti in negozio» la restituisce */
  dalNegozioAt: string | null;
  /** Il cliente lo vuole usato */
  usato: boolean;
  /** Fino a quando aspetta l'usato; dopo va ordinato nuovo */
  attesaUsatoFino: string | null;
  /** Prezzo della copia usata ricevuta (al posto della copertina) */
  prezzoUsato: string | number | null;
  copiaUsata: { id: number; codice: string; prezzoVendita: string | number; pagataAt: string | null } | null;
  /** Copie usate di questo libro in negozio, ancora di nessuno */
  usatiInNegozio: number;
};

/** Quanto paga il cliente per un libro: la copia usata se l'ha ricevuta, altrimenti la copertina (come sul server). */
export const prezzoCliente = (l: { prezzo: string | number; prezzoUsato?: string | number | null }) => Number(l.prezzoUsato ?? l.prezzo);

export type SchedaCliente = Omit<SchedaClienteRiepilogo, "conteggi" | "scuola"> & {
  scuola: { id: number; codice: string; nome: string; citta: string | null };
  acconto: string | number;
  note: string;
  libri: LibroCliente[];
  giorniAttesaUsato: number;
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
  /** Copie libere già in negozio: si danno dalla scheda del cliente invece di ordinarle */
  inNegozio: number;
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

// ── Magazzino (libri già in negozio, senza cliente) ──

export type Giacenza = {
  id: number;
  isbn: string;
  materia: string;
  autori: string;
  titolo: string;
  volume: string;
  editore: string;
  prezzo: string | number;
  /** Copie libere in negozio */
  quantita: number;
  updatedAt: string;
};

export type GiacenzaRiepilogo = Giacenza & {
  /** Clienti che aspettano il libro e non è ancora ordinato */
  prenotati: number;
  /** Copie ordinate al fornitore e non ancora arrivate */
  inOrdine: number;
  /** Copie dei clienti in negozio, da ritirare */
  daRitirare: number;
};

export type CausaleGiacenza = "CARICO" | "RETTIFICA" | "DATO_AL_CLIENTE" | "RIENTRO" | "ARRIVO" | "ARRIVO_ANNULLATO";

export const CAUSALI: Record<CausaleGiacenza, string> = {
  CARICO: "Carico",
  RETTIFICA: "Correzione a mano",
  DATO_AL_CLIENTE: "Dato al cliente",
  RIENTRO: "Rimesso in negozio",
  ARRIVO: "Arrivato con la bolla",
  ARRIVO_ANNULLATO: "Arrivo annullato",
};

export type MovimentoGiacenza = {
  id: number;
  delta: number;
  causale: CausaleGiacenza;
  createdAt: string;
  cliente: ClienteCopia | null;
  bolla: { id: number; anno: number; numero: number } | null;
};

export type GiacenzaDettaglio = Giacenza & { movimenti: MovimentoGiacenza[] };

// ── Bolle (arrivo della merce dal fornitore) ──

export type BollaRiepilogo = {
  id: number;
  anno: number;
  numero: number;
  barcode: string;
  data: string;
  numeroFornitore: string;
  note: string;
  copie: number;
  aClienti: number;
  inMagazzino: number;
  totale: number;
};

export type RigaBolla = {
  id: number;
  isbn: string;
  materia: string;
  autori: string;
  titolo: string;
  volume: string;
  editore: string;
  prezzo: string | number;
  destinazione: "CLIENTE" | "MAGAZZINO";
  createdAt: string;
  libro: { id: number; stato: StatoLibro; scheda: ClienteCopia & { classe: string; telefono: string } } | null;
  ordineRiga: { id: number; ordine: { id: number; anno: number; numero: number } } | null;
};

export type Bolla = Omit<BollaRiepilogo, "copie" | "aClienti" | "inMagazzino"> & { righe: RigaBolla[] };

// ── Usati (comprati al banco in conto vendita) ──

export type StatoCopia = "IN_NEGOZIO" | "ASSEGNATA" | "VENDUTA" | "PAGATA";

export const STATI_COPIA: Record<StatoCopia, { label: string; classe: string }> = {
  IN_NEGOZIO: { label: "In negozio", classe: "bg-sky-soft text-sky-ink" },
  ASSEGNATA: { label: "A un cliente", classe: "bg-brand-100 text-brand-800" },
  VENDUTA: { label: "Venduta, da pagare", classe: "bg-orange-soft text-orange-ink" },
  PAGATA: { label: "Pagata", classe: "bg-paper-warm text-ink-muted" },
};

export type CopiaUsata = {
  id: number;
  codice: string;
  isbn: string;
  materia: string;
  autori: string;
  titolo: string;
  volume: string;
  editore: string;
  prezzo: string | number;
  scontoVendita: string | number;
  prezzoVendita: string | number;
  percentualeAcquisto: string | number;
  prezzoAcquisto: string | number;
  createdAt: string;
  pagataAt: string | null;
  stato: StatoCopia;
  venditore: { id: number; cognome: string; nome: string };
  libro: { id: number; stato: StatoLibro; scheda: ClienteCopia & { classe: string; telefono: string } } | null;
};

export type ContiVenditore = { inNegozio: number; vendute: number; daPagare: number; pagato: number };

export type VenditoreRiepilogo = { id: number; cognome: string; nome: string; telefono: string; note: string; conti: ContiVenditore };

export type Venditore = VenditoreRiepilogo & { copie: CopiaUsata[] };
