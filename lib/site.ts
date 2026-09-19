export const SITE_NAME = "QUBE Smart Lockers";

export const SITE_DESCRIPTION = "Smart locker products for connected businesses.";

/**
 * The production origin.
 *
 * Used only when `NEXT_PUBLIC_SITE_URL` is missing from a production build, so a forgotten variable
 * degrades to the correct host instead of canonicalising every page, Open Graph tag and sitemap entry
 * to localhost. Local development still falls back to localhost.
 */
export const PRODUCTION_SITE_URL = "https://business.qubesmartlockers.com";

const LOCAL_SITE_URL = "http://localhost:3000";

/**
 * Resolves the canonical origin from a configured value.
 *
 * Pure so the production fallback can be tested without mutating `NODE_ENV`. `NEXT_PUBLIC_SITE_URL`
 * wins when set; anything but an origin in that value is reported and ignored, so a stray path can
 * never end up inside a canonical URL.
 */
export function resolveSiteUrl(
  raw: string | undefined,
  isProduction: boolean,
): string {
  const value = raw?.trim();
  if (value) {
    try {
      return new URL(value).origin;
    } catch {
      console.warn(`[site] NEXT_PUBLIC_SITE_URL is not a valid URL: ${value}`);
    }
  }

  if (isProduction) {
    console.warn(
      `[site] NEXT_PUBLIC_SITE_URL is not set. Falling back to ${PRODUCTION_SITE_URL} for canonical URLs, Open Graph and the sitemap.`,
    );
    return PRODUCTION_SITE_URL;
  }

  return LOCAL_SITE_URL;
}

/** Canonical public origin for this request's build. */
export function getSiteUrl(): string {
  return resolveSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NODE_ENV === "production",
  );
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
