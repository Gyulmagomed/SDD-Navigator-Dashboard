/**
 * Конфигурация Next.js (SDD Navigator).
 *
 * - output: "standalone" — сборка для Docker/Node-сервера (см. Dockerfile).
 * - rewrites — опциональный прокси /api/* на бэкенд; по умолчанию в проекте
 *   запросы идут с клиента на NEXT_PUBLIC_API_URL через Axios.
 * - ANALYZE=true + npm run analyze — включает @next/bundle-analyzer.
 */
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  output: "standalone",
  // async rewrites() {
  //   return [
  //     {
  //       source: "/api/:path*",
  //       destination: `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/:path*`,
  //     },
  //   ];
  // },
};

export default withBundleAnalyzer(nextConfig);
