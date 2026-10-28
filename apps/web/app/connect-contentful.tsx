import Link from "next/link";

/**
 * Shown above every page while the build has no Contentful space: the posts
 * below it are the bundled samples (lib/sample.ts), and this says so, and where
 * the steps to connect a space are. Gone once one is set.
 */
export default function ConnectContentfulNotice() {
  return (
    <div
      role="status"
      data-contentful-notice="unconnected"
      className="border-b border-amber-200 bg-amber-50 text-amber-950"
    >
      <p className="container mx-auto px-5 py-3 text-center text-sm">
        <strong>Sample content.</strong> This blog is not connected to a Contentful space yet.{" "}
        <Link href="/posts/connect-your-contentful-space" className="font-semibold underline hover:text-amber-700">
          Connect your Contentful space
        </Link>{" "}
        to publish your own posts.
      </p>
    </div>
  );
}
