import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverActions: {
    bodySizeLimit: "10mb", // Permetti upload fino a 10 MB
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.gigliospa.com",
        port: "",
        pathname: "/img/**",
      },
    ],
  },
  /* config options here */
};

export default nextConfig;
