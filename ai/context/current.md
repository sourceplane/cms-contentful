# cms-contentful — where this repository stands

The entry page for anyone (or any agent) picking this repository up. It is
this repository's own state and does not ship to a blog built from it; the
two pages that do are [operations.md](operations.md) and
[deployment.md](deployment.md).

## What it is

Vercel's Next.js Blog with Draft Mode (Contentful) on Cloudflare Workers +
Static Assets (`@opennextjs/cloudflare`) — posts and authors read over
GraphQL from a Contentful space, rendered on request, with draft mode
through the Content Preview API — packaged as an Orun baseline:
`orun new --blueprint repo-blueprint.yaml` builds a new blog in its own
repository and takes it to live on stage and prod in one landing
(`01-product`), then records what went live (`02-docs`). It deploys before
its owner has a Contentful space: unconnected, the blog serves bundled
sample posts under a "connect your Contentful space" notice. There is no
infra component; Contentful stays the owner's SaaS.

## Release

| | |
|---|---|
| Latest tag | `baseline-v1` (CC2 — the baseline, one landing) |
| Proven live | No. Everything short of the platform is proven offline in Baseline CI, unconnected; a live bootstrap (risk CC-A) and a connected blog's draft mode against a real space (risk CC-B) are still to come |

## Where to read

| Question | Page |
|---|---|
| What shipped, and every departure from upstream | `specs/epics/cms-contentful/IMPLEMENTATION-STATUS.md` |
| Why it is built this way | [decisions.md](decisions.md), then `specs/epics/cms-contentful/design.md` |
| What could still go wrong | [open-risks.md](open-risks.md), then `specs/epics/cms-contentful/risks-and-open-questions.md` |
| How to instantiate it | `BOOTSTRAP.md`, `docs/phases/` |
| What each component is | `apps/web/docs/`, `tests/web/docs/` (generated; `python3 tooling/catalog/gen-component-docs.py`) |

## Next

1. Bootstrap one blog from `baseline-v1` against a workspace, and record its
   timings (closes CC-A).
2. Connect a Contentful space to it, see the samples give way, and open one
   post's Contentful preview through the Worker (closes CC-B).
