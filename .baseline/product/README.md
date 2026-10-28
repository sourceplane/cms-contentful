# cms-contentful

A blog whose posts and authors live in a [Contentful](https://www.contentful.com)
space — read over its GraphQL Content API, the post body rich text, with
draft mode that previews unpublished posts through the Content Preview API —
running on **Cloudflare Workers + Static Assets** through
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare). It is
Vercel's [Next.js Blog with Draft Mode (Contentful)](https://github.com/vercel/next.js/tree/canary/examples/cms-contentful)
template, ported to Workers.

## Live deployment

<!-- 02-docs:begin -->
Not recorded yet. The bootstrap's last phase writes the live URLs, the
workspace and the secrets the blog uses into
[ai/context/deployment.md](ai/context/deployment.md); how the blog deploys
and how to operate it is in
[ai/context/operations.md](ai/context/operations.md).
<!-- 02-docs:end -->

## Connecting Contentful

The blog deploys and serves before it has a Contentful space: until its
build is given a space id and a delivery token it shows a few **sample
posts** bundled with it, under a notice that says so. To make it read your
content:

1. **Create a space** at [app.contentful.com](https://app.contentful.com)
   and give it the blog's content model — an **Author** type and a **Post**
   type. The setup script imports both; it needs the space id (Settings →
   General settings) and a personal access token (Settings → CMA tokens),
   which it uses once and you can delete afterwards:

   ```bash
   CONTENTFUL_SPACE_ID=<space id> CONTENTFUL_MANAGEMENT_TOKEN=<CFPAT-…> pnpm --filter @app/web run setup
   ```

   Then write an author and a post or two, and **publish** them — a draft is
   only visible in draft mode.
2. **Give the build your space**, once per deployed environment: the space
   id and the **Content Delivery API** access token from Settings → API
   keys. `next build` bakes both into the server bundle (never into the
   browser's), so they are this repository's Orun secrets, and stage and
   prod can each name their own:

   ```bash
   orun secrets set CONTENTFUL_SPACE_ID      --env stage   # prompts for the value
   orun secrets set CONTENTFUL_ACCESS_TOKEN  --env stage
   orun secrets set CONTENTFUL_SPACE_ID      --env prod
   orun secrets set CONTENTFUL_ACCESS_TOKEN  --env prod
   ```

   Then **redeploy the blog**: a secret is read when the blog builds, and
   setting one builds nothing. Use **Deploy by hand** below, or change the
   stamp on the last line of `apps/web/component.yaml`
   (`# orun: redeploy …`) and merge; the sample posts and the notice are
   gone from that deploy on.
3. **Turn on draft mode** (optional; published posts need none). Store the
   **Content Preview API** access token and a preview secret of your
   choosing (any URL-safe value) as Worker secrets in each environment —
   Cloudflare's, so deploys leave them alone:

   ```bash
   pnpm --filter @app/web exec wrangler secret put CONTENTFUL_PREVIEW_ACCESS_TOKEN --name cms-contentful-web-stage
   pnpm --filter @app/web exec wrangler secret put CONTENTFUL_PREVIEW_SECRET       --name cms-contentful-web-stage
   pnpm --filter @app/web exec wrangler secret put CONTENTFUL_PREVIEW_ACCESS_TOKEN --name cms-contentful-web-prod
   pnpm --filter @app/web exec wrangler secret put CONTENTFUL_PREVIEW_SECRET       --name cms-contentful-web-prod
   ```

   In Contentful, Settings → Content preview → add a preview for **Post**
   whose URL is

   ```
   https://cms-contentful-web-prod.your-workers-subdomain.workers.dev/api/draft?secret=<CONTENTFUL_PREVIEW_SECRET>&slug={entry.fields.slug}
   ```

   (and one for stage, or your custom domain). **Open preview** on a post
   then shows its draft; `/api/disable-draft` leaves draft mode. Without the
   token and the secret the route answers 401 and says which is missing.

Published changes show on the next visit — every page renders on request —
with no deploy and no webhook. The template's on-demand revalidation route
(`/api/revalidate`, checking a `CONTENTFUL_REVALIDATE_SECRET` Worker secret)
is kept, but there is no cached page for it to refresh.

## What is here

| Surface | Where |
|---|---|
| Home, `/posts/[slug]`, the unconnected notice | `apps/web/app` |
| Draft mode on and off, the revalidation webhook | `apps/web/app/api/draft`, `apps/web/app/api/disable-draft`, `apps/web/app/api/revalidate` |
| The GraphQL reads, the rich-text renderer, the image loader | `apps/web/lib/api.ts`, `apps/web/lib/markdown.tsx`, `apps/web/lib/contentful-image.tsx` |
| The sample posts an unconnected blog shows | `apps/web/lib/sample.ts`, `apps/web/public/sample` |
| The content model and its import | `apps/web/lib/export.json`, `apps/web/lib/setup.js` |
| The blog's name | `apps/web/app/site.ts` |
| Workers build and deploy contract | `apps/web/next.config.ts`, `open-next.config.ts`, `wrangler.jsonc`, `component.yaml` |
| Tests | `tests/web` (vitest) |

## Getting started

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build            # next build + opennextjs-cloudflare build → apps/web/.open-next
```

That needs no Contentful space, and is what to run before you push: a pull
request builds the blog but does not lint or run its tests. With a space:

```bash
cd apps/web
cp .env.example .env.local        # CONTENTFUL_SPACE_ID, CONTENTFUL_ACCESS_TOKEN, and the draft-mode values
cd ../..
pnpm --filter @app/web dev        # http://localhost:3000
```

For the Worker locally, the space id and delivery token are read at build
time and the draft-mode values are Worker secrets:

```bash
cd apps/web
cp .dev.vars.example .dev.vars    # CONTENTFUL_PREVIEW_ACCESS_TOKEN, CONTENTFUL_PREVIEW_SECRET
CONTENTFUL_SPACE_ID=<id> CONTENTFUL_ACCESS_TOKEN=<token> pnpm build
pnpm preview                      # wrangler dev over the built Worker
```

| Variable | Read | What it does |
|---|---|---|
| `CONTENTFUL_SPACE_ID` | build time | The space. Deployed builds take it from the `CONTENTFUL_SPACE_ID` secret of their environment. Unset, the blog is unconnected: sample posts and a notice. |
| `CONTENTFUL_ACCESS_TOKEN` | build time | The space's Content Delivery API token (`CONTENTFUL_ACCESS_TOKEN`). Both it and the space id are needed to connect. |
| `CONTENTFUL_PREVIEW_ACCESS_TOKEN` | request time, in the Worker | The Content Preview API token draft mode reads drafts with. Optional. |
| `CONTENTFUL_PREVIEW_SECRET` | request time, in the Worker | The secret Contentful's preview URL carries. Optional. |
| `CONTENTFUL_REVALIDATE_SECRET` | request time, in the Worker | The `x-vercel-reval-key` header `/api/revalidate` checks. Optional. |
| `CONTENTFUL_MANAGEMENT_TOKEN` | `pnpm run setup` only | Imports the content model. Never stored. |

## How it deploys

Merges to `main` converge through [Orun](https://github.com/sourceplane/orun):
`.github/workflows/ci.yml` plans the changed components and runs each lane
against the workspace in `intent.yaml`. The blog builds once per
environment, with that environment's Contentful space, and deploys — to
`stage`, then to `prod` once stage has converged on the same commit; `dev`
only verifies. The Worker is `cms-contentful-web-<env>` on your account's
workers.dev subdomain, and every deploy is smoke-tested over HTTP: the home
page must render and the draft-mode route must refuse a request without the
preview secret. A pull request runs the same pipeline's verify lanes: the
blog built and dry-deployed for each environment, with nothing deployed.
They do not lint or run the tests, so run `pnpm typecheck`, `pnpm lint` and
`pnpm test` before you push. (A push to `main` builds, deploys and
smoke-tests.)

The pipeline holds one credential, GitHub's own `GITHUB_TOKEN`. The
Cloudflare token and account id are brokered per run from the workspace's
Cloudflare connection; nothing provider-shaped is stored in the repository
or in GitHub.

**Deploy by hand.** Orunbase's **Deploy** button on a component, or **Run
workflow** on the CI workflow in GitHub's Actions tab (on `main`), runs
`ci.yml` for the environment and components you pick, and each one deploys
exactly as a merge would deploy it. Leave the component blank to redeploy
every component in that environment, with nothing changed: after rotating a
secret, say. A component with nothing to run in that environment (a test
suite in `prod`) is left out with a notice.

## Custom domain

The blog answers on workers.dev from its first deploy. To serve it on your
own domain, add the domain to the Cloudflare account the blog deploys into
and attach it to the Worker (dashboard → Workers & Pages →
`cms-contentful-web-prod` → Settings → Domains & Routes → Add → Custom domain),
then point Contentful's content preview URL at it. The blog renders no
absolute link to itself, so nothing else has to change; the repository
names the domain in one place, `BASE_DOMAIN` in `intent.yaml` (dev, stage
and prod), which the blog was born with as the reserved placeholder
`cms-contentful.example.com`. Replace it with your domain in the same change
that records it.
