import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // The template's own image setting: every image is a Contentful asset (or,
  // before a space is connected, a bundled sample), sized by Contentful's
  // Images API through lib/contentful-image.tsx's loader — nothing for an
  // image optimiser to do, so the Worker needs none.
  images: {
    loader: "custom",
  },
  // The space the blog reads, inlined into the server bundle at build time.
  // A deploy takes both from its environment's CONTENTFUL_SPACE_ID and
  // CONTENTFUL_ACCESS_TOKEN Orun secrets (apps/web/component.yaml); unset,
  // they are empty and the blog renders its bundled sample posts. The
  // delivery token reads published content only, and only server code (lib/
  // api.ts, `server-only`) names either value, so neither reaches a browser.
  env: {
    CONTENTFUL_SPACE_ID: process.env.CONTENTFUL_SPACE_ID ?? "",
    CONTENTFUL_ACCESS_TOKEN: process.env.CONTENTFUL_ACCESS_TOKEN ?? "",
  },
  // Required by @opennextjs/cloudflare, which bundles `.next/standalone/**`
  // into the Worker. Trace from the monorepo root so workspace dependencies
  // resolve from the root node_modules.
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
