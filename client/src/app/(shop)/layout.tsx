import { Header } from "@/components/shop/Header";
import { Footer } from "@/components/shop/Footer";
import { WhatsAppButton } from "@/components/shop/WhatsAppButton";
import { NewsletterPopup } from "@/components/shop/NewsletterPopup";
import { HalloweenBats } from "@/components/shop/halloween/HalloweenBats";
import { getCategoryTree, getSettings } from "@/lib/api/server";
import { activeSeasonalTheme } from "@/lib/seasonal";
import type { CategoryNode } from "@/lib/types";
import { SITE_URL } from "@/lib/urls";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [tree, settings] = await Promise.all([getCategoryTree(), getSettings()]);
  // Il periodo si ricontrolla a ogni rigenerazione della pagina (al massimo ogni 5 minuti)
  const tema = activeSeasonalTheme(settings.temaStagionale);
  const seasonal = tema
    ? { tema, category: findCategory(tree, settings.temaStagionale.categoriaId) }
    : null;

  // Dati strutturati del negozio (LocalBusiness) e ricerca interna per Google
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Store",
      name: "Cartoleria Bambù",
      url: SITE_URL,
      image: `${SITE_URL}/logo-panda-512.png`,
      logo: `${SITE_URL}/logo-bambu.png`,
      telephone: settings.contatti.telefono,
      email: settings.contatti.email,
      foundingDate: "2016",
      priceRange: "€€",
      address: {
        "@type": "PostalAddress",
        streetAddress: settings.contatti.indirizzo,
        addressLocality: "Torre Annunziata",
        addressRegion: "NA",
        postalCode: "80058",
        addressCountry: "IT",
      },
      geo: { "@type": "GeoCoordinates", latitude: 40.7473, longitude: 14.4501 },
      sameAs: Object.values(settings.social).filter(Boolean),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Cartoleria Bambù",
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/prodotti?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <div className={tema ? `tema-${tema} min-h-screen` : undefined}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <a
        href="#contenuto"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
      >
        Vai al contenuto
      </a>
      <Header tree={tree} settings={settings} seasonal={seasonal} />
      <main id="contenuto" className="min-h-[60vh]">
        {children}
      </main>
      <Footer tree={tree} settings={settings} />
      {tema === "halloween" && <HalloweenBats />}
      <WhatsAppButton number={settings.contatti.whatsapp} />
      {settings.newsletterPopup.attivo && (
        <NewsletterPopup
          titolo={settings.newsletterPopup.titolo}
          testo={settings.newsletterPopup.testo}
          ritardo={settings.newsletterPopup.ritardoSecondi}
        />
      )}
    </div>
  );
}

const findCategory = (nodes: CategoryNode[], id: number | null): CategoryNode | null => {
  if (!id) return null;
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findCategory(node.children, id);
    if (found) return found;
  }
  return null;
};
