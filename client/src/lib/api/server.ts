import "server-only";
import type {
  Category,
  CategoryNode,
  Facets,
  ListProduct,
  Paginated,
  Post,
  Product,
  StoreSettings,
} from "../types";

/**
 * Accesso all'API dal server Next.js (Server Components).
 * Le risposte finiscono nella Data Cache di Next con un tempo di validità e dei
 * tag: dopo una modifica dal pannello admin, /api/revalidate invalida i tag e
 * le pagine si aggiornano subito; altrimenti si rinnovano da sole ogni N secondi.
 */
export const API_URL = (
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://bambu-ecomm-in2g.vercel.app/api"
).replace(/\/$/, "");

type CacheOpts = { revalidate?: number; tags?: string[] };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

async function get<T>(path: string, { revalidate = 60, tags = [] }: CacheOpts = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate, tags },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new ApiError(res.status, `API ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

/** Come get() ma in caso di errore restituisce il fallback (la pagina resta in piedi). */
async function safeGet<T>(path: string, fallback: T, opts?: CacheOpts): Promise<T> {
  try {
    return await get<T>(path, opts);
  } catch (error) {
    console.error(`[api] ${path}:`, (error as Error).message);
    return fallback;
  }
}

export type ProductQuery = {
  page?: number;
  limit?: number;
  sort?: string;
  q?: string;
  categoryId?: number | number[];
  category?: string;
  brand?: string | string[];
  minPrice?: number | string;
  maxPrice?: number | string;
  onSale?: boolean;
  featured?: boolean;
  available?: boolean;
  ids?: number[];
  exclude?: number[];
  inStockFirst?: boolean;
};

export const toQueryString = (query: Record<string, unknown>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length) params.set(key, value.join(","));
    } else {
      params.set(key, String(value));
    }
  }
  const s = params.toString();
  return s ? `?${s}` : "";
};

const EMPTY_PAGE: Paginated<ListProduct> = { data: [], totalPages: 0, currentPage: 1, totalProducts: 0 };

export const getProducts = (query: ProductQuery = {}, revalidate = 60) =>
  safeGet<Paginated<ListProduct>>(`/products${toQueryString(query)}`, EMPTY_PAGE, {
    revalidate,
    tags: ["products"],
  });

export const getFacets = (query: ProductQuery = {}) =>
  safeGet<Facets>(
    `/products/facets${toQueryString(query)}`,
    { minPrice: 0, maxPrice: 0, brands: [], categories: [], onSaleCount: 0, availableCount: 0 },
    { revalidate: 300, tags: ["products"] }
  );

export const getProduct = async (id: number): Promise<Product | null> => {
  try {
    return await get<Product>(`/products/${id}`, { revalidate: 300, tags: ["products", `product:${id}`] });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
};

export const getRelated = (id: number, limit = 8) =>
  safeGet<ListProduct[]>(`/products/${id}/related?limit=${limit}`, [], {
    revalidate: 600,
    tags: ["products", `product:${id}`],
  });

export const getCategories = () =>
  safeGet<Category[]>("/categories", [], { revalidate: 600, tags: ["categories"] });

/** Albero categorie (ordine manuale, poi alfabetico) */
export const buildCategoryTree = (categories: Category[]): CategoryNode[] => {
  const nodes = new Map<number, CategoryNode>(categories.map((c) => [c.id, { ...c, children: [] }]));
  const roots: CategoryNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const sort = (list: CategoryNode[]) => {
    list.sort((a, b) => a.ordine - b.ordine || a.name.localeCompare(b.name, "it"));
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  return roots;
};

export const getCategoryTree = async () => buildCategoryTree(await getCategories());

export const getBrands = () =>
  safeGet<{ name: string; count: number }[]>("/products/brands", [], { revalidate: 600, tags: ["products"] });

export const DEFAULT_SETTINGS_FALLBACK: StoreSettings = {
  azienda: { ragioneSociale: "Cartoleria Bambù", partitaIva: "" },
  contatti: {
    telefono: "081 1997 0664",
    whatsapp: "393492719021",
    email: "cartoleriabambu@icloud.com",
    indirizzo: "Corso Umberto I, 367",
    citta: "80058 Torre Annunziata (NA)",
    mappaUrl: "https://maps.google.com/?q=Corso+Umberto+I+367+Torre+Annunziata",
    orari: [],
  },
  social: {},
  spedizione: {
    costo: 4.99,
    sogliaGratuita: 50,
    tempiConsegna: "2-4 giorni lavorativi",
    giorniLavorazione: 1,
    giorniTransitoMin: 1,
    giorniTransitoMax: 3,
    ritiroInNegozio: true,
    giornata: { attivo: false, costo: 5, orarioLimite: "13:00", cap: [], descrizione: "" },
  },
  pagamenti: { contrassegno: { attivo: false, commissione: 0 } },
  omaggio: { attivo: false, soglia: 0, prodottoId: null, messaggio: "" },
  topBar: { attivo: false, messaggi: [] },
  countdown: { attivo: false, titolo: "", data: null, link: "/" },
  banner: [],
  vetrine: [],
  servizi: [],
  faq: [],
  resi: { giorni: 14, testo: "" },
  newsletterPopup: { attivo: false, titolo: "", testo: "", ritardoSecondi: 20 },
};

const euroShort = (n: number) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n).replace(",00", "");

/**
 * I testi del pannello possono usare {soglia} e {costo}: qui li sostituiamo con
 * i valori reali, così cambiando la soglia di spedizione si aggiorna tutto il sito.
 */
const resolvePlaceholders = <T>(value: T, vars: Record<string, string>): T => {
  if (typeof value === "string") {
    return value.replace(/\{(soglia|costo)\}/g, (_, k: string) => vars[k]) as T;
  }
  if (Array.isArray(value)) return value.map((v) => resolvePlaceholders(v, vars)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, resolvePlaceholders(v, vars)])
    ) as T;
  }
  return value;
};

export const getSettings = async () => {
  const settings = await safeGet<StoreSettings>("/settings", DEFAULT_SETTINGS_FALLBACK, {
    revalidate: 300,
    tags: ["settings"],
  });
  return resolvePlaceholders(settings, {
    soglia: euroShort(settings.spedizione.sogliaGratuita),
    costo: euroShort(settings.spedizione.costo),
  });
};

export const getPosts = (limit = 12) =>
  safeGet<Post[]>(`/posts?limit=${limit}`, [], { revalidate: 600, tags: ["posts"] });

export const getPost = async (slug: string): Promise<Post | null> => {
  try {
    return await get<Post>(`/posts/${encodeURIComponent(slug)}`, { revalidate: 600, tags: ["posts", `post:${slug}`] });
  } catch {
    return null;
  }
};

export interface ReviewsResponse {
  media: number | null;
  totale: number;
  recensioni: { id: number; nome: string; voto: number; testo: string | null; createdAt: string; verificata: boolean }[];
}

export const getReviews = (productId: number) =>
  safeGet<ReviewsResponse>(`/reviews/product/${productId}`, { media: null, totale: 0, recensioni: [] }, {
    revalidate: 300,
    tags: [`product:${productId}`],
  });
