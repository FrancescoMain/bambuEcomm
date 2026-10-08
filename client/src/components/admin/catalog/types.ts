// Tipi delle risposte API usate solo dal pannello (catalogo, sconti, riepilogo)
import type { ListProduct, OrderStatus, Product, ShippingMethod } from "@/lib/types";

/** Campi necessari per mostrare/modificare lo sconto di un prodotto */
export type DiscountTarget = Pick<
  ListProduct,
  | "id"
  | "titolo"
  | "immagine"
  | "prezzo"
  | "prezzoScontato"
  | "prezzoFinale"
  | "scontoPercentuale"
  | "inOfferta"
  | "scontoInizio"
  | "scontoFine"
>;

/** Prodotto nella lista admin (il codice arriva solo se l'API lo include) */
export type AdminListProduct = ListProduct & { codice?: string | null };

/** Risposta di PATCH /products/:id/discount e /availability */
export interface ProductMutationResponse {
  message: string;
  product: Product;
}

export interface StockAlertGroup {
  product?: { id: number; titolo: string; immagine: string | null; available: boolean };
  richieste: number;
}

export interface Coupon {
  id: number;
  codice: string;
  nome: string;
  descrizione: string | null;
  tipo: "percentuale" | "importo";
  valore: number;
  minimoOrdine: number | null;
  maxUtilizzi: number | null;
  utilizzi: number;
  inizio: string;
  fine: string;
  attivo: boolean;
  prodotti: { id: number; titolo: string }[];
  categorie: { id: number; name: string }[];
  createdAt?: string;
}

export interface ImportError {
  row?: number;
  error: string;
}

export interface ImportStatus {
  progress: number;
  status: "pending" | "processing" | "done" | "error" | "cancelled";
  message?: string;
  created?: number;
  updated?: number;
  errors?: ImportError[];
  currentRow?: number;
  totalRows?: number;
}

export interface DashboardStats {
  summary: {
    totalOrders: number;
    newOrdersToday: number;
    pendingOrders: number;
    shippedToday: number;
    totalRevenue: number;
    monthlyGrowth: number;
    totalProducts: number;
    unavailableProducts: number;
    onSaleProducts: number;
    totalCustomers: number;
    newCustomersThisWeek: number;
    averageOrderValue: number;
  };
  todo: {
    ordiniDaEvadere: number;
    messaggiNonLetti: number;
    recensioniDaApprovare: number;
    recessiDaGestire: number;
    richiesteDisponibilita: number;
    iscrittiNewsletter: number;
  };
  salesData: { month: string; fatturato: number; ordini: number }[];
  recentOrders: {
    id: number;
    status: OrderStatus;
    createdAt: string;
    total: number;
    cliente: string;
    metodoConsegna: ShippingMethod | null;
  }[];
  topProducts: { id: number; name: string; sold: number; revenue: number }[];
}
