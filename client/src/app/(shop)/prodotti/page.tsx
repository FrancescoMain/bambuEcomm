import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { readCatalogParams, type SearchParams } from "@/components/catalog/params";
import { getCategoryTree } from "@/lib/api/server";
import { SITE_URL } from "@/lib/urls";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = readCatalogParams(await searchParams, "featured");
  if (sp.q) {
    return { title: `Risultati per “${sp.q}”`, robots: { index: false, follow: true } };
  }
  return {
    title: "Tutti i prodotti",
    description: "Il catalogo completo di Cartoleria Bambù: scuola, ufficio, giochi e idee regalo.",
    alternates: { canonical: `${SITE_URL}/prodotti` },
    robots: sp.filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = readCatalogParams(sp, "featured");
  const tree = await getCategoryTree();
  const isSearch = !!params.q;
  return (
    <CatalogPage
      title={isSearch ? `Risultati per “${params.q}”` : "Tutti i prodotti"}
      subtitle={isSearch ? undefined : "Scuola, ufficio, giochi e idee regalo: tutto il catalogo Bambù."}
      crumbs={[{ label: isSearch ? "Ricerca" : "Prodotti" }]}
      baseQuery={{ q: params.q || undefined }}
      params={isSearch && !sp.sort ? { ...params, sort: "relevance" } : params}
      basePath="/prodotti"
      searchParams={sp}
      subcategories={isSearch ? [] : tree}
      defaultSort={isSearch ? "relevance" : "featured"}
      allowRelevance={isSearch}
    />
  );
}
