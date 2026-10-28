import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { Markdown } from "@/lib/markdown";
import { samplePost } from "@/lib/sample";

describe("the rich-text body", () => {
  it("renders a sample post's document", () => {
    const post = samplePost("connect-your-contentful-space");
    const html = renderToStaticMarkup(<Markdown content={post!.content as never} />);
    expect(html).toContain("<h3>1. Create a space and its content model</h3>");
    expect(html).toContain('<a href="https://www.contentful.com">contentful.com</a>');
    expect(html).toContain("<b>CONTENTFUL_SPACE_ID</b>");
  });

  it("sizes an embedded asset at Contentful, through the template's loader", () => {
    const url = "https://images.ctfassets.net/space/asset/photo.jpg";
    const content = {
      json: {
        nodeType: "document",
        data: {},
        content: [
          { nodeType: "embedded-asset-block", data: { target: { sys: { id: "a1", type: "Link", linkType: "Asset" } } }, content: [] },
        ],
      },
      links: { assets: { block: [{ sys: { id: "a1" }, url, description: "A photo" }] } },
    };
    const html = renderToStaticMarkup(<Markdown content={content} />);
    const src = html.match(/<img[^>]*src="([^"]+)"/)?.[1];
    expect(src?.replaceAll("&amp;", "&")).toMatch(new RegExp(`^${url.replaceAll(".", "\\.")}\\?w=\\d+&q=75$`));
    expect(html).toContain('alt="A photo"');
  });

  it("renders nothing for an embedded asset the response does not carry", () => {
    const content = {
      json: {
        nodeType: "document",
        data: {},
        content: [{ nodeType: "embedded-asset-block", data: { target: { sys: { id: "gone" } } }, content: [] }],
      },
      links: { assets: { block: [] } },
    };
    expect(renderToStaticMarkup(<Markdown content={content} />)).not.toContain("<img");
  });
});
