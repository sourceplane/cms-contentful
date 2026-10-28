# cms-contentful — decisions

The choices that shape this repository, one line each, with where the full
reasoning lives. Superseded decisions stay listed, marked, so the history
reads in order.

| # | Decision | Why | Source |
|---|---|---|---|
| 1 | OpenNext on Workers + Static Assets (`cloudflare-workers-assets-turbo`), the static-assets incremental cache; no R2 or Durable Object cache | Nothing in the Worker is revalidated | `specs/epics/cms-contentful/design.md` §2 |
| 2 | Pages `force-dynamic`, no `generateStaticParams`, reads `no-store`; Contentful's API CDN is the cache | Tag revalidation needs a writable cache, and a build-time fetch needs a space a fresh product lacks | design.md §7, risk CC-C |
| 3 | The unconnected blog: no space id or delivery token at build serves bundled samples, a notice and draft mode's 401 — nothing throws | The platform brokers Cloudflare, not Contentful, so a bootstrap deploys before the owner has a space (cms-sanity's pattern) | design.md §3 |
| 4 | The space id and delivery token are `optionalSecretEnv`, read at build and inlined into the server bundle; the preview token and the preview and revalidate secrets are Worker secrets | A required ref fails the lane before its first step on a fresh product; the delivery token reads published content only; a deploy never touches a Worker secret | risk CC-E |
| 5 | `/api/draft` written out in place of `@contentful/vercel-nextjs-toolkit` | The toolkit authorises with Vercel's protection-bypass token | design.md §2 |
| 6 | The content-model import stays a person's step (`pnpm --filter @app/web run setup`) | It needs a management token only the space's owner holds — as cms-sanity's `sanity init` | design.md §6 |
| 7 | Setting a Contentful secret redeploys nothing; the owner redeploys by hand or with the `# orun: redeploy` stamp | `orun plan --changed` plans a component only when its files change | risk CC-D |
| 8 | Next 16.3.8, React 19 | OpenNext supports 16.3, not 16.4 (`latest`) | risk CC-G |
| 9 | Two phases, one landing (`01-product`, `02-docs`), no infra component | A landing has a fixed cost (cirrus-baseline since baseline-v22); the blog provisions nothing | design.md §5 |
| 10 | `ci.yml` plans nothing while `intent.yaml` names `ws_CHANGE_ME`; stack-tectonic 0.19.0, not 0.20.0 | A bootstrap cannot set a repository variable; Turbopack refuses 0.20.0's out-of-tree `node_modules` | risk CC-I |
| 11 | Component docs are generated from the manifests and checked in CI | A hand-written copy of the dependency graph and bindings drifts silently | `tooling/catalog/gen-component-docs.py` |
| 12 | The workers.dev subdomain is read from the Cloudflare connection; the console asks for no domain, and an empty `productdomain` brands the placeholder `<reponame>.example.com` | One right answer for the subdomain; a domain is an owner's step after the bootstrap | `blueprint.yaml`, `tooling/rebrand/rebrand.mjs` |
