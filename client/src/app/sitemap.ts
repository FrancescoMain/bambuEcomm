import type { MetadataRoute } from "next";
import { getCategories, getPosts, getProducts } from "@/lib/api/server";
import { SITE_URL, productPath } from "@/lib/urls";

export const revalidate = 3600;

/** Sitemap dinamica: pagine, categorie, prodotti (con immagini) e articoli del blog */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages = [
    ["", 1, "daily"],
    ["/prodotti", 0.9, "daily"],
    ["/offerte", 0.9, "daily"],
    ["/novita", 0.8, "daily"],
    ["/chi-siamo", 0.6, "monthly"],
    ["/contatti", 0.6, "monthly"],
    ["/faq", 0.5, "monthly"],
    ["/spedizioni-e-resi", 0.5, "monthly"],
    ["/preventivi", 0.5, "monthly"],
    ["/rivenditori", 0.4, "monthly"],
    ["/blog", 0.6, "weekly"],
    ["/recesso", 0.3, "yearly"],
    ["/mappa-del-sito", 0.3, "monthly"],
  ] as const;

  const [categories, posts] = await Promise.all([getCategories(), getPosts(50)]);

  // Tutti i prodotti, a pagine da 100
  const first = await getProducts({ limit: 100, page: 1, sort: "newest" }, 3600);
  const rest = await Promise.all(
    Array.from({ length: Math.max(0, first.totalPages - 1) }, (_, i) =>
      getProducts({ limit: 100, page: i + 2, sort: "newest" }, 3600)
    )
  );
  const products = [first, ...rest].flatMap((p) => p.data);

  return [
    ...pages.map(([path, priority, changeFrequency]) => ({
      url: `${SITE_URL}${path}`,
      lastModified: now,
      changeFrequency,
      priority,
    })),
    ...categories.map((c) => ({
      url: `${SITE_URL}/categoria/${c.slug}`,
      lastModified: c.updatedAt ? new Date(c.updatedAt) : now,
      changeFrequency: "weekly" as const,
      priority: c.parentId ? 0.7 : 0.8,
    })),
    ...products.map((p) => ({
      url: `${SITE_URL}${productPath(p)}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: "weekly" as const,
      priority: p.available ? 0.7 : 0.4,
      images: [p.immagine, ...(p.immagini || [])].filter(Boolean) as string[],
    })),
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];
}
