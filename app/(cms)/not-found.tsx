import Link from "next/link";

/**
 * Not-found boundary for the CMS.
 *
 * `notFound()` raised by a CMS screen (for example an edit path whose slug does not exist) lands
 * here rather than on the public 404, so the visitor keeps the CMS shell and a route back to the
 * product list.
 */
export default function CmsNotFound() {
  return (
    <section className="space-y-4">
      <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--text-muted)]">
        404
      </p>
      <h1 className="text-lg font-bold">That page could not be found</h1>
      <p className="max-w-prose text-xs text-[var(--text-muted)]">
        The path may be incorrect, or the product may have been renamed, unpublished or
        removed.
      </p>
      <Link
        href="/cms/products"
        className="inline-flex rounded-[var(--radius-chip)] bg-[var(--cms-surface)] px-3 py-1 text-[10px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
      >
        Back to Product List
      </Link>
    </section>
  );
}
