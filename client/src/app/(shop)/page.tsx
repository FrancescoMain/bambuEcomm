import type { Metadata } from "next";
import { HeroSlider } from "@/components/home/HeroSlider";
import { ServiceBar } from "@/components/home/ServiceBar";
import { ShowcaseTiles } from "@/components/home/ShowcaseTiles";
import { StoreSection } from "@/components/home/StoreSection";
import { ProductCarousel } from "@/components/shop/ProductCarousel";
import { PostCard } from "@/components/shop/PostCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPosts, getProducts, getSettings } from "@/lib/api/server";
import { toCardProduct } from "@/lib/types";
import { SITE_URL } from "@/lib/urls";

// La home si rigenera da sola ogni minuto (o subito dopo una modifica admin)
export const revalidate = 60;

export const metadata: Metadata = {
  title: { absolute: "Cartoleria Bambù | Cancelleria, zaini e articoli per la scuola a Torre Annunziata" },
  alternates: { canonical: SITE_URL },
};

export default async function HomePage() {
  const [settings, offerte, selezione, bestseller, novita, posts] = await Promise.all([
    getSettings(),
    getProducts({ onSale: true, available: true, sort: "discount", limit: 12 }),
    getProducts({ featured: true, available: true, limit: 12 }),
    getProducts({ sort: "bestseller", available: true, limit: 12 }),
    getProducts({ sort: "newest", available: true, limit: 12 }),
    getPosts(3),
  ]);

  return (
    <div className="container space-y-14 pt-5 sm:space-y-20 sm:pt-8">
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
