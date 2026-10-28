import { describe, expect, it } from "vitest";

describe("site identity (apps/web/app/site.ts)", () => {
  it("names the blog", async () => {
    const { SITE_NAME } = await import("@/app/site");
    expect(SITE_NAME.trim()).not.toBe("");
  });

  it("credits the upstream template", async () => {
    const { EXAMPLE_URL, CMS_NAME } = await import("@/lib/constants");
    expect(EXAMPLE_URL).toBe("https://github.com/vercel/next.js/tree/canary/examples/cms-contentful");
    expect(CMS_NAME).toBe("Contentful");
  });
});
