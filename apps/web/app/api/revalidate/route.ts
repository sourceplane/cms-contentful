import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

// Contentful's publish webhook, as upstream (the `x-vercel-reval-key` header
// carries CONTENTFUL_REVALIDATE_SECRET, a Worker secret). On Workers every
// page renders per request, so there is no cached page for the tag to
// refresh: the route still checks the secret and answers as upstream does,
// and a webhook pointed at it does no harm.

export async function POST(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const secret = requestHeaders.get("x-vercel-reval-key");

  if (secret !== process.env.CONTENTFUL_REVALIDATE_SECRET) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  revalidateTag("posts", "max");

  return NextResponse.json({ revalidated: true, now: Date.now() });
}
