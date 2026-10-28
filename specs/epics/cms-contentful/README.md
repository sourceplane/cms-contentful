# cms-contentful — Vercel's Next.js Blog with Draft Mode (Contentful) on Cloudflare Workers

**The template's Next.js blog, rendered on request by one Cloudflare Worker
from a Contentful space — its static assets beside it, draft mode through
the Content Preview API — deployed by Orun to stage and prod on every merge,
live before its owner has a space at all, and the baseline that makes a copy
of it somebody else's blog in one landing.**

| | |
|---|---|
| Status | In progress — CC0 on main |
| Upstream | [vercel/next.js `examples/cms-contentful`](https://github.com/vercel/next.js/tree/canary/examples/cms-contentful) (MIT), at `7356b0b` (2026-10-28) |
| Reference | [cms-sanity](https://github.com/sourceplane/cms-sanity) — the same scaffolding, tests and bootstrap, and the unconnected sample mode this blog copies |
| Key | `CC` |

## Read in this order

1. [design.md](design.md) — the template, how each Vercel piece maps to
   Cloudflare, the unconnected blog, the repository and the build, and the
   alternative rejected.
2. [implementation-plan.md](implementation-plan.md) — the milestones and
   what each one lands.
3. [risks-and-open-questions.md](risks-and-open-questions.md) — what is not
   proven, and what was accepted.
4. [IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md) — what shipped, and
   every departure from the upstream template.

## Milestones

| Milestone | What it lands | Task |
|---|---|---|
| CC0 — the spec | the repository, its intent, CI, tooling and spec index; this doc set | CC-1 |
| CC1 — the blog on Workers | the template in `apps/web`, built by OpenNext into one Worker, with its unconnected sample mode; `tests/web` | CC-2 |
| CC2 — a baseline | the console card, the build document, the context pack and the baseline's tests | CC-3 |
