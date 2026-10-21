import { HOMEPAGE_DEFAULTS } from "@/lib/content/defaults";
import { fetchHomepage } from "@/lib/content/repository";
import { BUSINESS_FEATURE_COUNT, SHOWCASE_TILE_COUNT } from "@/lib/content/validation";
import type { HomepageContent } from "@/lib/content/types";
import { isMissingRelation } from "@/lib/products/errors";
import { getSupabasePublicClient } from "@/lib/supabase/public";
import type { DataResult } from "@/lib/result";

/**
 * Public homepage reads.
 *
 * Anonymous and cookie-free, like `lib/products/queries.ts`, so the landing page stays cacheable. The
 * CMS reads through its own module (`lib/content/cms.ts`), which needs the signed-in session.
 *
 * The public route is the one place in this project that renders repository defaults instead of an
 * unavailable state. That is a deliberate exception with a cost, recorded in
 * `docs/DEVELOPMENT-PHASES.md` §1.1 (D10): the front page must not disappear because one query
 * failed. Every other read still fails honestly.
 */

export const HOMEPAGE_NOT_CONFIGURED =
  "The homepage content is not connected in this environment.";

export const HOMEPAGE_NOT_SET_UP =
  "The homepage content table does not exist yet. Apply the migrations in supabase/migrations/ in order.";

export const HOMEPAGE_UNAVAILABLE = "The homepage content could not be loaded.";

/**
 * Repairs a stored record whose fixed groups are the wrong length.
 *
 * The form cannot produce 11 cells or 8 tiles, but a hand-edited row can, and half a grid is worse
 * than the copy that shipped. A missing group is replaced wholesale from the defaults and reported,
 * so the fault is visible in the logs rather than only on the page.
 */
export function completeContent(content: HomepageContent): HomepageContent {
  const repaired = { ...content };

  if (repaired.businessFeatures.length !== BUSINESS_FEATURE_COUNT) {
    console.warn(
      `[homepage] Expected ${BUSINESS_FEATURE_COUNT} business cells, found ${repaired.businessFeatures.length}. Rendering the built-in copy for that grid.`,
    );
    repaired.businessFeatures = HOMEPAGE_DEFAULTS.businessFeatures;
  }

  if (repaired.showcaseTiles.length !== SHOWCASE_TILE_COUNT) {
    console.warn(
      `[homepage] Expected ${SHOWCASE_TILE_COUNT} showcase tiles, found ${repaired.showcaseTiles.length}. Rendering the built-in copy for the showcase.`,
    );
    repaired.showcaseTiles = HOMEPAGE_DEFAULTS.showcaseTiles;
  }

  if (repaired.logos.length === 0) {
    console.warn("[homepage] No client logos stored. Rendering the built-in logo strip.");
    repaired.logos = HOMEPAGE_DEFAULTS.logos;
  }

  if (repaired.stories.length === 0) {
    console.warn("[homepage] No success stories stored. Rendering the built-in carousel.");
    repaired.stories = HOMEPAGE_DEFAULTS.stories;
  }

  return repaired;
}

/** The stored record, or null when nothing has been saved yet. Public (anonymous) read. */
export async function getHomepageContent(): Promise<DataResult<HomepageContent | null>> {
  const client = getSupabasePublicClient();
  if (!client) return { ok: false, error: HOMEPAGE_NOT_CONFIGURED };

  try {
    const content = await fetchHomepage(client);
    return { ok: true, data: content ? completeContent(content) : null };
  } catch (error) {
    console.error("[homepage] Failed to load the public homepage content", error);
    return {
      ok: false,
      error: isMissingRelation(error) ? HOMEPAGE_NOT_SET_UP : HOMEPAGE_UNAVAILABLE,
    };
  }
}

/**
 * What the marketing routes render.
 *
 * The defaults stand in for an unconfigured project, a missing table and an outage alike. Each of
 * those logs, so the difference is visible in the server output even though the visitor only ever
 * sees a complete page.
 */
export async function getHomepageContentOrDefault(): Promise<HomepageContent> {
  const result = await getHomepageContent();
  if (!result.ok) {
    console.warn(`[homepage] ${result.error} Rendering the built-in copy.`);
    return HOMEPAGE_DEFAULTS;
  }
  return result.data ?? HOMEPAGE_DEFAULTS;
}
