/**
 * The sample posts a blog with no Contentful space renders.
 *
 * A fresh deploy has no space behind it — the space id and its delivery token
 * are the owner's to add — and it must still serve a blog, not a 500. So until
 * the build is given both (lib/api.ts), every query answers from this file,
 * in the shape the GraphQL API returns (`slug`, `title`, `coverImage.url`,
 * `date`, `author`, `excerpt`, `content.json` as a rich-text document), and
 * the layout shows a notice that the blog is not connected yet. The first post
 * says how to connect it. Once a space is set, nothing here is read.
 */
import { SITE_NAME } from "@/app/site";

type Text = { nodeType: "text"; value: string; marks: { type: string }[]; data: Record<string, never> };
type Hyperlink = { nodeType: "hyperlink"; data: { uri: string }; content: Text[] };
type Block = { nodeType: string; data: Record<string, never>; content: Array<Text | Hyperlink | Block> };

const text = (value: string, bold = false): Text => ({
  nodeType: "text",
  value,
  marks: bold ? [{ type: "bold" }] : [],
  data: {},
});
const link = (value: string, uri: string): Hyperlink => ({ nodeType: "hyperlink", data: { uri }, content: [text(value)] });
const para = (...parts: Array<string | Text | Hyperlink>): Block => ({
  nodeType: "paragraph",
  data: {},
  content: parts.map((p) => (typeof p === "string" ? text(p) : p)),
});
const heading = (value: string): Block => ({ nodeType: "heading-3", data: {}, content: [text(value)] });
const item = (...parts: Array<string | Text | Hyperlink>): Block => ({
  nodeType: "list-item",
  data: {},
  content: [para(...parts)],
});
const list = (...items: Block[]): Block => ({ nodeType: "ordered-list", data: {}, content: items });
const document = (...content: Block[]) => ({ nodeType: "document", data: {}, content });

const author = { name: SITE_NAME, picture: { url: "/sample/avatar.svg" } };

export type SamplePost = {
  slug: string;
  title: string;
  coverImage: { url: string };
  date: string;
  author: typeof author;
  excerpt: string;
  content: { json: ReturnType<typeof document>; links: { assets: { block: never[] } } };
};

function post(slug: string, title: string, date: string, excerpt: string, content: ReturnType<typeof document>): SamplePost {
  return {
    slug,
    title,
    coverImage: { url: `/sample/${slug}.svg` },
    date,
    author,
    excerpt,
    content: { json: content, links: { assets: { block: [] } } },
  };
}

const POSTS: SamplePost[] = [
  post(
    "connect-your-contentful-space",
    "Connect your Contentful space",
    "2026-10-28T09:00:00.000Z",
    "This blog is live, and the posts you are reading are samples bundled with it. Give it a Contentful space and it publishes yours instead.",
    document(
      para(
        "This blog is running on Cloudflare, but it is not connected to a Contentful space yet — so it shows these sample posts. Connecting it takes four steps, and the repository's README walks through each one.",
      ),
      heading("1. Create a space and its content model"),
      para(
        "Create a space at ",
        link("contentful.com", "https://www.contentful.com"),
        ". Then import the blog's content model — the ",
        text("Author", true),
        " and ",
        text("Post", true),
        " types — with ",
        text("pnpm --filter @app/web run setup", true),
        ", given the space id and a management token.",
      ),
      heading("2. Give each deploy the space"),
      para(
        "Store the space id and its Content Delivery API token as this repository's Orun secrets, once per environment: ",
        text("CONTENTFUL_SPACE_ID", true),
        " and ",
        text("CONTENTFUL_ACCESS_TOKEN", true),
        ". The build reads them, so redeploy the blog afterwards.",
      ),
      heading("3. Turn on draft mode (optional)"),
      para(
        "Set ",
        text("CONTENTFUL_PREVIEW_ACCESS_TOKEN", true),
        " and ",
        text("CONTENTFUL_PREVIEW_SECRET", true),
        " as Worker secrets, and point Contentful's preview URL at ",
        text("/api/draft?secret=…&slug={entry.fields.slug}", true),
        ".",
      ),
      heading("4. Write"),
      para("Publish a post in Contentful and it is on the blog with the next request — no redeploy."),
    ),
  ),
  post(
    "draft-mode-on-cloudflare",
    "Draft mode, on Cloudflare",
    "2026-10-27T09:00:00.000Z",
    "Preview unpublished posts from Contentful before they go live: a secret-checked route turns Next.js draft mode on, and drafts come from the Content Preview API.",
    document(
      para(
        "Contentful's preview button opens a post through this blog's ",
        text("/api/draft", true),
        " route. It checks the preview secret, switches on Next.js draft mode with a cookie, and sends you to the post — rendered from the Content Preview API, drafts included.",
      ),
      para(
        "Without the preview token and secret the route answers 401 and says which is missing; everything else works. ",
        text("/api/disable-draft", true),
        " switches it off again.",
      ),
    ),
  ),
  post(
    "rendered-at-the-edge",
    "Rendered at the edge",
    "2026-10-26T09:00:00.000Z",
    "Every page is rendered by a Cloudflare Worker on request, from Contentful's GraphQL API, so a published change is live on the next visit.",
    document(
      para(
        "On Vercel this template statically generated its pages and revalidated them by tag when Contentful called a webhook. Here one Worker renders every page on request, with Contentful's CDN as the cache — so there is no stale page to revalidate.",
      ),
      list(
        item("The home page lists every post, newest first."),
        item("A post page renders its rich text, its author and two more stories."),
        item("Images come from Contentful's Images API, sized by the browser's request."),
      ),
    ),
  ),
];

export function samplePosts(): SamplePost[] {
  return POSTS;
}

export function samplePost(slug: string | null): SamplePost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
