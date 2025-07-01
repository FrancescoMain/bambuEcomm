"use client";

import Head from "next/head";
import { useEffect } from "react";

interface ProductSEOProps {
  product: {
    id: number;
    titolo: string;
    descrizione?: string;
    prezzo: number | string;
    immagine?: string;
    categoria?: { name: string }[];
  } | null;
}

export default function ProductSEO({ product }: ProductSEOProps) {
  useEffect(() => {
    if (product) {
      // Update document title
      document.title = `${product.titolo} | Cartoleria Bambù Torre Annunziata`;

      // Update meta description
      const metaDescription = document.querySelector(
        'meta[name="description"]'
      );
      if (metaDescription) {
        metaDescription.setAttribute(
          "content",
          product.descrizione
            ? `${product.descrizione.substring(
                0,
                150
              )}... | Cartoleria Bambù Torre Annunziata`
            : `${product.titolo} - Prezzo €${product.prezzo} | Cartoleria Bambù Torre Annunziata`
        );
      }
    }
  }, [product]);

  if (!product) return null;

  const structuredData = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.titolo,
    description:
      product.descrizione ||
      `${product.titolo} disponibile presso Cartoleria Bambù`,
    image: product.immagine
      ? `https://www.xn--cartoleriabamb-jrb.com${product.immagine}`
      : undefined,
    offers: {
      "@type": "Offer",
      price:
        typeof product.prezzo === "string"
          ? parseFloat(product.prezzo)
          : product.prezzo,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "Cartoleria Bambù",
      },
    },
    brand: {
      "@type": "Brand",
      name: "Cartoleria Bambù",
    },
    category:
      product.categoria?.map((cat) => cat.name).join(", ") || "Cancelleria",
  };

  return (
    <Head>
      <title>{product.titolo} | Cartoleria Bambù Torre Annunziata</title>
      <meta
        name="description"
        content={
          product.descrizione
            ? `${product.descrizione.substring(
                0,
                150
              )}... | Cartoleria Bambù Torre Annunziata`
            : `${product.titolo} - Prezzo €${product.prezzo} | Cartoleria Bambù Torre Annunziata`
        }
      />
      <meta
        name="keywords"
        content={`${product.titolo}, ${product.categoria
          ?.map((cat) => cat.name)
          .join(", ")}, cartoleria torre annunziata, cancelleria online`}
      />

      {/* Open Graph */}
      <meta
        property="og:title"
        content={`${product.titolo} | Cartoleria Bambù`}
      />
      <meta
        property="og:description"
        content={
          product.descrizione ||
          `${product.titolo} disponibile presso Cartoleria Bambù`
        }
      />
      <meta property="og:type" content="product" />
      <meta
        property="og:url"
        content={`https://www.xn--cartoleriabamb-jrb.com/product/${product.id}`}
      />
      {product.immagine && (
        <meta
          property="og:image"
          content={`https://www.xn--cartoleriabamb-jrb.com${product.immagine}`}
        />
      )}

      {/* Product Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
    </Head>
  );
}
