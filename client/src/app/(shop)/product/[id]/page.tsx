import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Lock, RotateCcw, ShieldCheck, Store, Truck } from "lucide-react";
import { getProduct, getProducts, getRelated, getReviews, getSettings } from "@/lib/api/server";
import { toCardProduct } from "@/lib/types";
import { formatDate, formatPrice } from "@/lib/format";
import { absoluteUrl, categoryPath, productPath, whatsappUrl } from "@/lib/urls";
import { Breadcrumbs } from "@/components/shop/Breadcrumbs";
import { Price } from "@/components/ui/Price";
import { Stars } from "@/components/ui/Stars";
import { AccordionItem } from "@/components/ui/Accordion";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ProductCarousel } from "@/components/shop/ProductCarousel";
import { ProductView } from "@/components/product/ProductView";
import { DeliveryEstimate } from "@/components/product/DeliveryEstimate";
import { ShareButtons } from "@/components/product/ShareButtons";
import { ReviewForm } from "@/components/product/ReviewForm";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";

export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

// I prodotti più venduti vengono pre-generati al deploy, gli altri al primo accesso
export async function generateStaticParams() {
  const top = await getProducts({ sort: "bestseller", limit: 40 });
  return top.data.map((p) => ({ id: productPath(p).replace("/product/", "") }));
}

const loadProduct = async (raw: string) => {
  const id = parseInt(raw, 10);
  if (!Number.isFinite(id) || id <= 0) return null;
  return getProduct(id);
};

const plain = (text: string | null | undefined) => (text || "").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await loadProduct(id);
  if (!product) return { title: "Prodotto non trovato", robots: { index: false } };
  const settings = await getSettings();
  const category = product.categoria[product.categoria.length - 1]?.name;
  const description =
    plain(product.descrizione).slice(0, 150) ||
    `Acquista ${product.titolo} online su Cartoleria Bambù a ${formatPrice(product.prezzoFinale)}. Spedizione gratuita da ${formatPrice(settings.spedizione.sogliaGratuita)} oppure ritiro in negozio a Torre Annunziata.`;
  const url = absoluteUrl(productPath(product));
  return {
    title: [product.titolo, product.marca, category].filter(Boolean).join(" | ").slice(0, 70),
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: product.titolo,
      description,
      images: product.immagine ? [{ url: product.immagine, alt: product.titolo }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id: raw } = await params;
  const product = await loadProduct(raw);
  if (!product) notFound();
  const canonical = productPath(product);
  if (`/product/${raw}` !== canonical) permanentRedirect(canonical);

  const [settings, related, reviews] = await Promise.all([
    getSettings(),
    getRelated(product.id, 10),
    getReviews(product.id),
  ]);

  const mainCategory = product.categoria[product.categoria.length - 1];
  const parentCategory = mainCategory?.parentId
    ? product.categoria.find((c) => c.id === mainCategory.parentId)
    : undefined;
  const url = absoluteUrl(canonical);
  const savings = product.prezzo - product.prezzoFinale;
  const { spedizione, contatti, resi } = settings;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.titolo,
    image: [product.immagine, ...(product.immagini || [])].filter(Boolean),
    description: plain(product.descrizione) || product.titolo,
    sku: product.codice || String(product.id),
    ...(product.marca ? { brand: { "@type": "Brand", name: product.marca } } : {}),
    ...(mainCategory ? { category: mainCategory.name } : {}),
    ...(reviews.totale > 0 && reviews.media
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.media, reviewCount: reviews.totale } }
      : {}),
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "EUR",
      price: product.prezzoFinale.toFixed(2),
      availability: product.available ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      ...(product.inOfferta && product.scontoFine ? { priceValidUntil: product.scontoFine.slice(0, 10) } : {}),
      seller: { "@type": "Organization", name: "Cartoleria Bambù" },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: (product.prezzoFinale >= spedizione.sogliaGratuita ? 0 : spedizione.costo).toFixed(2),
          currency: "EUR",
        },
        shippingDestination: { "@type": "DefinedRegion", addressCountry: "IT" },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: spedizione.giorniLavorazione, unitCode: "DAY" },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: spedizione.giorniTransitoMin,
            maxValue: spedizione.giorniTransitoMax,
            unitCode: "DAY",
          },
        },
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IT",
        returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: resi.giorni,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/ReturnShippingFees",
      },
    },
  };

  // Le chiavi esplicite evitano un falso avviso di React sui figli passati
  // da un Server Component a un Client Component
  const header = (
    <div key="product-header" className="space-y-4">
      <div className="space-y-2">
        {product.marca && (
          <Link
            href={`/prodotti?brand=${encodeURIComponent(product.marca)}`}
            className="text-sm font-bold uppercase tracking-wide text-ink-muted hover:text-brand-600"
          >
            {product.marca}
          </Link>
        )}
        <h1 className="text-balance text-2xl font-extrabold leading-tight sm:text-3xl">{product.titolo}</h1>
        {reviews.totale > 0 && reviews.media && (
          <a href="#recensioni" className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink">
            <Stars value={reviews.media} />
            {reviews.media.toFixed(1)} · {reviews.totale} {reviews.totale === 1 ? "recensione" : "recensioni"}
          </a>
        )}
      </div>

      <div className={product.inOfferta ? "rounded-2xl bg-magenta-soft/60 p-4" : ""}>
        {product.inOfferta && (
          <p className="mb-1 text-xs font-extrabold uppercase tracking-wider text-magenta-ink">Prezzo scontato</p>
        )}
        <Price
          prezzo={product.prezzo}
          prezzoFinale={product.prezzoFinale}
          scontoPercentuale={product.scontoPercentuale}
          size="lg"
          showBadge
        />
        {product.inOfferta && savings > 0 && (
          <p className="mt-1 text-sm font-semibold text-magenta-ink">
            Risparmi {formatPrice(savings)}
            {product.scontoFine ? ` · offerta valida fino al ${formatDate(product.scontoFine)}` : ""}
          </p>
        )}
        <p className="mt-1 text-xs text-ink-muted">IVA inclusa. Spedizione calcolata al checkout.</p>
      </div>

      <p className="flex items-center gap-2 text-sm font-semibold">
        <span className={`h-2.5 w-2.5 rounded-full ${product.available ? "bg-leaf" : "bg-magenta"}`} />
        {product.available ? "Disponibile" : "Al momento esaurito"}
      </p>
    </div>
  );

  const footer = (
    <div key="product-footer" className="space-y-5">
      {product.available && (
        <DeliveryEstimate
          lavorazione={spedizione.giorniLavorazione}
          transitoMin={spedizione.giorniTransitoMin}
          transitoMax={spedizione.giorniTransitoMax}
          pickup={spedizione.ritiroInNegozio}
        />
      )}
      <ul className="grid gap-2.5 text-sm text-ink-soft sm:grid-cols-2">
        <li className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-brand-600" /> Spedizione gratuita da {formatPrice(spedizione.sogliaGratuita)}
        </li>
        {spedizione.ritiroInNegozio && (
          <li className="flex items-center gap-2">
            <Store className="h-4 w-4 text-brand-600" /> Ritiro gratuito in negozio
          </li>
        )}
        <li className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-brand-600" /> Pagamenti sicuri con carta e wallet
        </li>
        <li className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-brand-600" /> Recesso entro {resi.giorni} giorni
        </li>
      </ul>
      <ShareButtons url={url} title={product.titolo} image={product.immagine} />
      <dl className="space-y-1 border-t border-paper-line pt-4 text-sm text-ink-muted">
        {product.codice && (
          <div className="flex gap-2">
            <dt>Codice:</dt>
            <dd className="font-medium text-ink-soft">{product.codice}</dd>
          </div>
        )}
        {product.categoria.length > 0 && (
          <div className="flex flex-wrap gap-x-2">
            <dt>Categorie:</dt>
            <dd className="flex flex-wrap gap-x-2">
              {product.categoria.map((c) => (
                <Link key={c.id} href={categoryPath({ name: c.name })} className="font-medium text-ink-soft hover:text-brand-600">
                  {c.name}
                </Link>
              ))}
            </dd>
          </div>
        )}
      </dl>
    </div>
  );

  return (
    <div className="container pb-10 pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs
        className="mb-6"
        items={[
          ...(parentCategory ? [{ label: parentCategory.name, href: categoryPath({ name: parentCategory.name }) }] : []),
          ...(mainCategory ? [{ label: mainCategory.name, href: categoryPath({ name: mainCategory.name }) }] : []),
          { label: product.titolo },
        ]}
      />

      <ProductView product={product} header={header} footer={footer} />

      <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-12">
        <section aria-label="Dettagli prodotto" className="border-t border-paper-line">
          <AccordionItem title="Descrizione" defaultOpen>
            {plain(product.descrizione) ? (
              <div className="space-y-3 whitespace-pre-line">{product.descrizione}</div>
            ) : (
              <p>Per maggiori informazioni su questo prodotto contattaci: ti rispondiamo in pochi minuti.</p>
            )}
          </AccordionItem>
          <AccordionItem title="Spedizione e ritiro">
            <ul className="list-disc space-y-1.5 pl-5">
              <li>
                Spedizione in tutta Italia a {formatPrice(spedizione.costo)}, gratuita per ordini da {formatPrice(spedizione.sogliaGratuita)}.
              </li>
              <li>Tempi di consegna: {spedizione.tempiConsegna}. Riceverai il numero di tracking via email.</li>
              {spedizione.ritiroInNegozio && (
                <li>
                  Ritiro gratuito in negozio: {contatti.indirizzo}, {contatti.citta}.
                </li>
              )}
              {spedizione.giornata.attivo && <li>{spedizione.giornata.descrizione}</li>}
            </ul>
            <Link href="/spedizioni-e-resi" className="mt-3 inline-block font-semibold text-brand-600 hover:underline">
              Tutte le informazioni su spedizioni e resi →
            </Link>
          </AccordionItem>
          <AccordionItem title="Resi e recesso">
            <p>{resi.testo}</p>
            <Link href="/recesso" className="mt-3 inline-block font-semibold text-brand-600 hover:underline">
              Recesso online →
            </Link>
          </AccordionItem>
          <AccordionItem title="Pagamenti sicuri">
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
              Paghi con carta di credito o debito, Apple Pay e Google Pay su pagina sicura Stripe: non vediamo né salviamo i dati della tua carta.
              {settings.pagamenti.contrassegno.attivo && ` Disponibile anche il pagamento alla consegna (+${formatPrice(settings.pagamenti.contrassegno.commissione)}).`}
            </p>
          </AccordionItem>
          <AccordionItem title="Hai bisogno di aiuto?">
            <p>
              Scrivici su{" "}
              <a href={whatsappUrl(contatti.whatsapp, `Ciao! Vorrei informazioni su: ${product.titolo}`)} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 hover:underline">
                WhatsApp
              </a>
              , chiamaci al <a href={`tel:${contatti.telefono.replace(/\s/g, "")}`} className="font-semibold">{contatti.telefono}</a> o
              visita la pagina <Link href="/contatti" className="font-semibold text-brand-600 hover:underline">contatti</Link>.
            </p>
          </AccordionItem>
        </section>

        <section id="recensioni" aria-label="Recensioni" className="scroll-mt-40">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold">Recensioni</h2>
              {reviews.totale > 0 && reviews.media ? (
                <p className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
                  <Stars value={reviews.media} /> {reviews.media.toFixed(1)} su 5 · {reviews.totale}{" "}
                  {reviews.totale === 1 ? "recensione" : "recensioni"}
                </p>
              ) : (
                <p className="mt-1 text-sm text-ink-muted">Nessuna recensione: scrivi tu la prima!</p>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {reviews.recensioni.slice(0, 6).map((r) => (
              <article key={r.id} className="card p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold">
                    {r.nome}
                    {r.verificata && <span className="ml-2 text-xs font-semibold text-brand-600">✓ Cliente registrato</span>}
                  </p>
                  <Stars value={r.voto} size={14} />
                </div>
                {r.testo && <p className="mt-2 text-[15px] text-ink-soft">{r.testo}</p>}
                <p className="mt-2 text-xs text-ink-faint">{formatDate(r.createdAt)}</p>
              </article>
            ))}
            <ReviewForm productId={product.id} />
          </div>
        </section>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <SectionHeading
            title="Potrebbe piacerti anche"
            href={mainCategory ? categoryPath({ name: mainCategory.name }) : "/prodotti"}
            linkLabel={mainCategory ? `Tutto in ${mainCategory.name}` : "Vedi tutti"}
          />
          <ProductCarousel products={related.map(toCardProduct)} />
        </section>
      )}

      <div className="mt-16">
        <RecentlyViewed excludeId={product.id} />
      </div>
    </div>
  );
}
