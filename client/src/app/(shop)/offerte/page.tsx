import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { readCatalogParams, type SearchParams } from "@/components/catalog/params";
import { SITE_URL } from "@/lib/urls";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = readCatalogParams(await searchParams, "discount");
  return {
    title: "Offerte e prodotti scontati",
    description: "Tutti i prodotti in offerta da Cartoleria Bambù: cancelleria, zaini, astucci e giochi a prezzi scontati.",
    alternates: { canonical: `${SITE_URL}/offerte` },
    robots: sp.filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function OffersPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <CatalogPage
      title="Offerte"
      subtitle="Prezzi scontati su una selezione di prodotti: approfittane finché durano!"
      crumbs={[{ label: "Offerte" }]}
      baseQuery={{ onSale: true }}
      params={readCatalogParams(sp, "discount")}
      basePath="/offerte"
      searchParams={sp}
      showSaleToggle={false}
      defaultSort="discount"
      accent="bg-magenta"
    />
  );
}
