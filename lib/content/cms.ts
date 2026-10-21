import { HOMEPAGE_DEFAULTS } from "@/lib/content/defaults";
import { fetchHomepage } from "@/lib/content/repository";
import { completeContent } from "@/lib/content/queries";
import { HOMEPAGE_NOT_CONFIGURED, HOMEPAGE_NOT_SET_UP, HOMEPAGE_UNAVAILABLE } from "@/lib/content/queries";
import type { HomepageContent } from "@/lib/content/types";
import { isMissingRelation } from "@/lib/products/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { DataResult } from "@/lib/result";

/**
 * CMS homepage reads.
 *
 * Separate from `queries.ts` for the same reason `lib/products/cms.ts` is separate from
 * `lib/products/queries.ts`: this module needs the cookie-based client — and therefore `next/headers`
 * — while the public read must stay importable by a plain Node test and by a route that must not
 * touch cookies.
 *
 * The read runs through the signed-in user's session so RLS evaluates as that person, which is what
 * lets the result be the stored record rather than a public-only view of it.
 */

/**
 * The stored record, or the built-in copy when nothing has been saved yet.
 *
 * `saved` distinguishes the two: without it an editor would be looking at the text that ships with
 * the site while believing it is a stored record, and would not know that saving is what creates it.
 */
export async function getCmsHomepage(): Promise<
  DataResult<{ content: HomepageContent; saved: boolean }>
> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: HOMEPAGE_NOT_CONFIGURED };

  try {
    const content = await fetchHomepage(supabase);
    return {
      ok: true,
      data: {
        content: content ? completeContent(content) : HOMEPAGE_DEFAULTS,
        saved: content !== null,
      },
    };
  } catch (error) {
    console.error("[cms:homepage] Failed to load the homepage content", error);
    return {
      ok: false,
      error: isMissingRelation(error) ? HOMEPAGE_NOT_SET_UP : HOMEPAGE_UNAVAILABLE,
    };
  }
}
