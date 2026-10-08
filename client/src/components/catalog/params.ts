/** Lettura dei parametri di filtro/ordinamento dall'URL delle pagine catalogo */
export type SearchParams = Record<string, string | string[] | undefined>;

export const SORT_OPTIONS = [
  { value: "featured", label: "In primo piano" },
  { value: "bestseller", label: "Più venduti" },
  { value: "newest", label: "Novità" },
  { value: "price_asc", label: "Prezzo crescente" },
  { value: "price_desc", label: "Prezzo decrescente" },
  { value: "discount", label: "Sconto maggiore" },
  { value: "name_asc", label: "Nome A-Z" },
  { value: "name_desc", label: "Nome Z-A" },
] as const;

export const PAGE_SIZE = 24;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function readCatalogParams(sp: SearchParams, defaultSort: string) {
  const page = Math.max(1, parseInt(first(sp.page) || "1", 10) || 1);
  const sortRaw = first(sp.sort);
  const sort = SORT_OPTIONS.some((o) => o.value === sortRaw) || sortRaw === "relevance" ? sortRaw! : defaultSort;
  const brands = (first(sp.brand) || "")
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean);
  const num = (v: string | undefined) => {
    const n = parseFloat((v || "").replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  return {
    page,
    sort,
    brands,
    minPrice: num(first(sp.min)),
    maxPrice: num(first(sp.max)),
    onlyAvailable: first(sp.disponibili) === "1",
    onlySale: first(sp.offerte) === "1",
    q: (first(sp.q) || "").trim(),
    /** true se l'utente ha applicato filtri/ordinamenti: queste varianti non vanno indicizzate */
    filtered:
      !!sortRaw || brands.length > 0 || !!first(sp.min) || !!first(sp.max) || !!first(sp.disponibili) || !!first(sp.offerte),
  };
}

export type CatalogParams = ReturnType<typeof readCatalogParams>;
