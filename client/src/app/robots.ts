import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/urls";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/account",
          "/carrello",
          "/checkout",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/preferiti",
          "/api/",
          "/*?*sort=",
          "/*?*brand=",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
