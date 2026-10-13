/**
 * Date handling for crawler-facing files.
 *
 * Kept out of `app/sitemap.ts` because a route module cannot be imported by the test runner without
 * dragging in the whole Next runtime, and this logic is the part that can actually be wrong.
 */

/**
 * A `lastModified` that a crawler can trust.
 *
 * `Date` alone would accept an unparseable timestamp and emit `Invalid Date`, which serialises into
 * the sitemap as a value no crawler can read. A timestamp in the future is equally untrustworthy —
 * a clock-skewed record would claim the content changed tomorrow — so it is clamped to now.
 *
 * `fallback` is returned whenever the stored value cannot be used, so an entry always carries a
 * real date rather than being dropped from the sitemap.
 */
export function toLastModified(value: string | undefined, now: Date, fallback: Date): Date {
  if (!value) return fallback;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;

  return parsed.getTime() > now.getTime() ? now : parsed;
}

/**
 * The most recent of a set of timestamps, for a listing route that renders whatever is newest.
 *
 * Falls back when the set is empty or every value is unusable, so a route's `lastModified` never
 * becomes `Invalid Date` merely because the catalogue could not be read.
 */
export function mostRecent(values: Array<string | undefined>, now: Date, fallback: Date): Date {
  let newest: Date | null = null;

  for (const value of values) {
    const candidate = toLastModified(value, now, fallback);
    if (newest === null || candidate.getTime() > newest.getTime()) newest = candidate;
  }

  return newest ?? fallback;
}
