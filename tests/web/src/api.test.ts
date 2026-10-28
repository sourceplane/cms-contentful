import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `server-only` throws outside a React Server Components bundler; lib/api.ts
// imports it for the guarantee, not for behaviour.
vi.mock("server-only", () => ({}));

const ENV = [
  "CONTENTFUL_SPACE_ID",
  "CONTENTFUL_ACCESS_TOKEN",
  "CONTENTFUL_PREVIEW_ACCESS_TOKEN",
] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  vi.resetModules();
});
afterEach(() => {
  for (const k of ENV) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.unstubAllGlobals();
});

describe("an unconnected blog (no space at build time)", () => {
  it("is unconnected without a space id and a delivery token — one alone is not enough", async () => {
    const api = await import("@/lib/api");
    expect(api.isContentfulConfigured()).toBe(false);
    process.env.CONTENTFUL_SPACE_ID = "space";
    expect(api.isContentfulConfigured()).toBe(false);
    process.env.CONTENTFUL_ACCESS_TOKEN = "token";
    expect(api.isContentfulConfigured()).toBe(true);
  });

  it("answers every query from the sample posts, and never calls Contentful", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const api = await import("@/lib/api");
    const all = await api.getAllPosts(false);
    expect(all.map((p) => p.slug)).toEqual([
      "connect-your-contentful-space",
      "draft-mode-on-cloudflare",
      "rendered-at-the-edge",
    ]);
    const dates = all.map((p) => Date.parse(p.date));
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
    const { post, morePosts } = await api.getPostAndMorePosts("draft-mode-on-cloudflare", false);
    expect(post.title).toBe("Draft mode, on Cloudflare");
    expect(morePosts.map((p: { slug: string }) => p.slug)).toEqual([
      "connect-your-contentful-space",
      "rendered-at-the-edge",
    ]);
    expect((await api.getPostAndMorePosts("no-such-post", false)).post).toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("gives every sample the shape the pages read", async () => {
    const { samplePosts } = await import("@/lib/sample");
    for (const p of samplePosts()) {
      expect(p.coverImage.url, p.slug).toMatch(/^\/sample\/.+\.svg$/);
      expect(p.author.picture.url).toBe("/sample/avatar.svg");
      expect(p.excerpt.length, p.slug).toBeGreaterThan(20);
      expect(p.content.json.nodeType).toBe("document");
      expect(p.content.json.content.length, p.slug).toBeGreaterThan(0);
      expect(p.content.links.assets.block).toEqual([]);
    }
  });
});

describe("a connected blog (lib/api.ts against Contentful's GraphQL API)", () => {
  function connect(response: unknown) {
    process.env.CONTENTFUL_SPACE_ID = "space-1";
    process.env.CONTENTFUL_ACCESS_TOKEN = "delivery-token";
    process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN = "preview-token";
    const fetch = vi.fn(async () => new Response(JSON.stringify(response)));
    vi.stubGlobal("fetch", fetch);
    return fetch;
  }

  it("reads published posts with the delivery token, uncached", async () => {
    const fetch = connect({ data: { postCollection: { items: [{ slug: "a" }, { slug: "b" }] } } });
    const api = await import("@/lib/api");
    expect(await api.getAllPosts(false)).toEqual([{ slug: "a" }, { slug: "b" }]);
    const [url, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://graphql.contentful.com/content/v1/spaces/space-1");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer delivery-token");
    expect(init.cache).toBe("no-store");
    expect(JSON.parse(String(init.body)).query).toMatch(/preview: false/);
  });

  it("reads drafts with the preview token in draft mode", async () => {
    const fetch = connect({ data: { postCollection: { items: [] } } });
    const api = await import("@/lib/api");
    expect(await api.getAllPosts(true)).toEqual([]);
    const [, init] = fetch.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer preview-token");
    expect(JSON.parse(String(init.body)).query).toMatch(/preview: true/);
  });

  it("quotes a slug from the URL, so it cannot change the query", async () => {
    const fetch = connect({ data: { postCollection: { items: [] } } });
    const api = await import("@/lib/api");
    await api.getPostAndMorePosts('x" } } evil { "', false);
    const query = JSON.parse(String((fetch.mock.calls[0] as unknown as [string, RequestInit])[1].body)).query;
    expect(query).toContain('slug: "x\\" } } evil { \\""');
  });
});
