// Tipi condivisi tra storefront e pannello admin (rispecchiano le risposte dell'API)

export interface CategoryRef {
  id: number;
  name: string;
  parentId: number | null;
  description?: string | null;
}

export interface Category extends CategoryRef {
  slug: string;
  description: string | null;
  immagine: string | null;
  ordine: number;
  productCount: number;
  childrenCount: number;
  _count?: { products: number; children: number };
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryNode extends Category {
  children: CategoryNode[];
}

/** Campi prezzo calcolati dal server (sconto incluso) */
export interface Pricing {
  prezzo: number;
  prezzoScontato: number | null;
  prezzoFinale: number;
  scontoPercentuale: number | null;
  inOfferta: boolean;
  scontoInizio?: string | null;
  scontoFine?: string | null;
}

export interface VariantValue {
  id: number;
  nome: string;
  immagine?: string | null;
  typeId?: number;
}

export interface VariantType {
  id: number;
  nome: string;
  productId?: number;
  valori: VariantValue[];
}

/** Prodotto nelle liste (card) */
export interface ListProduct extends Pricing {
  id: number;
  titolo: string;
  immagine: string | null;
  immagini?: string[];
  available: boolean;
  stock: number;
  marca: string | null;
  codice?: string | null;
  inEvidenza: boolean;
  createdAt: string;
  updatedAt: string;
  categoria: CategoryRef[];
  hasVariants: boolean;
  varianti?: VariantType[];
}

/** Prodotto completo (scheda prodotto / editor admin) */
export interface Product extends Pricing {
  id: number;
  titolo: string;
  descrizione: string | null;
  immagine: string | null;
  immagini: string[];
  marca: string | null;
  codice: string | null;
  stock: number;
  available: boolean;
  inEvidenza: boolean;
  personalizzabile: boolean;
  etichettaPersonalizzazione: string | null;
  maxPerOrdine: number | null;
  createdAt: string;
  updatedAt: string;
  categoria: CategoryRef[];
  varianti: VariantType[];
  rating?: { media: number | null; totale: number };
}

export interface Paginated<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalProducts: number;
}

export interface Facets {
  minPrice: number;
  maxPrice: number;
  brands: { name: string; count: number }[];
  categories: { id: number; count: number }[];
  onSaleCount: number;
  availableCount: number;
}

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
    giorniLavorazione: number;
    giorniTransitoMin: number;
    giorniTransitoMax: number;
    ritiroInNegozio: boolean;
    giornata: { attivo: boolean; costo: number; orarioLimite: string; cap: string[]; descrizione: string };
  };
  pagamenti: { contrassegno: { attivo: boolean; commissione: number } };
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

export type SelectedVariants = Record<string, { id: number; nome: string; immagine?: string | null }>;
export type ShippingMethod = "spedizione" | "ritiro" | "giornata";
export type PaymentMethod = "stripe" | "contrassegno";

export interface QuoteLine {
  key: string;
  productId: number;
  titolo: string;
  immagine: string | null;
  quantity: number;
  prezzoUnitario: number;
  prezzoListino: number;
  scontoPercentuale: number | null;
  lineTotal: number;
  variantKey: string;
  selectedVariants: SelectedVariants | null;
  variantLabel: string;
  personalizzazione: string | null;
  available: boolean;
  maxPerOrdine: number | null;
  omaggio?: boolean;
  error?: string;
  cartItemId?: number | null;
}

export interface CartQuote {
  items: QuoteLine[];
  omaggio: QuoteLine | null;
  subtotal: number;
  risparmio: number;
  shipping: number;
  shippingMethod: ShippingMethod;
  shippingError: string | null;
  paymentMethod: PaymentMethod;
  paymentFee: number;
  freeShippingThreshold: number;
  remainingForFreeShipping: number;
  giftThreshold: number | null;
  remainingForGift: number | null;
  coupon: { code: string; discount: number; label: string } | null;
  couponError: string | null;
  total: number;
  errors: string[];
  itemCount: number;
}

export interface User {
  id: number;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN";
  createdAt?: string;
}

export type OrderStatus =
  | "PENDING"
  | "AWAITING_PAYMENT"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "FAILED"
  | "REFUNDED";

export interface OrderItem {
  id: number;
  productId: number;
  quantity: number;
  priceAtPurchase: string | number;
  prezzoListino: string | number | null;
  titolo: string | null;
  selectedVariants: SelectedVariants | null;
  personalizzazione: string | null;
  product: { id: number; titolo: string; immagine: string | null; prezzo?: string | number };
}

export interface Order {
  id: number;
  userId: number | null;
  status: OrderStatus;
  totalAmount: string | number;
  subtotale: string | number | null;
  costoSpedizione: string | number | null;
  sconto: string | number | null;
  codiceCoupon: string | null;
  metodoConsegna: ShippingMethod | null;
  metodoPagamento: PaymentMethod | null;
  commissionePagamento: string | number | null;
  trackingNumber: string | null;
  paymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
  guestEmail: string | null;
  nome: string | null;
  cognome: string | null;
  telefono: string | null;
  via: string | null;
  numero: string | null;
  citta: string | null;
  cap: string | null;
  stato: string | null;
  note: string | null;
  richiestaFattura: boolean;
  ragioneSociale: string | null;
  partitaIva: string | null;
  codiceFiscale: string | null;
  codiceSdi: string | null;
  pec: string | null;
  orderItems: OrderItem[];
  user: { id: number; name: string | null; email: string } | null;
}

export interface Post {
  id: number;
  titolo: string;
  slug: string;
  estratto: string | null;
  contenuto?: string;
  copertina: string | null;
  pubblicato: boolean;
  publishedAt: string | null;
  updatedAt: string;
}

export interface Review {
  id: number;
  nome: string;
  voto: number;
  testo: string | null;
  createdAt: string;
  verificata: boolean;
}

/** Campi usati dalla card prodotto (le liste passate ai componenti client restano leggere) */
export type CardProduct = Pick<
  ListProduct,
  | "id"
  | "titolo"
  | "immagine"
  | "immagini"
  | "prezzo"
  | "prezzoFinale"
  | "scontoPercentuale"
  | "inOfferta"
  | "available"
  | "marca"
  | "createdAt"
  | "categoria"
  | "hasVariants"
>;

export const toCardProduct = (p: ListProduct): CardProduct => ({
  id: p.id,
  titolo: p.titolo,
  immagine: p.immagine,
  immagini: (p.immagini || []).filter((src) => src && src !== p.immagine).slice(0, 1),
  prezzo: p.prezzo,
  prezzoFinale: p.prezzoFinale,
  scontoPercentuale: p.scontoPercentuale,
  inOfferta: p.inOfferta,
  available: p.available,
  marca: p.marca,
  createdAt: p.createdAt,
  categoria: p.categoria.slice(-1).map((c) => ({ id: c.id, name: c.name, parentId: c.parentId })),
  hasVariants: p.hasVariants,
});
