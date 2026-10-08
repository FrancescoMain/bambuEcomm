import { productSlug, slugify } from "./format";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.xn--cartoleriabamb-jrb.com").replace(
  /\/$/,
  ""
);
export const SITE_NAME = "Cartoleria Bambù";

/** /product/72-borsa-tote-bag (l'id iniziale basta all'API, lo slug serve alla SEO) */
export const productPath = (p: { id: number; titolo: string }) => `/product/${p.id}-${productSlug(p.titolo)}`;

export const categoryPath = (c: { name: string; slug?: string }) => `/categoria/${c.slug || slugify(c.name)}`;

export const brandPath = (name: string) => `/prodotti?brand=${encodeURIComponent(name)}`;

export const absoluteUrl = (path: string) => (path.startsWith("http") ? path : `${SITE_URL}${path}`);

export const whatsappUrl = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
