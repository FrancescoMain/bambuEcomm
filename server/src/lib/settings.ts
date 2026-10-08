import { Prisma } from "@prisma/client";
import prisma from "./prisma";

/**
 * Impostazioni del negozio modificabili dal pannello admin, senza toccare il codice:
 * spedizioni, pagamenti, barra messaggi, banner della home, contatti, FAQ...
 */
export type ShippingMethod = "spedizione" | "ritiro" | "giornata";

export interface StoreSettings {
  azienda: { ragioneSociale: string; partitaIva: string };
  contatti: {
    telefono: string;
    whatsapp: string;
    email: string;
    indirizzo: string;
    citta: string;
    mappaUrl: string;
    orari: { giorni: string; orario: string }[];
  };
  social: { instagram?: string; tiktok?: string; facebook?: string };
  spedizione: {
    costo: number;
    sogliaGratuita: number;
    tempiConsegna: string;
    /** Giorni lavorativi di preparazione e di transito (per la stima di consegna) */
    giorniLavorazione: number;
    giorniTransitoMin: number;
    giorniTransitoMax: number;
    ritiroInNegozio: boolean;
    giornata: {
      attivo: boolean;
      costo: number;
      orarioLimite: string;
      cap: string[];
      descrizione: string;
    };
  };
  pagamenti: {
    contrassegno: { attivo: boolean; commissione: number };
  };
  /** Prodotto in omaggio sopra una soglia di spesa */
  omaggio: { attivo: boolean; soglia: number; prodottoId: number | null; messaggio: string };
  topBar: { attivo: boolean; messaggi: string[] };
  countdown: { attivo: boolean; titolo: string; data: string | null; link: string };
  banner: {
    titolo: string;
    sottotitolo?: string;
    immagine?: string;
    link?: string;
    cta?: string;
    colore?: string;
  }[];
  vetrine: { titolo: string; testo?: string; immagine?: string; link: string; cta?: string; colore?: string }[];
  servizi: { titolo: string; descrizione: string; icona: string }[];
  faq: { domanda: string; risposta: string }[];
  resi: { giorni: number; testo: string };
  newsletterPopup: { attivo: boolean; titolo: string; testo: string; ritardoSecondi: number };
}

export const DEFAULT_SETTINGS: StoreSettings = {
  azienda: { ragioneSociale: "Cartoleria Bambù", partitaIva: "" },
  contatti: {
    telefono: "081 1997 0664",
    whatsapp: "393492719021",
    email: "cartoleriabambu@icloud.com",
    indirizzo: "Corso Umberto I, 367",
    citta: "80058 Torre Annunziata (NA)",
    mappaUrl: "https://maps.google.com/?q=Corso+Umberto+I+367+Torre+Annunziata",
    orari: [
      { giorni: "Lunedì - Venerdì", orario: "7:15 - 13:30 · 16:30 - 20:30" },
      { giorni: "Sabato", orario: "7:30 - 13:30" },
      { giorni: "Domenica", orario: "8:30 - 13:30" },
    ],
  },
  social: {
    instagram: "https://www.instagram.com/cartoleriabambu",
    tiktok: "https://www.tiktok.com/@cartolibreria_bambu",
  },
  spedizione: {
    costo: 4.99,
    sogliaGratuita: 50,
    tempiConsegna: "2-4 giorni lavorativi",
    giorniLavorazione: 1,
    giorniTransitoMin: 1,
    giorniTransitoMax: 3,
    ritiroInNegozio: true,
    giornata: {
      attivo: false,
      costo: 5,
      orarioLimite: "13:00",
      cap: ["80058"],
      descrizione: "Consegna in giornata a Torre Annunziata per ordini entro le 13:00",
    },
  },
  pagamenti: { contrassegno: { attivo: false, commissione: 3 } },
  omaggio: {
    attivo: false,
    soglia: 60,
    prodottoId: null,
    messaggio: "Per te un omaggio con ordini sopra i 60 €!",
  },
  topBar: {
    attivo: true,
    messaggi: [
      "Spedizione gratuita sopra i {soglia}",
      "Ritiro gratuito in negozio a Torre Annunziata",
      "Pagamenti sicuri con carta, Apple Pay e Google Pay",
    ],
  },
  countdown: { attivo: false, titolo: "Mancano pochi giorni al rientro a scuola!", data: null, link: "/offerte" },
  banner: [
    {
      titolo: "Tutto per la scuola",
      sottotitolo: "Quaderni, zaini, astucci e cancelleria delle migliori marche",
      link: "/categoria/scuola",
      cta: "Scopri la collezione",
      colore: "orange",
    },
    {
      titolo: "Offerte della settimana",
      sottotitolo: "Prezzi speciali su una selezione di articoli",
      link: "/offerte",
      cta: "Vedi le offerte",
      colore: "magenta",
    },
    {
      titolo: "Idee regalo",
      sottotitolo: "Giochi, gadget e pensieri per ogni occasione",
      link: "/categoria/giochi",
      cta: "Trova il regalo giusto",
      colore: "blue",
    },
  ],
  vetrine: [
    { titolo: "Scuola", testo: "Zaini, astucci, quaderni", link: "/categoria/scuola", colore: "orange" },
    { titolo: "Ufficio", testo: "Penne, agende, archivio", link: "/categoria/ufficio", colore: "magenta" },
    { titolo: "Giochi", testo: "Idee per tutte le età", link: "/categoria/giochi", colore: "green" },
    { titolo: "Offerte", testo: "Prezzi scontati", link: "/offerte", colore: "blue" },
  ],
  servizi: [
    { titolo: "Spedizione rapida", descrizione: "Gratis sopra i {soglia}", icona: "truck" },
    { titolo: "Ritiro in negozio", descrizione: "Gratis a Torre Annunziata", icona: "store" },
    { titolo: "Pagamenti sicuri", descrizione: "Carta, Apple Pay, Google Pay", icona: "lock" },
    { titolo: "Assistenza WhatsApp", descrizione: "Rispondiamo in pochi minuti", icona: "chat" },
    { titolo: "Ordini per scuole e uffici", descrizione: "Richiedi un preventivo", icona: "briefcase" },
  ],
  faq: [
    {
      domanda: "Quanto costa la spedizione?",
      risposta:
        "La spedizione costa {costo} ed è gratuita per ordini da {soglia} in su. Puoi anche ritirare gratis in negozio a Torre Annunziata.",
    },
    {
      domanda: "Quanto tempo impiega la consegna?",
      risposta:
        "Prepariamo l'ordine entro 1 giorno lavorativo; la consegna avviene in genere in 2-4 giorni lavorativi. Riceverai il numero di tracking via email.",
    },
    {
      domanda: "Posso ritirare l'ordine in negozio?",
      risposta:
        "Sì: scegli \"Ritiro in negozio\" al checkout. Ti avviseremo via email quando l'ordine è pronto.",
    },
    {
      domanda: "Come posso restituire un prodotto?",
      risposta:
        "Hai 14 giorni dalla consegna per esercitare il diritto di recesso dalla pagina \"Recesso online\". Le spese di restituzione sono a carico del cliente.",
    },
    {
      domanda: "Quali metodi di pagamento accettate?",
      risposta: "Carte di credito e debito, Apple Pay e Google Pay tramite Stripe, in totale sicurezza.",
    },
  ],
  resi: {
    giorni: 14,
    testo:
      "Puoi recedere dall'acquisto entro 14 giorni dalla consegna senza indicarne il motivo. I prodotti devono essere integri e nella confezione originale; le spese di restituzione sono a carico del cliente. Il rimborso avviene entro 14 giorni dalla ricezione del reso con lo stesso metodo di pagamento. Sono esclusi i prodotti personalizzati.",
  },
  newsletterPopup: {
    attivo: false,
    titolo: "Iscriviti alla newsletter",
    testo: "Novità, offerte e idee per la scuola direttamente nella tua email.",
    ritardoSecondi: 20,
  },
};

const KEY = "store";
let cache: { at: number; value: StoreSettings } | null = null;

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Merge profondo: gli array sostituiscono, gli oggetti si fondono. */
const deepMerge = <T>(base: T, patch: unknown): T => {
  if (!isPlainObject(base) || !isPlainObject(patch)) {
    return (patch === undefined ? base : patch) as T;
  }
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined) continue;
    out[k] = isPlainObject(v) && isPlainObject(out[k]) ? deepMerge(out[k], v) : v;
  }
  return out as T;
};

export const getSettings = async (maxAgeMs = 30_000): Promise<StoreSettings> => {
  if (cache && Date.now() - cache.at < maxAgeMs) return cache.value;
  const row = await prisma.setting.findUnique({ where: { key: KEY } });
  const value = deepMerge(DEFAULT_SETTINGS, row?.value ?? {});
  cache = { at: Date.now(), value };
  return value;
};

const money = (v: unknown, fallback: number) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : fallback;
};
const int = (v: unknown, fallback: number, min = 0, max = 60) => {
  const n = parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
const strings = (v: unknown, max: number) =>
  (Array.isArray(v) ? v : [])
    .map((m) => String(m ?? "").trim())
    .filter(Boolean)
    .slice(0, max);

/** Normalizza e salva le impostazioni (merge con quelle esistenti). */
export const saveSettings = async (patch: unknown): Promise<StoreSettings> => {
  const current = await getSettings(0);
  const s = deepMerge(current, patch);
  const d = DEFAULT_SETTINGS;

  s.spedizione.costo = money(s.spedizione.costo, d.spedizione.costo);
  s.spedizione.sogliaGratuita = money(s.spedizione.sogliaGratuita, d.spedizione.sogliaGratuita);
  s.spedizione.giorniLavorazione = int(s.spedizione.giorniLavorazione, 1, 0, 30);
  s.spedizione.giorniTransitoMin = int(s.spedizione.giorniTransitoMin, 1, 0, 30);
  s.spedizione.giorniTransitoMax = Math.max(
    s.spedizione.giorniTransitoMin,
    int(s.spedizione.giorniTransitoMax, 3, 0, 30)
  );
  s.spedizione.ritiroInNegozio = !!s.spedizione.ritiroInNegozio;
  s.spedizione.giornata.attivo = !!s.spedizione.giornata.attivo;
  s.spedizione.giornata.costo = money(s.spedizione.giornata.costo, d.spedizione.giornata.costo);
  s.spedizione.giornata.cap = strings(s.spedizione.giornata.cap, 50).filter((c) => /^\d{5}$/.test(c));
  if (!/^\d{1,2}:\d{2}$/.test(String(s.spedizione.giornata.orarioLimite))) {
    s.spedizione.giornata.orarioLimite = d.spedizione.giornata.orarioLimite;
  }
  s.pagamenti.contrassegno.attivo = !!s.pagamenti.contrassegno.attivo;
  s.pagamenti.contrassegno.commissione = money(
    s.pagamenti.contrassegno.commissione,
    d.pagamenti.contrassegno.commissione
  );
  s.omaggio.attivo = !!s.omaggio.attivo;
  s.omaggio.soglia = money(s.omaggio.soglia, d.omaggio.soglia);
  const giftId = parseInt(String(s.omaggio.prodottoId ?? ""), 10);
  s.omaggio.prodottoId = Number.isFinite(giftId) && giftId > 0 ? giftId : null;
  s.topBar.messaggi = strings(s.topBar.messaggi, 6);
  s.banner = (Array.isArray(s.banner) ? s.banner : []).filter((b) => b && String(b.titolo || "").trim()).slice(0, 8);
  s.vetrine = (Array.isArray(s.vetrine) ? s.vetrine : []).filter((b) => b && String(b.titolo || "").trim()).slice(0, 8);
  s.faq = (Array.isArray(s.faq) ? s.faq : [])
    .filter((f) => f && String(f.domanda || "").trim() && String(f.risposta || "").trim())
    .slice(0, 40);
  s.resi.giorni = int(s.resi.giorni, 14, 14, 365);
  s.newsletterPopup.attivo = !!s.newsletterPopup.attivo;
  s.newsletterPopup.ritardoSecondi = int(s.newsletterPopup.ritardoSecondi, 20, 0, 600);
  s.countdown.attivo = !!s.countdown.attivo && !!s.countdown.data;

  await prisma.setting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: s as unknown as Prisma.InputJsonValue },
    update: { value: s as unknown as Prisma.InputJsonValue },
  });
  cache = { at: Date.now(), value: s };
  return s;
};

/** Ora corrente a Roma (le regole "entro le 13:00" seguono l'orario del negozio). */
const romeNow = (now: Date) => {
  const parts = new Intl.DateTimeFormat("it-IT", {
    timeZone: "Europe/Rome",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  return { minutes: parseInt(get("hour"), 10) * 60 + parseInt(get("minute"), 10), weekday: get("weekday") };
};

/**
 * Verifica se un metodo di consegna è utilizzabile per il CAP indicato.
 * Restituisce un messaggio d'errore oppure null.
 */
export const shippingMethodError = (
  settings: StoreSettings,
  method: ShippingMethod,
  cap?: string | null,
  now = new Date()
): string | null => {
  if (method === "ritiro" && !settings.spedizione.ritiroInNegozio) {
    return "Il ritiro in negozio non è al momento disponibile.";
  }
  if (method === "giornata") {
    const g = settings.spedizione.giornata;
    if (!g.attivo) return "La consegna in giornata non è al momento disponibile.";
    if (cap && !g.cap.includes(String(cap).trim())) {
      return "La consegna in giornata non è disponibile per il tuo CAP.";
    }
    const [h, m] = g.orarioLimite.split(":").map((x) => parseInt(x, 10));
    const { minutes, weekday } = romeNow(now);
    if (weekday.startsWith("dom") || minutes > h * 60 + m) {
      return `La consegna in giornata è disponibile per ordini entro le ${g.orarioLimite} (lun-sab).`;
    }
  }
  return null;
};

/** Costo di consegna per un subtotale e un metodo. */
export const shippingCostFor = (
  settings: StoreSettings,
  subtotal: number,
  method: ShippingMethod = "spedizione"
): number => {
  if (method === "ritiro") return 0;
  if (method === "giornata") return settings.spedizione.giornata.costo;
  if (subtotal >= settings.spedizione.sogliaGratuita) return 0;
  return settings.spedizione.costo;
};
