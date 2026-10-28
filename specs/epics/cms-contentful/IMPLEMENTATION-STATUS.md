# cms-contentful — implementation status

| Milestone | State | Landed |
|---|---|---|
| CC0 — the spec | ✅ | the repository's first commit, CC-1 |
| CC1 — the blog on Workers | ✅ | CC-2 |
| CC2 — a baseline | planned | CC-3 |

## Departures from the upstream template

Everything not listed here is the template as it is upstream at `7356b0b`.

| # | What | Why |
|---|---|---|
| 1 | The app lives in `apps/web` of a pnpm workspace | The workspace has one lockfile, `pnpm-lock.yaml` |
| 2 | Next pinned to 16.3.8 with React 19 (upstream: `latest`, React 18); `@contentful/rich-text-react-renderer` 16 and `rich-text-types` 17; `contentful-import` 10 as a devDependency; `@contentful/vercel-nextjs-toolkit` dropped | OpenNext supports 16.3, not 16.4; the renderer's React 19 line; the import is a setup step; the toolkit is Vercel's (5) |
| 3 | `next.config.js` → `next.config.ts`: the template's `images.loader: "custom"`, plus `env` inlining `CONTENTFUL_SPACE_ID` and `CONTENTFUL_ACCESS_TOKEN`, `output: 'standalone'`, `outputFileTracingRoot` at the workspace root; `open-next.config.ts` and `wrangler.jsonc` | The Workers build; the space fixed per environment at build |
| 4 | `/` and `/posts/[slug]` are `force-dynamic`; `generateStaticParams` removed; every fetch `cache: "no-store"` (upstream: the `posts` tag) | No ISR on the static-assets cache, and no space needed at build (design §7) |
| 5 | `app/api/draft/route.ts` checks `CONTENTFUL_PREVIEW_SECRET`, looks the post up through the Content Preview API, enables draft mode and redirects (upstream re-exported the Vercel toolkit's handler); unconnected or without the preview token and secret it answers 401 with the reason | The toolkit authorises with Vercel's protection-bypass token |
| 6 | The unconnected sample mode: `lib/sample.ts`, `public/sample/*.svg`, `app/connect-contentful.tsx` in the layout; `lib/api.ts` falls back to the samples while either the space id or the delivery token is unset | A fresh product has no space (design §3) |
| 7 | `lib/api.ts`: `server-only`; the slug quoted as a GraphQL string literal; a missing collection is an empty list | No space value in a client bundle; a quote in a URL cannot change the query; a bad response is no posts, not a 500 |
| 8 | An unknown post is a 404 (`notFound()`; upstream read `post.title` of nothing — a 500) | A 404 is what it is |
| 9 | `SITE_NAME` in `app/site.ts` is the home heading, every post's link home and the page title (upstream: `Blog.` written in the heading and the link, and the title "Next.js and Contentful Example") | One rename seam: a blog built from this baseline carries its own name in all three |
| 10 | `EXAMPLE_PATH` → `EXAMPLE_URL`, the full upstream link, in `lib/constants.ts` | The footer's link written once, protected from the rename |
| 11 | `revalidateTag("posts", "max")` | Next 16's signature |
| 12 | `lib/markdown.tsx`: an embedded image goes through the template's `ContentfulImage` loader, `fill` for the legacy `layout="fill"` | With `images.loader: "custom"`, a bare `next/image` has no loader |
| 13 | ESLint 9 flat config (`eslint-config-next` 16); `typecheck` runs `next typegen` first; `tsconfig.json` excludes `.open-next` and `.wrangler` | The workspace's `typecheck` / `lint` / `test` / `build` contract |
| 14 | `.env.example` and `.dev.vars.example` say which values are read at build and which are Worker secrets; `setup` runs from `apps/web` | Workers read runtime secrets from the Worker |
| 15 | `tests/web` (vitest) | The template ships none |
