import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // Permetti upload fino a 10 MB
    },
  },  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.gigliospa.com",
        port: "",
        pathname: "/img/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
