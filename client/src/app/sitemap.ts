import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.xn--cartoleriabamb-jrb.com";
  const currentDate = new Date().toISOString();

  // Pagine statiche principali
  const staticPages = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/chi-siamo`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/products`,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
  ];

  // TODO: Aggiungere dinamicamente prodotti e categorie quando necessario
  // Esempio per future implementazioni:
  // const products = await fetchProducts()
  // const productPages = products.map((product) => ({
  //   url: `${baseUrl}/product/${product.id}`,
  //   lastModified: product.updatedAt || currentDate,
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.6,
  // }))

  return staticPages;
}
