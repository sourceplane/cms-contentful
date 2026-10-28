# Epics

Orun-style work programs. Each epic is a folder carrying `epic.yaml` (the
declaration the platform reads: slug, key prefix, milestones with exit
criteria and task keys) beside its doc set. The pull request that adds the
folder is the adoption; the merge creates the epic in the workspace.

| Epic | Cluster | Status | What it is |
|------|---------|--------|------------|
| [`cms-contentful/`](./cms-contentful/) | **CC** | In progress (CC0) | Vercel's Next.js Blog with Draft Mode (Contentful) on Cloudflare Workers + Static Assets through OpenNext, deployable before a Contentful space exists, and an Orun baseline that instantiates it in one landing (CC2) |

As-built ≠ intent: what shipped lives in each epic's `IMPLEMENTATION-STATUS.md`.
