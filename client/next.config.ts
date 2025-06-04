import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverActions: {
    bodySizeLimit: "10mb", // Permetti upload fino a 10 MB
  },
  /* config options here */
};

export default nextConfig;
