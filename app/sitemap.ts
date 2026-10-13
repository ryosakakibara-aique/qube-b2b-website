import type { MetadataRoute } from "next";
import { getPublishedProductSlugEntries } from "@/lib/products/queries";
import { mostRecent, toLastModified } from "@/lib/seo/dates";
import { getSiteUrl } from "@/lib/site";

/**
 * Five minutes, matching the product routes' own revalidation. The sitemap is built from the same
 * catalogue, so it must not outlive it by much — a longer window would let the file advertise a
 * narrower or wider catalogue than the site actually serves.
 */
export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const now = new Date();

  /*
    The building time is the floor for `lastModified`, not the answer.

    When the catalogue cannot be read, an entry still has to carry a parseable date — and the
    deployment itself is a real change to these pages, so the build time is honest here rather than
    a placeholder. It is only used when no record supplies something better.
  */
  const buildTime = now;

  const products = await getPublishedProductSlugEntries();
  if (!products.ok) {
    // Never emit URLs that cannot be verified; report and publish the static routes only.
    console.error("[sitemap] Product URLs omitted:", products.error);
  }

  const entriesForProducts = products.ok ? products.data : [];

  /*
    `/` and `/products` both render product content, so the newest product edit genuinely changes
    them. Without this they would claim to have changed at every rebuild and never at a content
    edit — the same false signal the per-product entries used to carry.
  */
  const listingLastModified = mostRecent(
    entriesForProducts.map((product) => product.updatedAt),
    now,
    buildTime,
  );

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}/`,
      lastModified: listingLastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: listingLastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  for (const product of entriesForProducts) {
    entries.push({
      url: `${siteUrl}/products/${product.slug}`,
      lastModified: toLastModified(product.updatedAt, now, buildTime),
      // A product page is a durable description rather than a feed, so it is not expected to change
      // on a schedule. The per-record `lastModified` is what actually signals an edit; this hint
      // stays conservative to match.
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  return entries;
}
