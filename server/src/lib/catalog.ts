import { Prisma } from "@prisma/client";
import prisma from "./prisma";
import { withPricing } from "./pricing";

/** Filtri supportati dalle liste prodotti (storefront e admin). */
export interface ProductFilters {
  categoryIds?: number[];
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  brands?: string[];
  onSale?: boolean;
  featured?: boolean;
  available?: boolean;
  ids?: number[];
  excludeIds?: number[];
}

export type ProductSort =
  | "newest"
  | "oldest"
  | "price_asc"
  | "price_desc"
  | "name_asc"
  | "name_desc"
  | "discount"
  | "relevance"
  | "bestseller"
  | "featured";

export const SORTS: ProductSort[] = [
  "newest",
  "oldest",
  "price_asc",
  "price_desc",
  "name_asc",
  "name_desc",
  "discount",
  "relevance",
  "bestseller",
  "featured",
];

// Pezzi venduti negli ordini validi (per l'ordinamento "Più venduti")
const SOLD_QTY = Prisma.sql`(SELECT COALESCE(SUM(oi.quantity), 0) FROM "OrderItem" oi
  JOIN "Order" o ON o.id = oi."orderId"
  WHERE oi."productId" = p.id AND o.status::text IN ('PENDING','PROCESSING','SHIPPED','DELIVERED'))`;

// Prezzo effettivo calcolato in SQL: deve restare allineato a isDiscountActive()
const EFFECTIVE_PRICE = Prisma.sql`(CASE WHEN p."prezzoScontato" IS NOT NULL
  AND p."prezzoScontato" > 0 AND p."prezzoScontato" < p."prezzo"
  AND (p."scontoInizio" IS NULL OR p."scontoInizio" <= now())
  AND (p."scontoFine" IS NULL OR p."scontoFine" >= now())
  THEN p."prezzoScontato" ELSE p."prezzo" END)`;

// ---------------------------------------------------------------------------
// Albero categorie (piccolo: lo teniamo in memoria per qualche secondo)
// ---------------------------------------------------------------------------
type CategoryRow = { id: number; name: string; parentId: number | null };
let categoryCache: { at: number; rows: CategoryRow[] } | null = null;

export const loadCategories = async (maxAgeMs = 30_000): Promise<CategoryRow[]> => {
  if (categoryCache && Date.now() - categoryCache.at < maxAgeMs) {
    return categoryCache.rows;
  }
  const rows = await prisma.category.findMany({
    select: { id: true, name: true, parentId: true },
  });
  categoryCache = { at: Date.now(), rows };
  return rows;
};

export const invalidateCategoryCache = () => {
  categoryCache = null;
};

/** Restituisce gli id passati più tutti i discendenti (sottocategorie a qualsiasi livello). */
export const withDescendants = async (ids: number[]): Promise<number[]> => {
  if (ids.length === 0) return [];
  const rows = await loadCategories();
  const result = new Set(ids);
  let frontier = [...ids];
  while (frontier.length) {
    const next = rows.filter((c) => c.parentId !== null && frontier.includes(c.parentId));
    frontier = next.map((c) => c.id).filter((id) => !result.has(id));
    frontier.forEach((id) => result.add(id));
  }
  return [...result];
};

export const slugify = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const findCategoryBySlug = async (slug: string) => {
  const rows = await loadCategories();
  return rows.find((c) => slugify(c.name) === slug.toLowerCase()) || null;
};

// ---------------------------------------------------------------------------
// WHERE in SQL (serve per ordinare/filtrare sul prezzo effettivo)
// ---------------------------------------------------------------------------
const searchTerms = (search?: string) =>
  (search || "")
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .slice(0, 6);

const buildWhere = (f: ProductFilters): Prisma.Sql => {
  const parts: Prisma.Sql[] = [Prisma.sql`TRUE`];

  if (f.categoryIds && f.categoryIds.length) {
    parts.push(Prisma.sql`EXISTS (SELECT 1 FROM "_ProductCategories" pc
      WHERE pc."B" = p.id AND pc."A" IN (${Prisma.join(f.categoryIds)}))`);
  }
  for (const term of searchTerms(f.search)) {
    const like = `%${term.replace(/[\\%_]/g, (m) => `\\${m}`)}%`;
    parts.push(Prisma.sql`(p."titolo" ILIKE ${like} OR p."descrizione" ILIKE ${like}
      OR p."marca" ILIKE ${like} OR p."codice" ILIKE ${like})`);
  }
  if (f.minPrice !== undefined) parts.push(Prisma.sql`${EFFECTIVE_PRICE} >= ${f.minPrice}`);
  if (f.maxPrice !== undefined) parts.push(Prisma.sql`${EFFECTIVE_PRICE} <= ${f.maxPrice}`);
  if (f.brands && f.brands.length) {
    parts.push(Prisma.sql`p."marca" IN (${Prisma.join(f.brands)})`);
  }
  if (f.onSale) parts.push(Prisma.sql`${EFFECTIVE_PRICE} < p."prezzo"`);
  if (f.featured) parts.push(Prisma.sql`p."inEvidenza" = TRUE`);
  if (f.available !== undefined) parts.push(Prisma.sql`p."available" = ${f.available}`);
  if (f.ids && f.ids.length) parts.push(Prisma.sql`p.id IN (${Prisma.join(f.ids)})`);
  if (f.excludeIds && f.excludeIds.length) {
    parts.push(Prisma.sql`p.id NOT IN (${Prisma.join(f.excludeIds)})`);
  }
  return Prisma.join(parts, " AND ");
};

const buildOrder = (sort: ProductSort, inStockFirst: boolean, search?: string): Prisma.Sql => {
  const keys: Prisma.Sql[] = [];
  if (inStockFirst) keys.push(Prisma.sql`p."available" DESC`);
  switch (sort) {
    case "oldest":
      keys.push(Prisma.sql`p."createdAt" ASC`);
      break;
    case "price_asc":
      keys.push(Prisma.sql`${EFFECTIVE_PRICE} ASC`);
      break;
    case "price_desc":
      keys.push(Prisma.sql`${EFFECTIVE_PRICE} DESC`);
      break;
    case "name_asc":
      keys.push(Prisma.sql`lower(p."titolo") ASC`);
      break;
    case "name_desc":
      keys.push(Prisma.sql`lower(p."titolo") DESC`);
      break;
    case "discount":
      keys.push(Prisma.sql`(p."prezzo" - ${EFFECTIVE_PRICE}) / NULLIF(p."prezzo", 0) DESC`);
      break;
    case "bestseller":
      keys.push(Prisma.sql`${SOLD_QTY} DESC`, Prisma.sql`p."inEvidenza" DESC`, Prisma.sql`p."createdAt" DESC`);
      break;
    case "featured":
      keys.push(Prisma.sql`p."inEvidenza" DESC`, Prisma.sql`p."createdAt" DESC`);
      break;
    case "relevance": {
      const first = searchTerms(search)[0];
      if (first) {
        // I prodotti col termine nel titolo prima di quelli che lo hanno solo in descrizione
        keys.push(Prisma.sql`(p."titolo" ILIKE ${`%${first}%`}) DESC`);
      }
      keys.push(Prisma.sql`p."createdAt" DESC`);
      break;
    }
    case "newest":
    default:
      keys.push(Prisma.sql`p."createdAt" DESC`);
  }
  keys.push(Prisma.sql`p.id DESC`);
  return Prisma.join(keys, ", ");
};

export const queryProductIds = async (
  filters: ProductFilters,
  opts: { sort: ProductSort; page: number; limit: number; inStockFirst?: boolean }
): Promise<{ ids: number[]; total: number }> => {
  const where = buildWhere(filters);
  const offset = (opts.page - 1) * opts.limit;
  const [rows, count] = await Promise.all([
    prisma.$queryRaw<{ id: number }[]>`SELECT p.id FROM "Product" p WHERE ${where}
      ORDER BY ${buildOrder(opts.sort, !!opts.inStockFirst, filters.search)}
      LIMIT ${opts.limit} OFFSET ${offset}`,
    prisma.$queryRaw<{ total: bigint }[]>`SELECT COUNT(*)::bigint AS total FROM "Product" p WHERE ${where}`,
  ]);
  return { ids: rows.map((r) => r.id), total: Number(count[0]?.total ?? 0) };
};

/** Campi per card e liste: niente descrizione né valori varianti. */
export const listSelect = {
  id: true,
  titolo: true,
  immagine: true,
  immagini: true,
  prezzo: true,
  prezzoScontato: true,
  scontoInizio: true,
  scontoFine: true,
  available: true,
  stock: true,
  marca: true,
  codice: true,
  inEvidenza: true,
  createdAt: true,
  updatedAt: true,
  categoria: { select: { id: true, name: true, parentId: true } },
  _count: { select: { varianti: true } },
} satisfies Prisma.ProductSelect;

export type ListProduct = ReturnType<typeof toListItem>;

const toListItem = (
  p: Prisma.ProductGetPayload<{ select: typeof listSelect }>,
  now: Date
) => {
  const { _count, ...rest } = p;
  return { ...withPricing(rest, now), hasVariants: _count.varianti > 0 };
};

/** Carica i prodotti per id mantenendo l'ordine richiesto. */
export const hydrateList = async (ids: number[], withVariants = false) => {
  if (ids.length === 0) return [];
  const now = new Date();
  const rows = await prisma.product.findMany({
    where: { id: { in: ids } },
    select: withVariants
      ? { ...listSelect, varianti: { select: { id: true, nome: true, valori: true } } }
      : listSelect,
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is NonNullable<typeof r> => !!r)
    .map((r) => {
      const item = toListItem(r, now);
      return "varianti" in r ? { ...item, varianti: r.varianti } : item;
    });
};

/** Facette per i filtri della pagina catalogo (prezzi, marche, categorie). */
export const queryFacets = async (filters: ProductFilters) => {
  const where = buildWhere(filters);
  const [range, brands, cats, flags] = await Promise.all([
    prisma.$queryRaw<{ min: Prisma.Decimal | null; max: Prisma.Decimal | null }[]>`
      SELECT MIN(${EFFECTIVE_PRICE}) AS min, MAX(${EFFECTIVE_PRICE}) AS max FROM "Product" p WHERE ${where}`,
    prisma.$queryRaw<{ marca: string; count: bigint }[]>`
      SELECT p."marca" AS marca, COUNT(*)::bigint AS count FROM "Product" p
      WHERE ${where} AND p."marca" IS NOT NULL AND p."marca" <> ''
      GROUP BY p."marca" ORDER BY count DESC, marca ASC LIMIT 40`,
    prisma.$queryRaw<{ id: number; count: bigint }[]>`
      SELECT pc."A" AS id, COUNT(*)::bigint AS count FROM "Product" p
      JOIN "_ProductCategories" pc ON pc."B" = p.id
      WHERE ${where} GROUP BY pc."A"`,
    prisma.$queryRaw<{ onsale: bigint; available: bigint }[]>`
      SELECT COUNT(*) FILTER (WHERE ${EFFECTIVE_PRICE} < p."prezzo")::bigint AS onsale,
             COUNT(*) FILTER (WHERE p."available")::bigint AS available
      FROM "Product" p WHERE ${where}`,
  ]);
  return {
    minPrice: range[0]?.min !== null && range[0]?.min !== undefined ? Number(range[0].min) : 0,
    maxPrice: range[0]?.max !== null && range[0]?.max !== undefined ? Number(range[0].max) : 0,
    brands: brands.map((b) => ({ name: b.marca, count: Number(b.count) })),
    categories: cats.map((c) => ({ id: c.id, count: Number(c.count) })),
    onSaleCount: Number(flags[0]?.onsale ?? 0),
    availableCount: Number(flags[0]?.available ?? 0),
  };
};
