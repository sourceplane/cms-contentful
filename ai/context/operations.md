# cms-contentful — operating contract (for humans and agents)

This is the standing guide to how this blog is deployed and operated.
Instance facts (live URLs, workspace, the secrets it uses) live in
[deployment.md](deployment.md), rendered from probed reality by the
bootstrap's `02-docs` phase; this file is the contract that stays true
between deployments. It is written to give an agent with repository read
access enough context to reason about and operate the blog without any
other source.

## What this system is

A blog whose content lives in [Contentful](https://www.contentful.com),
served from Cloudflare, expressed as an Orun component-native desired-state
repo.

- **`apps/web`** — Next.js built by `@opennextjs/cloudflare` into one Worker
  plus Static Assets. `/` and `/posts/<slug>` render per request from
  Contentful's GraphQL Content API (its CDN is the cache); `/api/draft`
  turns on draft mode for Contentful's preview URL, `/api/disable-draft`
  turns it off, and `/api/revalidate` is the template's publish webhook.
- **`tests/web`** — vitest over the GraphQL reads, the rich-text body, the
  draft-mode route and the unconnected blog. No lane lints or runs the tests: a pull request
  builds and dry-deploys the blog, so run `pnpm typecheck && pnpm lint &&
  pnpm test` before you push.
- **`tooling/*`** — shared TypeScript and ESLint configuration, and the
  wrangler renderer for a deployable that comes to take wiring.

There is no infrastructure component: Contentful is a hosted service the
blog reads over HTTPS, not something this repository provisions.

Environments: **`stage`** and **`prod`** are deployed; **`dev` is
verify-only by design** — lanes build and dry-deploy, nothing deploys.

## Contentful: connected, or sample posts

The blog reads ONE Contentful space, fixed at build time (`next build`
inlines its id and Content Delivery API token into the server bundle).
Until a build has both it is **unconnected**: every page renders the sample
posts bundled in `apps/web/lib/sample.ts` under a "connect your Contentful
space" notice, and draft mode answers 401 with the reason. Nothing fails:
an unconnected blog deploys, passes its smoke test and serves.

To connect it:

```bash
# 0. once per space: the Author and Post content types (a management token,
#    used here and never stored)
CONTENTFUL_SPACE_ID=<id> CONTENTFUL_MANAGEMENT_TOKEN=<CFPAT-…> pnpm --filter @app/web run setup

# 1. per deployed environment: the space and its delivery token (the next build reads them)
orun secrets set CONTENTFUL_SPACE_ID     --env stage    # prompts for the value
orun secrets set CONTENTFUL_ACCESS_TOKEN --env stage
# …and the same with --env prod

# 2. redeploy apps/web: the values are read when it BUILDS, and setting a
#    secret builds nothing. Deploy by hand, or change the stamp on the last
#    line of apps/web/component.yaml (`# orun: redeploy <reason> <stamp>`) and merge.

# 3. draft mode: the Content Preview API token and a preview secret, as Worker
#    secrets (Cloudflare's, not Orun's — the deploy never touches them, so they survive deploys)
pnpm --filter @app/web exec wrangler secret put CONTENTFUL_PREVIEW_ACCESS_TOKEN --name cms-contentful-web-stage
pnpm --filter @app/web exec wrangler secret put CONTENTFUL_PREVIEW_SECRET       --name cms-contentful-web-stage
```

And in the space (Settings → Content preview), a preview for **Post** at
`https://cms-contentful-web-<env>.your-workers-subdomain.workers.dev/api/draft?secret=<CONTENTFUL_PREVIEW_SECRET>&slug={entry.fields.slug}`
(or the custom domain).

The space's secrets are read best-effort (`optionalSecretEnv` in
`apps/web/component.yaml`): a key nobody has stored is skipped, never a
failed lane. A wrong space id or token is not caught at build: the blog
then shows no posts (a post page is a 404), so probe `/` after connecting.

## Identity and tenancy

Every remote operation runs against ONE Orun workspace, declared in
`intent.yaml` under `execution.state.workspace` — committed, enforced, and
what CI uses. Do not remove it; headless credentials depend on it. If it
reads `ws_SET_ME`, the bootstrap had no workspace to write: set the real one
before anything else.

## How deployment works

1. Merge (or push) to `main`.
2. CI (`.github/workflows/ci.yml`) runs `orun plan --changed` — only
   components whose files changed are planned — then runs each planned lane
   with `orun run --remote-state`, authenticated by GitHub OIDC (the
   exchange resolves this repository's linked workspace server-side).
3. `apps/web` checks its committed `wrangler.jsonc` is there, builds once per
   environment with that environment's Contentful space (if any), `wrangler
   deploy` ships `cms-contentful-web-<env>`, and a smoke test fetches `/` and
   requires the blog's "More Stories" section, then requires `/api/draft` to
   refuse a request without the preview secret (401) — proof the Worker's
   server code answers.
4. `prod` deploys after `stage` has converged on the same commit
   (`environments.prod.promotion` in intent.yaml).
5. **The convergence run is the deployment.** A green run means every
   planned lane passed. Failed lanes are retried with
   `gh run rerun --failed`, which resumes the same execution.

On a pull request nothing deploys: the blog builds and dry-deploys.

Caveats that matter:

- A push that touches no component files plans zero lanes — that run is
  green and deployed nothing. Never treat "latest run green" as "blog
  converged"; probe the URLs instead.
- Published content needs no deploy: the blog reads Contentful on every
  request, so a published post shows on the next visit.
- A change to `intent.yaml`'s `environments`, or to an Orun secret, maps to
  no component and redeploys nothing on its own. Land it with a change under
  `apps/web`.

## Secrets model

- **Brokered provider secrets**: `CLOUDFLARE_API_TOKEN` (the
  `workers-deploy` scope) and `CLOUDFLARE_ACCOUNT_ID` — pointers minted per
  run from the workspace's Cloudflare connection. No long-lived values at
  rest; nothing to rotate by hand.
- **The Contentful space**: `CONTENTFUL_SPACE_ID` and
  `CONTENTFUL_ACCESS_TOKEN` on `stage` and `prod`, stored by the owner, read
  by the build. The delivery token reads published content only; kept as
  secrets so each environment can name its own space.
- **Draft mode**: `CONTENTFUL_PREVIEW_ACCESS_TOKEN` and
  `CONTENTFUL_PREVIEW_SECRET`, Worker secrets per environment, read at
  request time by `/api/draft` only; `CONTENTFUL_REVALIDATE_SECRET`, likewise,
  by `/api/revalidate`.
- Inspect by NAME only: `orun secrets list --org <ws> --env stage|prod`. No
  tooling in this repository prints a secret value, and no document in
  `ai/context/` may contain one.

## Verifying the system

```bash
# the blog on each environment (also recorded, probed, in deployment.md);
# an unconnected blog carries data-contentful-notice="unconnected"
curl -s https://cms-contentful-web-stage.your-workers-subdomain.workers.dev/ | grep -o 'data-contentful-notice="[a-z]*"'
curl -s -o /dev/null -w '%{http_code}\n' https://cms-contentful-web-prod.your-workers-subdomain.workers.dev/
curl -s -o /dev/null -w '%{http_code}\n' https://cms-contentful-web-prod.your-workers-subdomain.workers.dev/api/draft   # 401

# workspace readiness
orun secrets list --org <ws> --env stage && orun secrets list --org <ws> --env prod
orun integrations list --org <ws> --json && orun cloud check --org <ws>
```

## Common operations

| task | how |
|---|---|
| connect a Contentful space | "Contentful: connected, or sample posts" above |
| write, edit, publish | in Contentful's web app; a published entry is live on the next visit, no deploy needed |
| preview a draft | Open preview on the entry in Contentful (draft mode); `/api/disable-draft` leaves it |
| change the blog's code | edit `apps/web` (its name: `apps/web/app/site.ts`), merge |
| change the content model | in the space, then the GraphQL fields in `apps/web/lib/api.ts` to match; export it to `apps/web/lib/export.json` for the setup script |
| deploy a change | merge to `main`; watch the run; failed lanes → `gh run rerun --failed` |
| deploy by hand | Orunbase's Deploy button, or `gh workflow run ci.yml --ref main -f environment=<env> [-f component=<a,b>]` — the named components (blank: every one) run in that environment as a merge runs them; started off `main` it is refused |
| redeploy without a change | edit the last line of `apps/web/component.yaml` (`# orun: redeploy <reason> <stamp>`) and merge — it is a deploy trigger, nothing reads it |
| serve a custom domain | attach it to the Worker in Cloudflare (README, "Custom domain"), point the space's content preview URL at it, then replace the placeholder `cms-contentful.example.com` in `intent.yaml`'s `BASE_DOMAIN` (dev, stage and prod) with it |
| headless credentials | `ORUN_TOKEN` (workspace-scoped) + `GITHUB_TOKEN` |

The deployment record is the bootstrap's `02-docs` phase. Re-running it (the
Orun console's Retry on that phase, or `orun new … --phase 02-docs`)
re-probes the URLs and re-renders [deployment.md](deployment.md); it is
idempotent.

## Evolution

Structural changes follow the same contract that deployed the blog: add a
component under `apps/`, `infra/` or `packages/` with a `component.yaml`,
land it as a pull request, and the convergence run deploys it. A component
under `infra/` whose wiring the Worker reads is declared in `apps/web`'s
`dependsOn` (enforced on `main`), so it is applied first.
