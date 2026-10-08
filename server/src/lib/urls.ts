import { slugify } from "./catalog";

export const frontendUrl = (): string =>
  (process.env.FRONTEND_URL || "https://www.xn--cartoleriabamb-jrb.com").replace(/\/$/, "");

/** Slug tagliato a parola intera (stesso algoritmo di client/src/lib/format.ts) */
export const productSlug = (titolo: string, max = 80): string => {
  const words = slugify(titolo).split("-").filter(Boolean);
  let out = "";
  for (const w of words) {
    if ((out ? out.length + 1 : 0) + w.length > max) break;
    out = out ? `${out}-${w}` : w;
  }
  return out || slugify(titolo).slice(0, max);
};

/** URL pubblico della scheda prodotto: /product/72-nome-del-prodotto */
export const productUrl = (id: number, titolo: string): string =>
  `${frontendUrl()}/product/${id}-${productSlug(titolo)}`;
