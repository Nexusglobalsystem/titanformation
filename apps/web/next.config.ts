import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Monorepo pnpm : inclut packages/core et packages/ui dans le traçage de
  // fichiers Next.js pour le bundle serverless (recommandé par Vercel).
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
