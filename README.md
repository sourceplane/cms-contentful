# cms-contentful

Vercel's [Next.js Blog with Draft Mode (Contentful)](https://github.com/vercel/next.js/tree/canary/examples/cms-contentful)
— posts and authors in a Contentful space read over its GraphQL Content
API, the post body rich text rendered with Contentful's renderer, draft mode
that previews unpublished posts through the Content Preview API, and the
setup script that imports the content model — running on **Cloudflare
Workers + Static Assets** through
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare), deployed by
[Orun](https://github.com/sourceplane/orun) to stage and prod on every merge.
Packaging it as an Orun baseline is the next milestone (CC2).
It goes live before its owner has a Contentful space at all.

The template's code is the code and Contentful stays the SaaS it is. What
the port adds is the Workers build, the monorepo wrapper, a test package and
the deploy contract; what it changes is what Workers force: the blog renders
on request against Contentful's API CDN instead of statically generating
its pages and revalidating them by tag, and the draft route checks its
preview secret itself instead of through Vercel's deployment-protection
bypass. What
makes it deployable with no Contentful space is the port's: an unconnected
build renders bundled sample posts under a visible "connect your Contentful
space" notice instead of failing. See [`specs/epics/cms-contentful`](specs/epics/cms-contentful/README.md)
for the design, the milestones and the as-built status.

## What is here (the site)

| Surface | Where |
|---|---|
| Home, `/posts/[slug]`, the unconnected notice | `apps/web/app` |
| Draft mode on (`/api/draft`) and off (`/api/disable-draft`), the revalidation webhook (`/api/revalidate`) | `apps/web/app/api` |
| The GraphQL reads, with the sample-mode fallback | `apps/web/lib/api.ts` |
| The rich-text renderer and the image loader | `apps/web/lib/markdown.tsx`, `apps/web/lib/contentful-image.tsx` |
| The sample posts an unconnected blog renders | `apps/web/lib/sample.ts`, `apps/web/public/sample` |
| The content model and its import (`pnpm run setup`) | `apps/web/lib/export.json`, `apps/web/lib/setup.js` |
| The blog's name (the rename's seam) | `apps/web/app/site.ts` |
| Workers build and deploy contract | `apps/web/next.config.ts`, `open-next.config.ts`, `wrangler.jsonc`, `component.yaml` |
| Tests | `tests/web` (vitest) |

## Getting started

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build            # next build + opennextjs-cloudflare build → apps/web/.open-next
pnpm --filter @app/web preview   # wrangler dev over the built Worker: the sample posts, unconnected
```

That much needs no Contentful space: the baseline's own e2e tier
(`testing/e2e.test.sh`) runs exactly this on each landing before a tag, and
a blog's developers run it before a push — a blog's pull request builds and
dry-deploys it, and does not lint or run the tests. To see your own content:

```bash
CONTENTFUL_SPACE_ID=<id> CONTENTFUL_MANAGEMENT_TOKEN=<CFPAT-…> pnpm --filter @app/web run setup   # the Author and Post types
cd apps/web
cp .env.example .env.local        # CONTENTFUL_SPACE_ID, CONTENTFUL_ACCESS_TOKEN, the draft-mode values
cd ../..
pnpm --filter @app/web dev        # http://localhost:3000
```

For the Worker locally, the space id and its delivery token are read at
build time and the draft-mode values are Worker secrets:

```bash
cd apps/web
cp .dev.vars.example .dev.vars    # CONTENTFUL_PREVIEW_ACCESS_TOKEN, CONTENTFUL_PREVIEW_SECRET
CONTENTFUL_SPACE_ID=<id> CONTENTFUL_ACCESS_TOKEN=<token> pnpm build
pnpm preview                      # wrangler dev over the built Worker
```

| Variable | Where it is read | What it does |
|---|---|---|
| `CONTENTFUL_SPACE_ID` | build time (`next build` inlines it into the server bundle, never the browser's) | The space. A deployed build takes it from its environment's `CONTENTFUL_SPACE_ID` secret, best-effort. Unset, the blog is unconnected: the sample posts under a notice, draft mode refused with 401. |
| `CONTENTFUL_ACCESS_TOKEN` | build time, likewise | The space's Content Delivery API token (`CONTENTFUL_ACCESS_TOKEN`); needed with the space id to connect. |
| `CONTENTFUL_PREVIEW_ACCESS_TOKEN` | request time, in the Worker | The Content Preview API token draft mode reads drafts with. A Worker secret in stage/prod, `.dev.vars` locally, `.env.local` for `next dev`. Optional: without it draft mode answers 401 with the reason. |
| `CONTENTFUL_PREVIEW_SECRET` | request time, in the Worker | The secret Contentful's preview URL carries to `/api/draft`. Optional, likewise. |
| `CONTENTFUL_REVALIDATE_SECRET` | request time, in the Worker | The `x-vercel-reval-key` header `/api/revalidate` checks. Optional. |
| `CONTENTFUL_MANAGEMENT_TOKEN` | `pnpm run setup` only | Imports the content model; never stored. |

## How it maps to Vercel

| Vercel | Here |
|---|---|
| Next.js hosting (static pages, ISR, route handlers) | One Cloudflare Worker (`.open-next/worker.js`) + Static Assets; `/` and `/posts/[slug]` render on every request (`force-dynamic`, no `generateStaticParams`) |
| Project env vars in the dashboard (or the Vercel Contentful integration) | Build time: the space id and delivery token from optional Orun secrets, inlined by `next build` into the server bundle. Run time: the preview token and the preview and revalidate secrets as Worker secrets |
| A missing env var fails every route (and the build) | An unconnected blog: sample posts and a notice — deployable before a Contentful space exists |
| `fetch` cached under the `posts` tag, revalidated by Contentful's webhook (`/api/revalidate`) | Every read `cache: "no-store"` against Contentful's API CDN; the webhook route kept, with nothing cached to refresh |
| Draft mode through `@contentful/vercel-nextjs-toolkit` (Vercel's protection-bypass token) | `/api/draft` checks `CONTENTFUL_PREVIEW_SECRET`, looks the post up through the Content Preview API, enables draft mode and redirects — the upstream README's preview URL, unchanged |
| `next/image` through Contentful's Images API (custom loader) | Unchanged: the template's loader sizes each image at Contentful (`images.loader: "custom"`); the Worker optimises nothing |
| `npm run setup` (contentful-import) | Unchanged, run by a person with a management token: `pnpm --filter @app/web run setup` |
| Deploy on push | Orun deploys `<repo>-web-{stage,prod}` on merge to `main` and smoke-tests it (`apps/web/component.yaml`) |
| "Deploy with Vercel" (clone the template) | `orun new --blueprint repo-blueprint.yaml` — a new repository, branded, deployed |

## CI

| Workflow | What it runs | Ships to a blog |
|---|---|---|
| `ci.yml` | the Orun pipeline, and the only workflow a blog carries: `orun plan --changed`, then one job per lane. A pull request runs the verify lanes (the blog built and dry-deployed per environment; they do not lint or run the tests), except the bootstrap's own landings (`orun/BASE-*`), where `plan` alone is the check; a merge deploys stage → prod. It plans nothing while `intent.yaml` names the placeholder workspace `ws_CHANGE_ME`, as this repository does. A manual run (Orunbase's Deploy button, or Run workflow on `main`) plans the environment and components it names under the push-to-main trigger, so they deploy as a merge deploys them | yes |
