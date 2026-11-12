import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export — le jeu est 100% côté client (Zustand + localStorage)
  output: "export",
  // Pas d'optimisation d'images (incompatible avec export statique)
  images: { unoptimized: true },
  // Le trailing slash garantit que / sert bien index.html sur les hébergeurs statiques
  trailingSlash: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
