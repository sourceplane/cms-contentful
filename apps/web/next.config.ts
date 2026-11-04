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
  // Dev server only (`next build` ignores it): orun.work's live Preview tab
  // loads `next dev` from the preview's own host, and Next.js refuses the
  // hot reload and other /_next/* dev requests from an origin it is not told
  // about. These are the preview's hosts, prod's and stage's.
  allowedDevOrigins: ["*.orun-preview.app", "preview-gateway-stage.oruncloud.workers.dev"],
  experimental: {
    // Dev server only: behind orun.work's live Preview the browser's Origin
    // is the preview's host while `next dev` sees a local Host, and Next.js
    // refuses a Server Action from an origin it is not told about. `next
    // build` runs with NODE_ENV=production, so production keeps its
    // same-origin check.
    ...(process.env.NODE_ENV === "development"
      ? { serverActions: { allowedOrigins: ["*.orun-preview.app", "preview-gateway-stage.oruncloud.workers.dev"] } }
      : {}),
  },
};

export default nextConfig;
