# cms-contentful — implementation plan

Three milestones, each one reviewed pull request (CC0 is the repository's
first commit), each green before it merges.

## CC0 — the spec (CC-1)

The repository is born: `intent.yaml` with the placeholder workspace
`ws_CHANGE_ME`, `ci.yml` (byte for byte turso-starter's, which plans nothing
until the workspace is set), the shared TypeScript and ESLint configuration,
the spec index, this doc set and the task contracts.

## CC1 — the blog on Workers (CC-2)

- The template's `app/`, `lib/` and configuration in `apps/web`; Next pinned
  to 16.3.8 with React 19, `@opennextjs/cloudflare` and `wrangler`.
- `next.config.ts`: the template's custom image loader, the space id and
  delivery token inlined at build, `output: 'standalone'`, the workspace
  root for the trace. `open-next.config.ts` with the static-assets
  incremental cache; `wrangler.jsonc`.
- Pages `force-dynamic`, reads `no-store`; `/api/draft` written out in place
  of the Vercel toolkit; an unknown slug a 404.
- The unconnected sample mode: `lib/sample.ts`, `public/sample`, the notice.
- `SITE_NAME` in `app/site.ts`; `EXAMPLE_URL` in `lib/constants.ts`.
- `component.yaml`: the deploy contract, the space's optional secret refs
  and the smoke. `tests/web`: the identity, the sample mode, the GraphQL
  reads, the rich-text body and the draft route.
- The README's "How it maps to Vercel".

## CC2 — a baseline (CC-3)

cms-sanity's machinery, renamed: `blueprint.yaml`, `repo-blueprint.yaml`,
`.baseline/` (identity, the product's README with "Connecting Contentful",
its AGENTS.md, task contracts), `tooling/rebrand` (the upstream link
protected), `tooling/bootstrap`, `hooks/render-deployment-docs.sh` (probing
`/` and `/api/draft`, and recording whether each blog reads a space yet),
`docs/phases/`, the context pack, `testing/` (the leak and placement gates
on this tree's files; the e2e tier reading every route the blog promises)
and `baseline.yml` / `tag.yml`.
