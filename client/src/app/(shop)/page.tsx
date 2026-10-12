import type { Metadata } from "next";
import { HeroSlider } from "@/components/home/HeroSlider";
import { ServiceBar } from "@/components/home/ServiceBar";
import { ShowcaseTiles } from "@/components/home/ShowcaseTiles";
import { StoreSection } from "@/components/home/StoreSection";
import { ProductCarousel } from "@/components/shop/ProductCarousel";
import { PostCard } from "@/components/shop/PostCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HalloweenHero } from "@/components/shop/halloween/HalloweenHero";
import { getCategories, getPosts, getProducts, getSettings } from "@/lib/api/server";
import { activeSeasonalTheme } from "@/lib/seasonal";
import { toCardProduct } from "@/lib/types";
import { SITE_URL, categoryPath } from "@/lib/urls";

// La home si rigenera da sola ogni minuto (o subito dopo una modifica admin)
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Cartoleria Bambù | Cancelleria, zaini e articoli per la scuola a Torre Annunziata" },
  alternates: { canonical: SITE_URL },
};

export default async function HomePage() {
  const settings = await getSettings();
  const stagione = settings.temaStagionale;
  const halloween = activeSeasonalTheme(stagione) === "halloween";
  const [offerte, selezione, bestseller, novita, posts, categories, halloweenProducts] = await Promise.all([
    getProducts({ onSale: true, available: true, sort: "discount", limit: 12 }),
    getProducts({ featured: true, available: true, limit: 12 }),
    getProducts({ sort: "bestseller", available: true, limit: 12 }),
    getProducts({ sort: "newest", available: true, limit: 12 }),
    getPosts(3),
    halloween && stagione.categoriaId ? getCategories() : Promise.resolve([]),
    halloween && stagione.categoriaId
      ? getProducts({ categoryId: stagione.categoriaId, available: true, sort: "featured", limit: 12 })
      : null,
  ]);
  const halloweenCategory = categories.find((c) => c.id === stagione.categoriaId);
  const halloweenHref = halloweenCategory ? categoryPath(halloweenCategory) : null;

  return (
    <div className="container space-y-14 pt-5 sm:space-y-20 sm:pt-8">
      {halloween && (
        <div className="space-y-8">
          <HalloweenHero titolo={stagione.titolo} sottotitolo={stagione.sottotitolo} href={halloweenHref} />
          {halloweenProducts && halloweenProducts.data.length > 0 && (
            <section>
              <SectionHeading
                title="Idee per Halloween"
                subtitle="Dolcetto o scherzetto? Scegli da qui"
                href={halloweenHref ?? undefined}
                linkLabel="Tutta la collezione"
                accent="halloween-stripe"
              />
              <ProductCarousel products={halloweenProducts.data.map(toCardProduct)} />
            </section>
          )}
        </div>
      )}
      <HeroSlider banners={settings.banner} />
      <ServiceBar servizi={settings.servizi} soglia={settings.spedizione.sogliaGratuita} />
      <ShowcaseTiles tiles={settings.vetrine} />

      {offerte.data.length > 0 && (
        <section>
          <SectionHeading
            title="Offerte del momento"
            subtitle="Prezzi scontati per poco tempo"
            href="/offerte"
            linkLabel="Tutte le offerte"
            accent="bg-magenta"
          />
          <ProductCarousel products={offerte.data.map(toCardProduct)} />
        </section>
      )}

      {selezione.data.length > 0 && (
        <section>
          <SectionHeading
            title="La selezione di Bambù"
            subtitle="I prodotti scelti per te dal negozio"
            href="/prodotti?sort=featured"
            accent="bg-orange"
          />
          <ProductCarousel products={selezione.data.map(toCardProduct)} />
        </section>
      )}

      {bestseller.data.length > 0 && (
        <section>
          <SectionHeading title="I più venduti" href="/prodotti?sort=bestseller" accent="bg-sky" />
          <ProductCarousel products={bestseller.data.map(toCardProduct)} />
        </section>
      )}

      <StoreSection settings={settings} />

      {novita.data.length > 0 && (
        <section>
          <SectionHeading title="Novità in negozio" subtitle="Gli ultimi arrivi" href="/novita" accent="bg-leaf" />
          <ProductCarousel products={novita.data.map(toCardProduct)} />
        </section>
      )}

      {posts.length > 0 && (
        <section>
          <SectionHeading title="Dal blog" subtitle="Consigli e idee dalla cartoleria" href="/blog" linkLabel="Tutti gli articoli" />
          <div className="grid gap-5 md:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
