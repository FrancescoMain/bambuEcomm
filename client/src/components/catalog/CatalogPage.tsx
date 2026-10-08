import Link from "next/link";
import { SearchX } from "lucide-react";
import { getFacets, getProducts, type ProductQuery } from "@/lib/api/server";
import type { CategoryNode } from "@/lib/types";
import { absoluteUrl, categoryPath, productPath } from "@/lib/urls";
import { Breadcrumbs, type Crumb } from "@/components/shop/Breadcrumbs";
import { ProductGrid } from "@/components/shop/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/Button";
import { CatalogSidebar, CatalogToolbar } from "./CatalogFilters";
import { Pagination } from "./Pagination";
import { PAGE_SIZE, type CatalogParams } from "./params";

/**
 * Pagina elenco prodotti riutilizzata da categoria, ricerca, offerte e novità.
 * I filtri vivono nell'URL: ogni combinazione è una pagina vera, condivisibile
 * e renderizzata dal server (veloce e leggibile da Google).
 */
export async function CatalogPage({
  title,
  subtitle,
  crumbs,
  baseQuery,
  params,
  basePath,
  searchParams,
  subcategories = [],
  description,
  showSaleToggle = true,
  defaultSort,
  allowRelevance,
  accent = "bg-brand-400",
}: {
  title: string;
  subtitle?: React.ReactNode;
  crumbs: Crumb[];
  baseQuery: ProductQuery;
  params: CatalogParams;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  subcategories?: CategoryNode[];
  description?: string | null;
  showSaleToggle?: boolean;
  defaultSort: string;
  allowRelevance?: boolean;
  accent?: string;
}) {
  const categoryId = baseQuery.categoryId;
  const query: ProductQuery = {
    ...baseQuery,
    categoryId,
    sort: params.sort,
    page: params.page,
    limit: PAGE_SIZE,
    brand: params.brands.length ? params.brands : undefined,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    available: params.onlyAvailable ? true : baseQuery.available,
    onSale: params.onlySale || baseQuery.onSale ? true : undefined,
    inStockFirst: true,
  };
  const facetQuery: ProductQuery = {
    ...baseQuery,
    categoryId,
    available: query.available,
    onSale: query.onSale,
  };

  const [result, facets] = await Promise.all([getProducts(query), getFacets(facetQuery)]);
  const counts = new Map(facets.categories.map((c) => [c.id, c.count]));
  const subs = subcategories
    .map((s) => ({ id: s.id, name: s.name, slug: s.slug, count: counts.get(s.id) ?? s.productCount }))
    .filter((s) => s.count > 0);

  const hrefFor = (page: number) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (k === "page" || v === undefined) continue;
      sp.set(k, Array.isArray(v) ? v[0] : v);
    }
    if (page > 1) sp.set("page", String(page));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: title,
    itemListElement: result.data.map((p, i) => ({
      "@type": "ListItem",
      position: (params.page - 1) * PAGE_SIZE + i + 1,
      url: absoluteUrl(productPath(p)),
      name: p.titolo,
    })),
  };

  return (
    <div className="container pb-10 pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <Breadcrumbs items={crumbs} className="mb-5" />
      <header className="mb-6">
        <div className="mb-2 flex items-center gap-2">
          <span className={`h-2 w-8 rounded-full ${accent}`} />
        </div>
        <h1 className="text-balance text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-ink-muted">{subtitle}</p>}
        {subcategories.length > 0 && (
          <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0 lg:hidden">
            {subcategories.map((s) => (
              <Link
                key={s.id}
                href={categoryPath(s)}
                className="shrink-0 rounded-full border border-paper-line bg-white px-4 py-2 text-sm font-semibold text-ink-soft transition hover:border-brand-500 hover:text-brand-700"
              >
                {s.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <CatalogSidebar facets={facets} subcategories={subs} showSaleToggle={showSaleToggle} />
        <div>
          <CatalogToolbar
            total={result.totalProducts}
            facets={facets}
            subcategories={subs}
            showSaleToggle={showSaleToggle}
            defaultSort={defaultSort}
            allowRelevance={allowRelevance}
          />
          {result.data.length ? (
            <ProductGrid products={result.data} priorityCount={4} />
          ) : (
            <EmptyState
              icon={<SearchX className="h-7 w-7" />}
              title="Nessun prodotto trovato"
              text={params.filtered ? "Prova a rimuovere qualche filtro." : "Torna presto: arrivano sempre novità!"}
              action={
                <Link href={basePath === "/prodotti" ? "/novita" : basePath} className={buttonClass("primary")}>
                  {params.filtered ? "Azzera filtri" : "Vedi le novità"}
                </Link>
              }
              className="card"
            />
          )}
          <Pagination page={params.page} totalPages={result.totalPages} hrefFor={hrefFor} />
        </div>
      </div>

      {description && params.page === 1 && (
        <section className="mt-14 max-w-3xl border-t border-paper-line pt-8 text-[15px] leading-relaxed text-ink-muted">
          {description.split(/\n{2,}/).map((p, i) => (
            <p key={i} className="mb-3">
              {p}
            </p>
          ))}
        </section>
      )}
    </div>
  );
}
