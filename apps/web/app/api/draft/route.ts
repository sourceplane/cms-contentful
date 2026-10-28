import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

import { getPreviewPostBySlug, isContentfulConfigured, previewToken } from "@/lib/api";

/**
 * Contentful's preview URL: /api/draft?secret=<CONTENTFUL_PREVIEW_SECRET>&slug=<slug>.
 *
 * Upstream re-exported @contentful/vercel-nextjs-toolkit's handler, which
 * authorises the request with Vercel's deployment-protection bypass token — a
 * Vercel feature with no Cloudflare equivalent. This is the check it stands
 * for, written out: the preview secret (a Worker secret), then the post looked
 * up through the Content Preview API, then draft mode and a redirect to it.
 * Without a space, a preview token or a secret the request cannot be
 * authorised, and it is refused with the reason (401), not a 500.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const slug = searchParams.get("slug");

  if (!isContentfulConfigured()) {
    return new Response("Draft mode is unavailable: this blog is not connected to a Contentful space yet.", {
      status: 401,
    });
  }
  const expected = process.env.CONTENTFUL_PREVIEW_SECRET?.trim();
  if (!expected || !previewToken()) {
    return new Response(
      "Draft mode is unavailable: set the CONTENTFUL_PREVIEW_ACCESS_TOKEN and CONTENTFUL_PREVIEW_SECRET Worker secrets to preview drafts.",
      { status: 401 },
    );
  }
  if (secret !== expected) {
    return new Response("Invalid secret", { status: 401 });
  }
  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }
  const post = await getPreviewPostBySlug(slug);
  if (!post) {
    return new Response("Invalid slug", { status: 401 });
  }

  (await draftMode()).enable();
  redirect(`/posts/${post.slug}`);
}
