export type ContactType = "contatto" | "b2b" | "preventivo";

export interface ContactMessage {
  id: number;
  tipo: ContactType;
  dati: Record<string, string | number | null | undefined> | null;
  nome: string;
  email: string;
  telefono: string | null;
  oggetto: string | null;
  messaggio: string;
  letto: boolean;
  createdAt: string;
}

export const CONTACT_TYPES: { value: ContactType; label: string; singular: string; description: string }[] = [
  {
    value: "contatto",
    label: "Contatti",
    singular: "Messaggio dal sito",
    description: "Domande dei clienti dal modulo contatti.",
  },
  {
    value: "b2b",
    label: "Rivenditori",
    singular: "Richiesta rivenditore",
    description: "Negozi e aziende che vogliono rivendere o acquistare all'ingrosso.",
  },
  {
    value: "preventivo",
    label: "Preventivi",
    singular: "Richiesta di preventivo",
    description: "Scuole, uffici ed enti che chiedono un preventivo.",
  },
];

export const typeMeta = (tipo: string) => CONTACT_TYPES.find((t) => t.value === tipo) ?? CONTACT_TYPES[0];

/** Etichette leggibili per i campi extra dei moduli */
const DATI_LABELS: Record<string, string> = {
  ragioneSociale: "Ragione sociale",
  partitaIva: "Partita IVA",
  citta: "Città",
  ente: "Scuola / ente",
  tipologia: "Tipologia",
  quantita: "Quantità",
  dataConsegna: "Consegna desiderata",
  budget: "Budget",
};

const humanize = (key: string) => {
  const spaced = key.replace(/[_-]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

export const extraFields = (m: ContactMessage): { key: string; label: string; value: string }[] => {
  if (!m.dati || typeof m.dati !== "object") return [];
  const order = Object.keys(DATI_LABELS);
  return Object.entries(m.dati)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .sort(([a], [b]) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })
    .map(([key, value]) => ({ key, label: DATI_LABELS[key] ?? humanize(key), value: String(value) }));
};

/** Riga di anteprima nell'elenco (oggetto o dato più significativo) */
export const previewTitle = (m: ContactMessage) =>
  m.oggetto ||
  (m.dati?.ragioneSociale ? String(m.dati.ragioneSociale) : "") ||
  (m.dati?.ente ? String(m.dati.ente) : "") ||
  typeMeta(m.tipo).singular;

export const replyHref = (m: ContactMessage) => {
  const subject = m.oggetto ? `Re: ${m.oggetto}` : `${typeMeta(m.tipo).singular} - Cartoleria Bambù`;
  const quoted = m.messaggio.length > 900 ? `${m.messaggio.slice(0, 900)}…` : m.messaggio;
  const body = `Ciao ${m.nome.split(" ")[0]},\n\n\n\n---\nIl tuo messaggio:\n${quoted
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n")}`;
  return `mailto:${m.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
};
