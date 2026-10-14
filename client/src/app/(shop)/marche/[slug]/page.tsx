import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { readCatalogParams, type SearchParams } from "@/components/catalog/params";
import { findBrandBySlug } from "@/lib/api/server";
import { plural } from "@/lib/format";
import { brandPath, SITE_URL } from "@/lib/urls";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<SearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const brand = await findBrandBySlug((await params).slug);
  if (!brand) return { title: "Marca non trovata" };
  const sp = readCatalogParams(await searchParams, "featured");
  return {
    title: `${brand.name}: prodotti online${sp.page > 1 ? ` - pagina ${sp.page}` : ""}`,
    description: `Acquista i prodotti ${brand.name} online su Cartoleria Bambù: ${plural(brand.count, "articolo", "articoli")}, spedizione in tutta Italia o ritiro gratuito a Torre Annunziata.`,
    alternates: { canonical: `${SITE_URL}${brandPath(brand.name)}${sp.page > 1 ? `?page=${sp.page}` : ""}` },
    robots: sp.filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function BrandPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const brand = await findBrandBySlug(slug);
  if (!brand) notFound();

  return (
    <CatalogPage
      title={brand.name}
      subtitle={`Tutti i prodotti ${brand.name} disponibili da Cartoleria Bambù.`}
      crumbs={[{ label: "Marche", href: "/marche" }, { label: brand.name }]}
      baseQuery={{}}
      fixedBrand={brand.name}
      params={readCatalogParams(sp, "featured")}
      basePath={brandPath(brand.name)}
      searchParams={sp}
      defaultSort="featured"
    />
  );
}
