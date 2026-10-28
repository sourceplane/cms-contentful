# cms-contentful — design

## 1. The template

Vercel's [Next.js Blog with Draft Mode (Contentful)](https://github.com/vercel/next.js/tree/canary/examples/cms-contentful)
(Next.js App Router, Tailwind CSS 3, Inter) is a blog whose content is in a
Contentful space: an **Author** type (name, picture) and a **Post** type
(title, slug, date, excerpt, cover image, rich-text content, author). The
home page shows the newest post as a hero and the rest under "More
Stories"; a post page renders its rich text with
`@contentful/rich-text-react-renderer` and two more stories. Every read is a
GraphQL query to Contentful's Content API (`lib/api.ts`); images are
Contentful assets sized by its Images API through a custom `next/image`
loader. Draft mode is turned on by Contentful's preview URL
(`/api/draft?secret=…&slug=…`) and reads drafts through the Content Preview
API; `/api/disable-draft` turns it off. `/api/revalidate` is a webhook that
revalidates the `posts` fetch tag. `npm run setup` imports the content model
(`lib/export.json`) into a space with `contentful-import`.

## 2. How it maps to Cloudflare

| Vercel | Here | Why |
|---|---|---|
| Next.js hosting | One Worker built by `@opennextjs/cloudflare` (`output: 'standalone'`), `public/` and the client chunks in its Static Assets, the static-assets incremental cache | Nothing in the Worker is revalidated |
| Static pages + `generateStaticParams`, the `posts` tag revalidated by a webhook | `/` and `/posts/[slug]` `force-dynamic`, every fetch `cache: "no-store"`; Contentful's API CDN is the cache | Tag revalidation needs a writable cache the static-assets one is not, and a build-time fetch would need the space at build |
| Env vars in the dashboard (or the Vercel integration) | The space id and the delivery token: optional Orun secrets, read at build and inlined into the server bundle. The preview token and the preview and revalidate secrets: Worker secrets, read at request time | The build decides connected or not; draft mode's values never enter the bundle, and a deploy never touches a Worker secret |
| `@contentful/vercel-nextjs-toolkit`'s draft route | `app/api/draft/route.ts`: the preview secret, the post through the Content Preview API, draft mode, a redirect | The toolkit authorises with Vercel's protection-bypass token, which has no Cloudflare twin; the preview URL is the upstream README's, unchanged |
| `next/image` with Contentful's loader | Unchanged (`images.loader: "custom"`) | Contentful sizes the image; the Worker has no optimiser to run |
| `npm run setup` | Unchanged: `pnpm --filter @app/web run setup`, run by a person with a management token | A management token is the space owner's, and nothing in a bootstrap holds one |

## 3. The unconnected blog

The platform brokers Cloudflare, not Contentful, so a bootstrap deploys a
blog whose owner has no space yet. Upstream would fetch
`spaces/undefined` and every page would be a 500. Here a build without both
`CONTENTFUL_SPACE_ID` and `CONTENTFUL_ACCESS_TOKEN` is **unconnected**:
`lib/api.ts` answers every query from `lib/sample.ts` (three posts in the
GraphQL response's shape, their covers and the avatar in `public/sample`),
the layout shows a "connect your Contentful space" notice
(`data-contentful-notice="unconnected"`), the first post is the connect
steps, and `/api/draft` answers 401 with the reason. This is cms-sanity's
pattern, kept to the same shape: the smoke, the e2e tier and the deployment
record all read the notice.

## 4. The repository

cms-sanity's shape (turso v8): `apps/web` (type
`cloudflare-workers-assets-turbo`, lane `isolated`) and `tests/web` (type
`turbo-package`, a vitest suite run on the `dev` rung). No infrastructure:
Contentful is a hosted service. The blog's name is one seam, `SITE_NAME` in
`app/site.ts`, read by the home heading, the page title and every post's
link home. The footer's upstream link (`EXAMPLE_URL` in `lib/constants.ts`)
shares this baseline's slug, so the rename engine protects it.

## 5. The build

`next build` (Turbopack), `opennextjs-cloudflare build --skipBuild`, then
`populateCache local`. `repo-blueprint.yaml` is cms-sanity's: one landing
(`01-product`) places, brands and lands the whole tree, one convergence
builds and deploys stage and prod side by side, and `02-docs` records what
went live. The smoke checks the home page renders its "More Stories"
section and `/api/draft` refuses a request without the preview secret.

## 6. Out of scope

- Embedding the content-model import in the bootstrap: it needs a
  management token, which only the space's owner has (cms-sanity's
  `sanity init` is a person's step too).
- A cache in the Worker (OpenNext's R2 incremental cache) to bring back
  tag revalidation: an upgrade for a high-traffic blog (risk CC-C).

## 7. The alternative rejected

**Static generation at build time, as upstream.** `generateStaticParams`
and static pages would fetch the space during `next build`: a fresh
product has none, so the build would fail or bake the samples in for
good, and a published post would need a rebuild (or an R2 cache and the
webhook) to appear. Rendering on request makes a published post live on the
next visit, keeps the build independent of the space, and costs one
GraphQL request per page, which Contentful's CDN answers.
