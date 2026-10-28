import "server-only";

import { samplePost, samplePosts } from "@/lib/sample";

const POST_GRAPHQL_FIELDS = `
  slug
  title
  coverImage {
    url
  }
  date
  author {
    name
    picture {
      url
    }
  }
  excerpt
  content {
    json
    links {
      assets {
        block {
          sys {
            id
          }
          url
          description
        }
      }
    }
  }
`;

/**
 * Whether the blog has a Contentful space to read.
 *
 * Both values are inlined at BUILD time (next.config.ts `env`): a deploy takes
 * them from its environment's CONTENTFUL_SPACE_ID and CONTENTFUL_ACCESS_TOKEN
 * Orun secrets. A build without them is a blog that is not connected yet, not
 * a broken one: every query below answers from the bundled sample posts
 * (lib/sample.ts), and the layout says so. Upstream fetched with `undefined`
 * in the URL instead, and every page of a fresh deploy was a 500.
 */
export function isContentfulConfigured(): boolean {
  return Boolean(process.env.CONTENTFUL_SPACE_ID?.trim() && process.env.CONTENTFUL_ACCESS_TOKEN?.trim());
}

/**
 * Draft mode reads unpublished entries through the Content Preview API, with
 * its own token. That token is a Worker secret read at REQUEST time (README,
 * "Connecting Contentful"), never baked into the bundle.
 */
export function previewToken(): string | undefined {
  return process.env.CONTENTFUL_PREVIEW_ACCESS_TOKEN?.trim() || undefined;
}

async function fetchGraphQL(query: string, preview = false): Promise<any> {
  const token = preview ? previewToken() : process.env.CONTENTFUL_ACCESS_TOKEN;
  return fetch(`https://graphql.contentful.com/content/v1/spaces/${process.env.CONTENTFUL_SPACE_ID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query }),
    // Every page renders per request (no ISR on Workers without a cache to
    // revalidate), so the response is never cached; Contentful's CDN is the
    // cache.
    cache: "no-store",
  }).then((response) => response.json());
}

function extractPost(fetchResponse: any): any {
  return fetchResponse?.data?.postCollection?.items?.[0];
}

function extractPostEntries(fetchResponse: any): any[] {
  return fetchResponse?.data?.postCollection?.items ?? [];
}

// A slug from the URL, as a GraphQL string literal (JSON's string syntax is
// GraphQL's), so a quote in it cannot change the query.
const literal = (value: string | null) => JSON.stringify(value ?? "");

export async function getPreviewPostBySlug(slug: string | null): Promise<any> {
  if (!isContentfulConfigured()) return samplePost(slug);
  const entry = await fetchGraphQL(
    `query {
      postCollection(where: { slug: ${literal(slug)} }, preview: true, limit: 1) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    true,
  );
  return extractPost(entry);
}

export async function getAllPosts(isDraftMode: boolean): Promise<any[]> {
  if (!isContentfulConfigured()) return samplePosts();
  const entries = await fetchGraphQL(
    `query {
      postCollection(where: { slug_exists: true }, order: date_DESC, preview: ${
        isDraftMode ? "true" : "false"
      }) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    isDraftMode,
  );
  return extractPostEntries(entries);
}

export async function getPostAndMorePosts(slug: string, preview: boolean): Promise<any> {
  if (!isContentfulConfigured()) {
    return {
      post: samplePost(slug),
      morePosts: samplePosts().filter((p) => p.slug !== slug).slice(0, 2),
    };
  }
  const entry = await fetchGraphQL(
    `query {
      postCollection(where: { slug: ${literal(slug)} }, preview: ${
        preview ? "true" : "false"
      }, limit: 1) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    preview,
  );
  const entries = await fetchGraphQL(
    `query {
      postCollection(where: { slug_not_in: ${literal(slug)} }, order: date_DESC, preview: ${
        preview ? "true" : "false"
      }, limit: 2) {
        items {
          ${POST_GRAPHQL_FIELDS}
        }
      }
    }`,
    preview,
  );
  return {
    post: extractPost(entry),
    morePosts: extractPostEntries(entries),
  };
}
