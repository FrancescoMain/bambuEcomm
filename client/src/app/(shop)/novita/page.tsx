import type { Metadata } from "next";
import { CatalogPage } from "@/components/catalog/CatalogPage";
import { readCatalogParams, type SearchParams } from "@/components/catalog/params";
import { SITE_URL } from "@/lib/urls";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = readCatalogParams(await searchParams, "newest");
  return {
    title: "Novità",
    description: "Gli ultimi arrivi in Cartoleria Bambù: nuovi zaini, astucci, quaderni e idee regalo.",
    alternates: { canonical: `${SITE_URL}/novita` },
    robots: sp.filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function NewArrivalsPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <CatalogPage
      title="Novità"
      subtitle="Gli ultimi arrivi in negozio."
      crumbs={[{ label: "Novità" }]}
      baseQuery={{}}
      params={readCatalogParams(sp, "newest")}
      basePath="/novita"
      searchParams={sp}
      defaultSort="newest"
      accent="bg-sky"
    />
  );
}
