import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Le immagini prodotto sono su Cloudinary: il loader chiede direttamente a
    // Cloudinary la versione ridimensionata in WebP/AVIF (nessun costo Vercel).
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      { protocol: "https", hostname: "www.gigliospa.com", pathname: "/img/**" },
    ],
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "date-fns", "recharts"],
  },
  async redirects() {
    return [
      { source: "/cart", destination: "/carrello", permanent: true },
      { source: "/orders", destination: "/account/ordini", permanent: true },
      { source: "/products", destination: "/prodotti", permanent: true },
      { source: "/dashboard/products/import", destination: "/dashboard/import-prodotti", permanent: true },
      { source: "/checkout/cancel", destination: "/checkout?annullato=1", permanent: false },
    ];
  },
};

export default nextConfig;
