import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { readCatalogParams, type SearchParams } from "@/components/catalog/params";
import { getCategoryTree } from "@/lib/api/server";
import type { CategoryNode } from "@/lib/types";
import { categoryPath, SITE_URL } from "@/lib/urls";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

/** Cerca la categoria nell'albero e restituisce anche il percorso (per le briciole) */
const findWithPath = (nodes: CategoryNode[], slug: string, path: CategoryNode[] = []): CategoryNode[] | null => {
  for (const n of nodes) {
    if (n.slug === slug) return [...path, n];
    const found = findWithPath(n.children, slug, [...path, n]);
    if (found) return found;
  }
  return null;
};

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const path = findWithPath(await getCategoryTree(), slug);
  if (!path) return { title: "Categoria non trovata" };
  const cat = path[path.length - 1];
  const sp = readCatalogParams(await searchParams, "featured");
  const title = `${cat.name} online${sp.page > 1 ? ` - pagina ${sp.page}` : ""}`;
  return {
    title,
    description:
      cat.description?.slice(0, 155) ||
      `Acquista ${cat.name.toLowerCase()} online su Cartoleria Bambù: ${cat.productCount} articoli, spedizione in tutta Italia o ritiro gratuito a Torre Annunziata.`,
    alternates: { canonical: `${SITE_URL}${categoryPath(cat)}${sp.page > 1 ? `?page=${sp.page}` : ""}` },
    robots: sp.filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const path = findWithPath(await getCategoryTree(), slug);
  if (!path) notFound();
  const cat = path[path.length - 1];

  return (
    <CatalogPage
      title={cat.name}
      subtitle={cat.description && cat.description.length < 180 ? cat.description : undefined}
      crumbs={path.map((c, i) => ({ label: c.name, href: i < path.length - 1 ? categoryPath(c) : undefined }))}
      baseQuery={{ categoryId: cat.id }}
      params={readCatalogParams(sp, "featured")}
      basePath={categoryPath(cat)}
      searchParams={sp}
      subcategories={cat.children}
      description={cat.description && cat.description.length >= 180 ? cat.description : null}
      defaultSort="featured"
    />
  );
}
