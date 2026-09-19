import type { MetadataRoute } from "next";
import { getPublishedProductSlugs } from "@/lib/products/queries";
import { getSiteUrl } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const lastModified = new Date();

  const entries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${siteUrl}/products`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const slugs = await getPublishedProductSlugs();
  if (slugs.ok) {
    for (const slug of slugs.data) {
      entries.push({
        url: `${siteUrl}/products/${slug}`,
        lastModified,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } else {
    // Never emit URLs that cannot be verified; report and publish the static routes only.
    console.error("[sitemap] Product URLs omitted:", slugs.error);
  }

  return entries;
}
