# apps/web — the blog

A blog whose content lives in Contentful, from Vercel's
[Next.js Blog with Draft Mode (Contentful)](https://github.com/vercel/next.js/tree/canary/examples/cms-contentful)
(MIT), running on Cloudflare Workers + Static Assets:

- Posts and authors in a Contentful space, read over its GraphQL Content API
  (`lib/api.ts`), the post body a rich-text field rendered with
  `@contentful/rich-text-react-renderer` (`lib/markdown.tsx`)
- Draft mode: Contentful's preview URL (`/api/draft?secret=…&slug=…`) turns
  it on, and drafts come from the Content Preview API; `/api/disable-draft`
  turns it off
- Every page rendered on request by the Worker, from Contentful's API CDN
- Tailwind 3, Inter, images from Contentful's Images API sized by the
  browser's request (`lib/contentful-image.tsx`)

With no space id and delivery token at build time the blog is
**unconnected**: it renders the sample posts in `lib/sample.ts` under a
notice that says how to connect. The blog's name is in `app/site.ts`.

```bash
pnpm dev        # next dev on http://localhost:3000
pnpm build      # next build + opennextjs-cloudflare build → .open-next/
pnpm preview    # wrangler dev over the built Worker
CONTENTFUL_SPACE_ID=<id> CONTENTFUL_MANAGEMENT_TOKEN=<token> pnpm run setup   # import the Author and Post content types
```

How it is connected to a Contentful space and deployed — per environment, on
merge to `main` — is the repository's README and `component.yaml` beside
this file.
