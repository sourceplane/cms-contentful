# cms-contentful — risks and open questions

| ID | Risk | State | Notes |
|---|---|---|---|
| CC-A | `baseline-v1` is not yet proven live | OPEN | Proven offline in Baseline CI, unconnected: the offline bootstrap with the blueprint's own hooks, the stage lane's own steps in a staged job tree, the blog served by `wrangler dev` and smoke-tested with the component's own command. A console bootstrap, then a space connected to it, closes it |
| CC-B | Draft mode has not met a real space | OPEN | `/api/draft` is tested with a mocked fetch and served unconnected (401); Contentful's Open preview against a real space, through the Worker, is still to do. The cookie is set on a top-level navigation, so no third-party-cookie rule applies |
| CC-C | Every page view is a GraphQL request to Contentful | ACCEPTED | The home page makes one, a post page two; Contentful's API CDN answers them, and its rate limits apply only to what the CDN misses. A busy blog's upgrade is OpenNext's R2 incremental cache with the template's tag revalidation back on |
| CC-D | Setting a secret redeploys nothing | ACCEPTED | The space id and token are read at build; the owner redeploys by hand or with the `# orun: redeploy` stamp in `apps/web/component.yaml` (README, "Connecting Contentful") |
| CC-E | The delivery token is inlined into the Worker's server bundle | ACCEPTED | It reads published content only — Contentful's own guidance treats a Content Delivery API token as safe for client code — and only `server-only` code names it, so no browser receives it. The preview token, which reads drafts, is a Worker secret read at request time |
| CC-F | `/api/revalidate` has nothing to revalidate | ACCEPTED | Kept as upstream, checking its secret; with every page rendered on request a published post is live on the next visit with no webhook |
| CC-G | Next 16.3.8 and React 19, not upstream's `next: latest` and React 18 | ACCEPTED | `latest` resolves to 16.4, which OpenNext does not support yet; the Contentful renderer is on its React 19 line (16.x) |
| CC-H | A wrong space id or token shows an empty blog | ACCEPTED | The GraphQL error answers no posts: the home page renders with none, a post page is a 404 (upstream: a 500). BOOTSTRAP.md's troubleshooting names the causes |
| CC-I | stack-tectonic 0.19.0, not 0.20.0 | ACCEPTED | 0.20.0's lane-shared install links each job's `node_modules` out of its tree, which Turbopack refuses |
