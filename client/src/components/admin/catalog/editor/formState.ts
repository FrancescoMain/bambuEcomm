// Modello del modulo prodotto: conversione da/verso l'API e controlli
import type { Product } from "@/lib/types";
import {
  computeSale,
  dateInputToIso,
  dateRangeError,
  initialDiscountInput,
  isoToDateInput,
  moneyInput,
  parseDecimal,
  parseIntSafe,
  type DiscountMode,
} from "../utils";

let seq = 0;
export const uid = () => `k${Date.now().toString(36)}${(seq++).toString(36)}`;

export interface VariantValueDraft {
  key: string;
  id?: number;
  nome: string;
  immagine: string | null;
}

export interface VariantDraft {
  key: string;
  id?: number;
  nome: string;
  valori: VariantValueDraft[];
}

export interface ProductFormState {
  titolo: string;
  marca: string;
  codice: string;
  descrizione: string;
  prezzo: string;
  saleOn: boolean;
  saleMode: DiscountMode;
  saleValue: string;
  saleSchedule: boolean;
  saleStart: string;
  saleEnd: string;
  images: string[];
  categoriaIds: number[];
  varianti: VariantDraft[];
  available: boolean;
  inEvidenza: boolean;
  personalizzabile: boolean;
  etichettaPersonalizzazione: string;
  maxPerOrdine: string;
  stock: string;
}

export type FormErrorKey =
  | "titolo"
  | "prezzo"
  | "sale"
  | "saleDates"
  | "images"
  | "categorie"
  | "varianti"
  | "etichetta"
  | "maxPerOrdine"
  | "stock";
export type FormErrors = Partial<Record<FormErrorKey, string>>;

/** Sezione della pagina in cui si trova ogni campo (per scorrere al primo errore) */
export const ERROR_SECTION: Record<FormErrorKey, string> = {
  titolo: "sezione-info",
  prezzo: "sezione-prezzo",
  sale: "sezione-prezzo",
  saleDates: "sezione-prezzo",
  images: "sezione-immagini",
  categorie: "sezione-categorie",
  varianti: "sezione-varianti",
  etichetta: "sezione-opzioni",
  maxPerOrdine: "sezione-opzioni",
  stock: "sezione-opzioni",
};

export const emptyForm = (): ProductFormState => ({
  titolo: "",
  marca: "",
  codice: "",
  descrizione: "",
  prezzo: "",
  saleOn: false,
  saleMode: "percent",
  saleValue: "",
  saleSchedule: false,
  saleStart: "",
  saleEnd: "",
  images: [],
  categoriaIds: [],
  varianti: [],
  available: true,
  inEvidenza: false,
  personalizzabile: false,
  etichettaPersonalizzazione: "",
  maxPerOrdine: "",
  stock: "",
});

export const formFromProduct = (p: Product): ProductFormState => {
  const sale = initialDiscountInput(p.prezzo, p.prezzoScontato);
  const images = [p.immagine, ...(p.immagini || [])].filter(
    (src, i, all): src is string => !!src && all.indexOf(src) === i
  );
  return {
    titolo: p.titolo || "",
    marca: p.marca || "",
    codice: p.codice || "",
    descrizione: p.descrizione || "",
    prezzo: moneyInput(p.prezzo),
    saleOn: p.prezzoScontato !== null,
    saleMode: sale.mode,
    saleValue: sale.value,
    saleSchedule: !!(p.scontoInizio || p.scontoFine),
    saleStart: isoToDateInput(p.scontoInizio),
    saleEnd: isoToDateInput(p.scontoFine),
    images,
    categoriaIds: p.categoria.map((c) => c.id),
    varianti: (p.varianti || []).map((t) => ({
      key: uid(),
      id: t.id,
      nome: t.nome,
      valori: t.valori.map((v) => ({ key: uid(), id: v.id, nome: v.nome, immagine: v.immagine || null })),
    })),
    available: p.available,
    inEvidenza: p.inEvidenza,
    personalizzabile: p.personalizzabile,
    etichettaPersonalizzazione: p.etichettaPersonalizzazione || "",
    maxPerOrdine: p.maxPerOrdine ? String(p.maxPerOrdine) : "",
    stock: String(p.stock ?? 0),
  };
};

/** Prezzo scontato risultante dal modulo (null se l'offerta è spenta o incompleta) */
export const formSale = (form: ProductFormState) => {
  const full = parseDecimal(form.prezzo);
  if (!form.saleOn) return { full, ...computeSale(full, form.saleMode, "") };
  return { full, ...computeSale(full && full > 0 ? full : null, form.saleMode, form.saleValue) };
};

export const validateForm = (form: ProductFormState): FormErrors => {
  const errors: FormErrors = {};
  if (!form.titolo.trim()) errors.titolo = "Scrivi il nome del prodotto.";
  const full = parseDecimal(form.prezzo);
  if (full === null || full <= 0) errors.prezzo = "Inserisci un prezzo maggiore di zero (es. 12,50).";
  if (form.saleOn) {
    const sale = formSale(form);
    if (!form.saleValue.trim()) errors.sale = "Indica lo sconto, oppure spegni «Metti in offerta».";
    else if (sale.error) errors.sale = sale.error;
    if (form.saleSchedule) {
      const dates = dateRangeError(form.saleStart, form.saleEnd);
      if (dates) errors.saleDates = dates;
    }
  }
  if (!form.categoriaIds.length) errors.categorie = "Scegli almeno una categoria: serve ai clienti per trovarlo.";
  for (const type of form.varianti) {
    const values = type.valori.filter((v) => v.nome.trim());
    if (!type.nome.trim()) {
      errors.varianti = "Dai un nome a ogni variante (es. Colore) oppure eliminala.";
      break;
    }
    if (!values.length) {
      errors.varianti = `Aggiungi almeno una scelta alla variante «${type.nome.trim()}» oppure eliminala.`;
      break;
    }
    const names = values.map((v) => v.nome.trim().toLowerCase());
    if (new Set(names).size !== names.length) {
      errors.varianti = `Nella variante «${type.nome.trim()}» ci sono scelte ripetute.`;
      break;
    }
  }
  if (form.personalizzabile && form.etichettaPersonalizzazione.length > 80) {
    errors.etichetta = "Massimo 80 caratteri.";
  }
  if (form.maxPerOrdine.trim() && !parseIntSafe(form.maxPerOrdine)) {
    errors.maxPerOrdine = "Inserisci un numero intero maggiore di zero (es. 5) oppure lascia vuoto.";
  }
  if (form.stock.trim() && parseIntSafe(form.stock) === null) {
    errors.stock = "Inserisci un numero intero (es. 10) oppure lascia vuoto.";
  }
  return errors;
};

/** Mantiene l'orario originale se la data non è stata cambiata */
const keepOrConvert = (input: string, originalIso: string | null | undefined, endOfDay: boolean) => {
  if (!input) return null;
  if (originalIso && isoToDateInput(originalIso) === input) return originalIso;
  return dateInputToIso(input, endOfDay);
};

/** Corpo per POST/PUT /products */
export const toPayload = (form: ProductFormState, original?: Product | null) => {
  const full = parseDecimal(form.prezzo) ?? 0;
  const sale = formSale(form);
  const onSale = form.saleOn && sale.salePrice !== null;
  return {
    titolo: form.titolo.trim(),
    descrizione: form.descrizione.trim() || null,
    marca: form.marca.trim() || null,
    codice: form.codice.trim() || null,
    prezzo: full,
    prezzoScontato: onSale ? sale.salePrice : null,
    scontoInizio: onSale && form.saleSchedule ? keepOrConvert(form.saleStart, original?.scontoInizio, false) : null,
    scontoFine: onSale && form.saleSchedule ? keepOrConvert(form.saleEnd, original?.scontoFine, true) : null,
    immagine: form.images[0] ?? null,
    immagini: form.images.slice(1),
    categoriaIds: form.categoriaIds,
    varianti: form.varianti.map((t) => ({
      ...(t.id ? { id: t.id } : {}),
      nome: t.nome.trim(),
      valori: t.valori
        .filter((v) => v.nome.trim())
        .map((v) => ({ ...(v.id ? { id: v.id } : {}), nome: v.nome.trim(), immagine: v.immagine || undefined })),
    })),
    available: form.available,
    inEvidenza: form.inEvidenza,
    personalizzabile: form.personalizzabile,
    etichettaPersonalizzazione: form.personalizzabile ? form.etichettaPersonalizzazione.trim() || null : null,
    maxPerOrdine: parseIntSafe(form.maxPerOrdine) || null,
    ...(form.stock.trim() ? { stock: parseIntSafe(form.stock) ?? 0 } : {}),
  };
};

/** Firma del modulo per capire se ci sono modifiche non salvate (le chiavi interne non contano) */
export const formSignature = (form: ProductFormState) =>
  JSON.stringify({
    ...form,
    varianti: form.varianti.map((t) => ({ id: t.id, nome: t.nome, valori: t.valori.map(({ key, ...v }) => v) })),
  });
