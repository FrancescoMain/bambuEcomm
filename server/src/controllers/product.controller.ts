import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { validationResult } from "express-validator";
import prisma from "../lib/prisma";
import {
  ProductFilters,
  ProductSort,
  SORTS,
  hydrateList,
  queryFacets,
  queryProductIds,
  withDescendants,
  findCategoryBySlug,
} from "../lib/catalog";
import {
  priceFromPercent,
  roundMoney,
  toNumber,
  validateDiscount,
  withPricing,
} from "../lib/pricing";
import { clampInt, parseId, parseIdList, revalidateStorefront } from "../lib/http";
import { notifyBackInStock } from "../services/stockAlert.service";

/** Primo valore come stringa (?q=a&q=b arriva come array) */
const firstString = (value: unknown): string | undefined => {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === "string" && v.trim() ? v : undefined;
};

const parseBool = (value: unknown): boolean | undefined => {
  if (value === undefined || value === "" || value === "all") return undefined;
  return value === "true" || value === "1" || value === true;
};

const parsePrice = (value: unknown): number | undefined => {
  if (value === undefined || value === "") return undefined;
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
};

/** Traduce i parametri legacy sortBy/sortOrder nel nuovo `sort`. */
const resolveSort = (query: Request["query"]): ProductSort => {
  const sort = String(query.sort || "");
  if ((SORTS as string[]).includes(sort)) return sort as ProductSort;
  const sortBy = String(query.sortBy || "createdAt");
  const asc = query.sortOrder === "asc";
  if (sortBy === "prezzo") return asc ? "price_asc" : "price_desc";
  if (sortBy === "titolo") return asc ? "name_asc" : "name_desc";
  return asc ? "oldest" : "newest";
};

const buildFilters = async (query: Request["query"]): Promise<ProductFilters> => {
  let categoryIds = parseIdList(query.categoryId);
  if (firstString(query.category)) {
    const cat = await findCategoryBySlug(firstString(query.category)!);
    categoryIds = cat ? [...categoryIds, cat.id] : [-1];
  }
  const brands = query.brand
    ? (Array.isArray(query.brand) ? query.brand : String(query.brand).split(","))
        .map((b) => String(b).trim())
        .filter(Boolean)
    : undefined;

  return {
    categoryIds: categoryIds.length ? await withDescendants(categoryIds) : undefined,
    search: firstString(query.q) || firstString(query.search),
    minPrice: parsePrice(query.minPrice),
    maxPrice: parsePrice(query.maxPrice),
    brands,
    onSale: parseBool(query.onSale),
    featured: parseBool(query.featured),
    available: parseBool(query.available),
    ids: query.ids !== undefined ? parseIdList(query.ids) : undefined,
    excludeIds: query.exclude ? parseIdList(query.exclude) : undefined,
  };
};

// GET /api/products — lista paginata con filtri, ordinamento e prezzo effettivo
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = clampInt(req.query.page, 1, 1, 10_000);
    const limit = clampInt(req.query.limit, 12, 1, 100);
    const filters = await buildFilters(req.query);
    if (filters.ids && filters.ids.length === 0) {
      res.json({ data: [], totalPages: 0, currentPage: page, totalProducts: 0 });
      return;
    }
    const { ids, total } = await queryProductIds(filters, {
      sort: resolveSort(req.query),
      page,
      limit,
      inStockFirst: parseBool(req.query.inStockFirst) ?? false,
    });
    const data = await hydrateList(ids, req.query.include === "variants");
    res.json({
      data,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalProducts: total,
    });
  } catch (error) {
    console.error("Errore nel recupero dei prodotti:", error);
    res.status(500).json({ message: "Errore nel recupero dei prodotti" });
  }
};

// GET /api/products/facets — valori disponibili per i filtri della lista
export const getProductFacets = async (req: Request, res: Response): Promise<void> => {
  try {
    const filters = await buildFilters(req.query);
    // Le facette di prezzo/marca si calcolano senza i filtri di prezzo/marca stessi
    const { minPrice, maxPrice, brands, ...base } = filters;
    res.json(await queryFacets(base));
  } catch (error) {
    console.error("Errore nel calcolo dei filtri:", error);
    res.status(500).json({ message: "Errore nel calcolo dei filtri" });
  }
};

// GET /api/products/suggest?q= — autocompletamento della barra di ricerca
export const suggestProducts = async (req: Request, res: Response): Promise<void> => {
  const q = (firstString(req.query.q) || "").trim();
  if (q.length < 2) {
    res.json({ products: [], categories: [] });
    return;
  }
  try {
    const [{ ids }, categories] = await Promise.all([
      queryProductIds({ search: q }, { sort: "relevance", page: 1, limit: 6, inStockFirst: true }),
      prisma.category.findMany({
        where: { name: { contains: q, mode: "insensitive" } },
        select: { id: true, name: true, parentId: true },
        take: 4,
      }),
    ]);
    const products = (await hydrateList(ids)).map((p) => ({
      id: p.id,
      titolo: p.titolo,
      immagine: p.immagine,
      prezzo: p.prezzo,
      prezzoFinale: p.prezzoFinale,
      inOfferta: p.inOfferta,
      available: p.available,
    }));
    res.json({ products, categories });
  } catch (error) {
    console.error("Errore autocompletamento:", error);
    res.status(500).json({ message: "Errore nella ricerca" });
  }
};

// GET /api/products/brands — elenco marche (per menu e filtri)
export const getBrands = async (req: Request, res: Response): Promise<void> => {
  try {
    const rows = await prisma.product.groupBy({
      by: ["marca"],
      where: { marca: { not: null } },
      _count: { _all: true },
      orderBy: { marca: "asc" },
    });
    res.json(
      rows
        .filter((r) => r.marca && r.marca.trim())
        .map((r) => ({ name: r.marca, count: r._count._all }))
    );
  } catch (error) {
    console.error("Errore marche:", error);
    res.status(500).json({ message: "Errore nel recupero delle marche" });
  }
};

const detailInclude = {
  categoria: { select: { id: true, name: true, parentId: true, description: true } },
  varianti: { include: { valori: { orderBy: { id: "asc" } } }, orderBy: { id: "asc" } },
} satisfies Prisma.ProductInclude;

// GET /api/products/:id — accetta anche "72-nome-prodotto"
export const getProductById = async (req: Request, res: Response): Promise<void> => {
  const productId = parseId(req.params.id);
  if (isNaN(productId)) {
    res.status(400).json({ message: "ID prodotto non valido" });
    return;
  }
  try {
    const [product, rating] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId }, include: detailInclude }),
      prisma.review.aggregate({
        where: { productId, approvata: true },
        _avg: { voto: true },
        _count: { _all: true },
      }),
    ]);
    if (!product) {
      res.status(404).json({ message: "Prodotto non trovato" });
      return;
    }
    res.json({
      ...withPricing(product),
      rating: {
        media: rating._avg.voto ? Math.round(rating._avg.voto * 10) / 10 : null,
        totale: rating._count._all,
      },
    });
  } catch (error) {
    console.error("Errore nel recupero del prodotto:", error);
    res.status(500).json({ message: "Errore nel recupero del prodotto" });
  }
};

// GET /api/products/:id/related — stessa categoria, disponibili prima
export const getRelatedProducts = async (req: Request, res: Response): Promise<void> => {
  const productId = parseId(req.params.id);
  if (isNaN(productId)) {
    res.status(400).json({ message: "ID prodotto non valido" });
    return;
  }
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoria: { select: { id: true } } },
    });
    if (!product) {
      res.status(404).json({ message: "Prodotto non trovato" });
      return;
    }
    const limit = clampInt(req.query.limit, 8, 1, 24);
    const categoryIds = product.categoria.map((c) => c.id);
    const { ids } = await queryProductIds(
      { categoryIds: categoryIds.length ? categoryIds : undefined, excludeIds: [productId] },
      { sort: "newest", page: 1, limit, inStockFirst: true }
    );
    res.json(await hydrateList(ids));
  } catch (error) {
    console.error("Errore prodotti correlati:", error);
    res.status(500).json({ message: "Errore nel recupero dei prodotti correlati" });
  }
};

// ---------------------------------------------------------------------------
// Scrittura (solo admin)
// ---------------------------------------------------------------------------

type VariantInput = {
  id?: number;
  nome?: string;
  valori?: { id?: number; nome?: string; immagine?: string }[];
};

/** Legge dal body i campi prodotto modificabili. `partial` = aggiornamento. */
const readProductFields = (body: any, partial: boolean) => {
  const data: Prisma.ProductUpdateInput = {};
  const errors: string[] = [];
  const has = (k: string) => body[k] !== undefined;

  if (has("titolo")) data.titolo = String(body.titolo).trim();
  if (has("descrizione")) data.descrizione = body.descrizione ?? null;
  if (has("immagine")) data.immagine = body.immagine || null;
  if (has("immagini")) {
    data.immagini = Array.isArray(body.immagini)
      ? body.immagini.filter((u: unknown) => typeof u === "string" && u.trim())
      : [];
  }
  if (has("prezzo")) {
    const n = parseFloat(String(body.prezzo).replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) errors.push("Il prezzo deve essere un numero positivo.");
    else data.prezzo = roundMoney(n);
  } else if (!partial) {
    errors.push("Il prezzo è obbligatorio.");
  }
  if (has("stock")) data.stock = Math.max(0, parseInt(body.stock, 10) || 0);
  if (has("available")) data.available = !!body.available;
  if (has("inEvidenza")) data.inEvidenza = !!body.inEvidenza;
  if (has("marca")) data.marca = body.marca ? String(body.marca).trim() : null;
  if (has("codice")) data.codice = body.codice ? String(body.codice).trim() : null;
  if (has("personalizzabile")) data.personalizzabile = !!body.personalizzabile;
  if (has("etichettaPersonalizzazione")) {
    data.etichettaPersonalizzazione = body.etichettaPersonalizzazione
      ? String(body.etichettaPersonalizzazione).trim().slice(0, 80)
      : null;
  }
  if (has("maxPerOrdine")) {
    const n = parseInt(body.maxPerOrdine, 10);
    data.maxPerOrdine = Number.isFinite(n) && n > 0 ? n : null;
  }
  if (has("prezzoScontato")) {
    const v = body.prezzoScontato;
    if (v === null || v === "") {
      data.prezzoScontato = null;
    } else {
      const n = parseFloat(String(v).replace(",", "."));
      if (!Number.isFinite(n)) errors.push("Prezzo scontato non valido.");
      else data.prezzoScontato = roundMoney(n);
    }
  }
  if (has("scontoInizio")) data.scontoInizio = body.scontoInizio ? new Date(body.scontoInizio) : null;
  if (has("scontoFine")) data.scontoFine = body.scontoFine ? new Date(body.scontoFine) : null;
  return { data, errors };
};

/** categoriaId (singolo) o categoriaIds (array) => set di categorie */
const readCategories = (body: any): number[] | undefined => {
  if (Array.isArray(body.categoriaIds)) return parseIdList(body.categoriaIds);
  if (body.categoriaId !== undefined && body.categoriaId !== null && body.categoriaId !== "") {
    return parseIdList([body.categoriaId]);
  }
  return undefined;
};

const syncVariants = async (
  tx: Prisma.TransactionClient,
  productId: number,
  varianti: VariantInput[]
) => {
  const existing = await tx.productVariantType.findMany({
    where: { productId },
    select: { id: true },
  });
  const existingIds = existing.map((t) => t.id);
  const keepTypeIds = varianti
    .filter((t) => t.id && existingIds.includes(Number(t.id)))
    .map((t) => Number(t.id));
  const removeTypeIds = existingIds.filter((id) => !keepTypeIds.includes(id));
  if (removeTypeIds.length) {
    await tx.productVariantValue.deleteMany({ where: { typeId: { in: removeTypeIds } } });
    await tx.productVariantType.deleteMany({ where: { id: { in: removeTypeIds } } });
  }

  for (const type of varianti) {
    if (!type.nome || !String(type.nome).trim()) continue;
    const values = (type.valori || []).filter((v) => v.nome && String(v.nome).trim());
    if (type.id && keepTypeIds.includes(Number(type.id))) {
      const typeId = Number(type.id);
      await tx.productVariantType.update({ where: { id: typeId }, data: { nome: type.nome } });
      const keepValueIds = values.filter((v) => v.id).map((v) => Number(v.id));
      await tx.productVariantValue.deleteMany({
        where: { typeId, ...(keepValueIds.length ? { id: { notIn: keepValueIds } } : {}) },
      });
      for (const v of values) {
        if (v.id) {
          await tx.productVariantValue.updateMany({
            where: { id: Number(v.id), typeId },
            data: { nome: v.nome!, immagine: v.immagine || null },
          });
        } else {
          await tx.productVariantValue.create({
            data: { nome: v.nome!, immagine: v.immagine || null, typeId },
          });
        }
      }
    } else {
      await tx.productVariantType.create({
        data: {
          nome: type.nome,
          productId,
          valori: {
            create: values.map((v) => ({ nome: v.nome!, immagine: v.immagine || null })),
          },
        },
      });
    }
  }
};

const prismaErrorResponse = (error: unknown, res: Response, fallback: string) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Prodotto o categoria non trovati." });
      return;
    }
    if (error.code === "P2003") {
      res.status(400).json({ message: "Categoria non valida o non esistente." });
      return;
    }
  }
  console.error(fallback, error);
  res.status(500).json({ message: fallback });
};

// POST /api/products
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const { data, errors: fieldErrors } = readProductFields(req.body, false);
  const categoryIds = readCategories(req.body) || [];
  if (!data.titolo) fieldErrors.push("Il titolo è obbligatorio.");
  if (categoryIds.length === 0) fieldErrors.push("Seleziona almeno una categoria.");
  if (data.prezzo !== undefined) {
    const discountError = validateDiscount(
      toNumber(data.prezzo as number),
      data.prezzoScontato === undefined || data.prezzoScontato === null
        ? null
        : toNumber(data.prezzoScontato as number),
      (data.scontoInizio as Date | null | undefined) ?? null,
      (data.scontoFine as Date | null | undefined) ?? null
    );
    if (discountError) fieldErrors.push(discountError);
  }
  if (fieldErrors.length) {
    res.status(400).json({ message: fieldErrors.join(" "), errors: fieldErrors });
    return;
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          ...(data as Prisma.ProductCreateInput),
          categoria: { connect: categoryIds.map((id) => ({ id })) },
        },
      });
      if (Array.isArray(req.body.varianti) && req.body.varianti.length) {
        await syncVariants(tx, created.id, req.body.varianti);
      }
      return tx.product.findUniqueOrThrow({ where: { id: created.id }, include: detailInclude });
    });
    revalidateStorefront(["products", `product:${product.id}`]);
    res.status(201).json({ message: "Prodotto creato con successo", product: withPricing(product) });
  } catch (error) {
    prismaErrorResponse(error, res, "Errore nella creazione del prodotto");
  }
};

// PUT /api/products/:id
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }
  const productId = parseId(req.params.id);
  if (isNaN(productId)) {
    res.status(400).json({ message: "ID prodotto non valido" });
    return;
  }
  const { data, errors: fieldErrors } = readProductFields(req.body, true);
  const categoryIds = readCategories(req.body);

  try {
    const current = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        prezzo: true,
        prezzoScontato: true,
        scontoInizio: true,
        scontoFine: true,
        available: true,
      },
    });
    if (!current) {
      res.status(404).json({ message: "Prodotto non trovato" });
      return;
    }
    const fullPrice =
      data.prezzo !== undefined ? toNumber(data.prezzo as number) : toNumber(current.prezzo);
    const sale =
      data.prezzoScontato !== undefined
        ? (data.prezzoScontato as number | null)
        : current.prezzoScontato === null
          ? null
          : toNumber(current.prezzoScontato);
    const discountError = validateDiscount(
      fullPrice,
      sale,
      data.scontoInizio !== undefined ? (data.scontoInizio as Date | null) : current.scontoInizio,
      data.scontoFine !== undefined ? (data.scontoFine as Date | null) : current.scontoFine
    );
    if (discountError) fieldErrors.push(discountError);
    if (fieldErrors.length) {
      res.status(400).json({ message: fieldErrors.join(" "), errors: fieldErrors });
      return;
    }

    const product = await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          ...data,
          ...(categoryIds ? { categoria: { set: categoryIds.map((id) => ({ id })) } } : {}),
        },
      });
      if (Array.isArray(req.body.varianti)) {
        await syncVariants(tx, productId, req.body.varianti);
      }
      return tx.product.findUniqueOrThrow({ where: { id: productId }, include: detailInclude });
    });

    if (product.available) notifyBackInStock(productId);
    revalidateStorefront(["products", `product:${productId}`]);
    res.json({ message: "Prodotto aggiornato con successo", product: withPricing(product) });
  } catch (error) {
    prismaErrorResponse(error, res, "Errore nell'aggiornamento del prodotto");
  }
};

// PATCH /api/products/:id/availability — inverte la disponibilità (o imposta `available`)
export const toggleProductAvailability = async (req: Request, res: Response): Promise<void> => {
  const productId = parseId(req.params.id);
  if (isNaN(productId)) {
    res.status(400).json({ message: "ID prodotto non valido" });
    return;
  }
  try {
    const current = await prisma.product.findUnique({
      where: { id: productId },
      select: { available: true },
    });
    if (!current) {
      res.status(404).json({ message: "Prodotto non trovato" });
      return;
    }
    const available =
      typeof req.body?.available === "boolean" ? req.body.available : !current.available;
    const product = await prisma.product.update({
      where: { id: productId },
      data: { available },
      include: detailInclude,
    });
    if (available) notifyBackInStock(productId);
    revalidateStorefront(["products", `product:${productId}`]);
    res.json({
      message: `Prodotto ${available ? "disponibile" : "non disponibile"}`,
      product: withPricing(product),
    });
  } catch (error) {
    prismaErrorResponse(error, res, "Errore nel cambio di disponibilità del prodotto");
  }
};

/**
 * Calcola il prezzo scontato da `percent` oppure da `price`.
 * Restituisce null per rimuovere lo sconto, una stringa in caso di errore.
 */
const resolveSalePrice = (fullPrice: number, body: any): number | null | string => {
  if (body.remove) return null;
  if (body.percent !== undefined && body.percent !== null && body.percent !== "") {
    const percent = parseFloat(String(body.percent).replace(",", "."));
    if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) {
      return "La percentuale deve essere compresa tra 1 e 99.";
    }
    return priceFromPercent(fullPrice, percent);
  }
  if (body.price !== undefined && body.price !== null && body.price !== "") {
    const price = parseFloat(String(body.price).replace(",", "."));
    if (!Number.isFinite(price)) return "Prezzo scontato non valido.";
    return roundMoney(price);
  }
  return "Indica la percentuale di sconto o il prezzo scontato.";
};

const readWindow = (body: any) => ({
  start: body.start ? new Date(body.start) : null,
  end: body.end ? new Date(body.end) : null,
});

// PATCH /api/products/:id/discount — sconto rapido su un prodotto
// body: { percent } | { price } | { remove: true }, opzionali { start, end }
export const setProductDiscount = async (req: Request, res: Response): Promise<void> => {
  const productId = parseId(req.params.id);
  if (isNaN(productId)) {
    res.status(400).json({ message: "ID prodotto non valido" });
    return;
  }
  try {
    const current = await prisma.product.findUnique({
      where: { id: productId },
      select: { prezzo: true },
    });
    if (!current) {
      res.status(404).json({ message: "Prodotto non trovato" });
      return;
    }
    const full = toNumber(current.prezzo);
    const body = req.body || {};
    const sale = resolveSalePrice(full, body);
    if (typeof sale === "string") {
      res.status(400).json({ message: sale });
      return;
    }
    const { start, end } = readWindow(body);
    const error = validateDiscount(full, sale, start, end);
    if (error) {
      res.status(400).json({ message: error });
      return;
    }
    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        prezzoScontato: sale,
        scontoInizio: sale === null ? null : start,
        scontoFine: sale === null ? null : end,
      },
      include: detailInclude,
    });
    revalidateStorefront(["products", `product:${productId}`]);
    res.json({
      message: sale === null ? "Sconto rimosso" : "Sconto applicato",
      product: withPricing(product),
    });
  } catch (error) {
    prismaErrorResponse(error, res, "Errore nell'applicazione dello sconto");
  }
};

// POST /api/products/bulk-discount — sconto in blocco
// body: { productIds?: number[], categoryId?: number, percent | remove, start?, end? }
export const bulkDiscount = async (req: Request, res: Response): Promise<void> => {
  const body = req.body || {};
  const productIds = parseIdList(body.productIds);
  const categoryId = parseId(body.categoryId);
  if (!productIds.length && isNaN(categoryId)) {
    res.status(400).json({ message: "Seleziona dei prodotti o una categoria." });
    return;
  }
  const percent = parseFloat(String(body.percent ?? "").replace(",", "."));
  if (!body.remove && (!Number.isFinite(percent) || percent <= 0 || percent >= 100)) {
    res.status(400).json({ message: "La percentuale deve essere compresa tra 1 e 99." });
    return;
  }
  const { start, end } = readWindow(body);
  if (start && end && end <= start) {
    res.status(400).json({ message: "La data di fine deve essere successiva alla data di inizio." });
    return;
  }
  try {
    const where: Prisma.ProductWhereInput = productIds.length
      ? { id: { in: productIds } }
      : { categoria: { some: { id: { in: await withDescendants([categoryId]) } } } };
    const targets = await prisma.product.findMany({ where, select: { id: true, prezzo: true } });

    await prisma.$transaction(
      targets.map((p) =>
        prisma.product.update({
          where: { id: p.id },
          data: body.remove
            ? { prezzoScontato: null, scontoInizio: null, scontoFine: null }
            : {
                prezzoScontato: priceFromPercent(toNumber(p.prezzo), percent),
                scontoInizio: start,
                scontoFine: end,
              },
        })
      )
    );
    revalidateStorefront(["products"]);
    res.json({
      message: body.remove
        ? `Sconto rimosso da ${targets.length} prodotti`
        : `Sconto del ${percent}% applicato a ${targets.length} prodotti`,
      updated: targets.length,
    });
  } catch (error) {
    prismaErrorResponse(error, res, "Errore nell'applicazione dello sconto");
  }
};

// PATCH /api/products/bulk — azioni rapide su più prodotti (disponibilità, evidenza)
export const bulkUpdate = async (req: Request, res: Response): Promise<void> => {
  const productIds = parseIdList(req.body?.productIds);
  if (!productIds.length) {
    res.status(400).json({ message: "Nessun prodotto selezionato." });
    return;
  }
  const data: Prisma.ProductUpdateManyMutationInput = {};
  if (typeof req.body.available === "boolean") data.available = req.body.available;
  if (typeof req.body.inEvidenza === "boolean") data.inEvidenza = req.body.inEvidenza;
  if (Object.keys(data).length === 0) {
    res.status(400).json({ message: "Nessuna modifica indicata." });
    return;
  }
  try {
    const result = await prisma.product.updateMany({ where: { id: { in: productIds } }, data });
    if (data.available === true) productIds.forEach((id) => notifyBackInStock(id));
    revalidateStorefront(["products"]);
    res.json({ message: `${result.count} prodotti aggiornati`, updated: result.count });
  } catch (error) {
    prismaErrorResponse(error, res, "Errore nell'aggiornamento dei prodotti");
  }
};

// DELETE /api/products/:id
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  const productId = parseId(req.params.id);
  if (isNaN(productId)) {
    res.status(400).json({ message: "ID prodotto non valido" });
    return;
  }
  try {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!existing) {
      res.status(404).json({ message: "Prodotto non trovato" });
      return;
    }
    // Gli ordini restano per lo storico fiscale: un prodotto venduto non si elimina
    const orderItemsCount = await prisma.orderItem.count({ where: { productId } });
    if (orderItemsCount > 0) {
      res.status(409).json({
        message:
          "Impossibile eliminare il prodotto: è presente in ordini esistenti. Puoi renderlo non disponibile per toglierlo dalla vendita.",
        orderItemsCount,
      });
      return;
    }
    await prisma.$transaction([
      prisma.cartItem.deleteMany({ where: { productId } }),
      prisma.productVariantValue.deleteMany({ where: { type: { productId } } }),
      prisma.productVariantType.deleteMany({ where: { productId } }),
      prisma.product.delete({ where: { id: productId } }),
    ]);
    revalidateStorefront(["products", `product:${productId}`]);
    res.json({ message: "Prodotto eliminato con successo" });
  } catch (error) {
    prismaErrorResponse(error, res, "Errore nell'eliminazione del prodotto");
  }
};
