import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { draftModeStore, redirect } = vi.hoisted(() => ({
  draftModeStore: { isEnabled: false, enable: vi.fn(), disable: vi.fn() },
  redirect: vi.fn((url: string) => {
    throw Object.assign(new Error("NEXT_REDIRECT"), { url });
  }),
}));
vi.mock("next/headers", () => ({ draftMode: async () => draftModeStore }));
vi.mock("next/navigation", () => ({ redirect }));

const ENV = [
  "CONTENTFUL_SPACE_ID",
  "CONTENTFUL_ACCESS_TOKEN",
  "CONTENTFUL_PREVIEW_ACCESS_TOKEN",
  "CONTENTFUL_PREVIEW_SECRET",
] as const;
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ENV) {
    saved[k] = process.env[k];
    delete process.env[k];
  }
  draftModeStore.enable.mockClear();
  redirect.mockClear();
  vi.resetModules();
});
afterEach(() => {
  for (const k of ENV) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  vi.unstubAllGlobals();
});

async function get(query: string) {
  const { GET } = await import("@/app/api/draft/route");
  return GET(new Request(`https://blog.example/api/draft${query}`));
}

function connect(items: unknown[], { preview = true } = {}) {
  process.env.CONTENTFUL_SPACE_ID = "space-1";
  process.env.CONTENTFUL_ACCESS_TOKEN = "delivery-token";
  if (preview) {
    process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN = "preview-token";
    process.env.CONTENTFUL_PREVIEW_SECRET = "the-secret";
  }
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ data: { postCollection: { items } } }))));
}

describe("the draft-mode route (apps/web/app/api/draft/route.ts)", () => {
  it("refuses with the reason while the blog has no space", async () => {
    const res = await get("?secret=x&slug=y");
    expect(res.status).toBe(401);
    expect(await res.text()).toMatch(/not connected to a Contentful space/);
  });

  it("refuses with the reason while the preview token or secret is unset", async () => {
    connect([], { preview: false });
    const res = await get("?secret=x&slug=y");
    expect(res.status).toBe(401);
    expect(await res.text()).toMatch(/CONTENTFUL_PREVIEW_ACCESS_TOKEN and CONTENTFUL_PREVIEW_SECRET/);
  });

  it("refuses a wrong secret, a missing slug and an unknown post", async () => {
    connect([]);
    expect((await get("?secret=wrong&slug=a")).status).toBe(401);
    expect((await get("?secret=the-secret")).status).toBe(400);
    expect((await get("?secret=the-secret&slug=nope")).status).toBe(401);
    expect(draftModeStore.enable).not.toHaveBeenCalled();
  });

  it("enables draft mode and redirects to the post the preview API found", async () => {
    connect([{ slug: "hello-world" }]);
    await expect(get("?secret=the-secret&slug=hello-world")).rejects.toMatchObject({ url: "/posts/hello-world" });
    expect(draftModeStore.enable).toHaveBeenCalledOnce();
  });
});
