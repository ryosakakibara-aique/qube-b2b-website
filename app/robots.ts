import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

/**
 * Crawler rules.
 *
 * The origin comes from `getSiteUrl()` rather than a direct `process.env` read, so the `Sitemap:`
 * line can never disagree with the canonical URLs the site publishes. That disagreement was real:
 * reading the variable directly left this file falling back to `http://localhost:3000` on a
 * production build that was missing it, advertising a sitemap on a host that does not exist while
 * every canonical pointed at the real one.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The CMS is authenticated, carries no public content and sets `noindex` on its own routes.
      // Excluding it here as well keeps crawlers out of the sign-in flow entirely.
      disallow: "/cms/",
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
