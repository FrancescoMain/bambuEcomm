import { getProducts, getSettings } from "@/lib/api/server";
import { SITE_URL, productPath } from "@/lib/urls";

export const revalidate = 3600;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

/**
 * Feed prodotti per Google Merchant Center (Shopping / schede gratuite).
 * URL da inserire in Merchant Center: https://<dominio>/feed/google
 */
export async function GET() {
  const [settings, first] = await Promise.all([getSettings(), getProducts({ limit: 100, page: 1 }, 3600)]);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) => getProducts({ limit: 100, page: i + 2 }, 3600))
  );
  const products = [first, ...rest].flatMap((p) => p.data).filter((p) => p.immagine);

  const items = products
    .map((p) => {
      const category = p.categoria.map((c) => c.name).join(" > ");
      return `<item>
<g:id>${p.id}</g:id>
<g:title>${esc(p.titolo.slice(0, 150))}</g:title>
<g:description>${esc(p.titolo)}</g:description>
<g:link>${esc(`${SITE_URL}${productPath(p)}`)}</g:link>
<g:image_link>${esc(p.immagine!)}</g:image_link>
${(p.immagini || []).slice(0, 10).map((src) => `<g:additional_image_link>${esc(src)}</g:additional_image_link>`).join("")}
<g:availability>${p.available ? "in_stock" : "out_of_stock"}</g:availability>
<g:price>${p.prezzo.toFixed(2)} EUR</g:price>
${p.inOfferta ? `<g:sale_price>${p.prezzoFinale.toFixed(2)} EUR</g:sale_price>` : ""}
<g:condition>new</g:condition>
${p.marca ? `<g:brand>${esc(p.marca)}</g:brand>` : "<g:identifier_exists>no</g:identifier_exists>"}
${category ? `<g:product_type>${esc(category)}</g:product_type>` : ""}
<g:shipping><g:country>IT</g:country><g:price>${(p.prezzoFinale >= settings.spedizione.sogliaGratuita ? 0 : settings.spedizione.costo).toFixed(2)} EUR</g:price></g:shipping>
</item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>Cartoleria Bambù</title>
<link>${SITE_URL}</link>
<description>Catalogo prodotti Cartoleria Bambù</description>
${items}
</channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
