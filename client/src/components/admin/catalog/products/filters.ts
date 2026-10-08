// Stato dei filtri della lista prodotti, sincronizzato con l'URL
// (?q=&categoria=&disponibilita=&offerta=1&evidenza=1&ordine=&pagina=)

export const PAGE_SIZE = 20;

export const SORT_OPTIONS = [
  { value: "newest", label: "Più recenti" },
  { value: "oldest", label: "Meno recenti" },
  { value: "name_asc", label: "Nome A → Z" },
  { value: "name_desc", label: "Nome Z → A" },
  { value: "price_asc", label: "Prezzo più basso" },
  { value: "price_desc", label: "Prezzo più alto" },
  { value: "discount", label: "Sconto più alto" },
  { value: "bestseller", label: "Più venduti" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];
export type Availability = "" | "disponibili" | "esauriti";

export interface ListFilters {
  q: string;
  categoria: number | null;
  disponibilita: Availability;
  offerta: boolean;
  evidenza: boolean;
  ordine: SortKey;
  pagina: number;
}

const isSort = (v: string | null): v is SortKey => SORT_OPTIONS.some((o) => o.value === v);

type Params = { get(name: string): string | null };

export const readFilters = (params: Params): ListFilters => {
  const categoria = Number(params.get("categoria"));
  const pagina = Number(params.get("pagina"));
  const disp = params.get("disponibilita");
  const ordine = params.get("ordine");
  return {
    q: params.get("q") || "",
    categoria: Number.isInteger(categoria) && categoria > 0 ? categoria : null,
    disponibilita: disp === "disponibili" || disp === "esauriti" ? disp : "",
    offerta: params.get("offerta") === "1",
    evidenza: params.get("evidenza") === "1",
    ordine: isSort(ordine) ? ordine : "newest",
    pagina: Number.isInteger(pagina) && pagina > 1 ? pagina : 1,
  };
};

/** Scrive i filtri nella query string mantenendo gli altri parametri (es. alerts) */
export const writeFilters = (current: URLSearchParams, f: ListFilters): string => {
  const params = new URLSearchParams(current.toString());
  const set = (key: string, value: string | null) => {
    if (value) params.set(key, value);
    else params.delete(key);
  };
  set("q", f.q.trim() || null);
  set("categoria", f.categoria ? String(f.categoria) : null);
  set("disponibilita", f.disponibilita || null);
  set("offerta", f.offerta ? "1" : null);
  set("evidenza", f.evidenza ? "1" : null);
  set("ordine", f.ordine !== "newest" ? f.ordine : null);
  set("pagina", f.pagina > 1 ? String(f.pagina) : null);
  return params.toString();
};

/** Parametri per GET /products */
export const toApiQuery = (f: ListFilters) => ({
  page: f.pagina,
  limit: PAGE_SIZE,
  q: f.q.trim() || undefined,
  categoryId: f.categoria ?? undefined,
  available: f.disponibilita === "disponibili" ? "true" : f.disponibilita === "esauriti" ? "false" : undefined,
  onSale: f.offerta ? "true" : undefined,
  featured: f.evidenza ? "true" : undefined,
  sort: f.ordine,
});

export const activeFilterCount = (f: ListFilters) =>
  [f.categoria, f.disponibilita, f.offerta, f.evidenza].filter(Boolean).length;

/** Dove tornare dall'editor: la lista con gli stessi filtri */
export const LIST_QUERY_KEY = "bambu-admin:prodotti-query";

export const listHref = () => {
  try {
    const q = sessionStorage.getItem(LIST_QUERY_KEY);
    return q ? `/dashboard/prodotti?${q}` : "/dashboard/prodotti";
  } catch {
    return "/dashboard/prodotti";
  }
};
