import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  countProducts,
  fetchProductBySlug,
  fetchProducts,
} from "@/lib/products/repository";
import { isMissingRelation } from "@/lib/products/errors";
import type { DataResult } from "@/lib/result";
import type { Product } from "@/lib/products/types";

/**
 * CMS product reads.
 *
 * These run through the cookie-based client so RLS evaluates them as the signed-in staff member,
 * which is what allows staff to see unpublished products.
 */

export const CMS_PAGE_SIZE = 8;

export type CmsProductPage = {
  products: Product[];
  total: number;
  page: number;
  pageCount: number;
};

function failure(scope: string, error: unknown): DataResult<never> {
  console.error(`[cms:products] ${scope}`, error);
  // The audience here is staff, so name the cause when it is the schema rather than an outage.
  return {
    ok: false,
    error: isMissingRelation(error)
      ? "The product tables do not exist yet. Apply the migrations in supabase/migrations/ in order."
      : "The product list could not be loaded. Please try again.",
  };
}

export async function getCmsProducts(
  requestedPage: number,
): Promise<DataResult<CmsProductPage>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured for this environment." };

  try {
    const total = await countProducts(supabase, { publishedOnly: false });
    const pageCount = Math.max(1, Math.ceil(total / CMS_PAGE_SIZE));
    const page = Math.min(Math.max(1, requestedPage), pageCount);

    const products = await fetchProducts(supabase, {
      publishedOnly: false,
      limit: CMS_PAGE_SIZE,
      offset: (page - 1) * CMS_PAGE_SIZE,
    });

    return { ok: true, data: { products, total, page, pageCount } };
  } catch (error) {
    return failure("Failed to load the product page", error);
  }
}

export async function getCmsProductBySlug(
  slug: string,
): Promise<DataResult<Product | null>> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured for this environment." };

  try {
    const product = await fetchProductBySlug(supabase, slug, { publishedOnly: false });
    return { ok: true, data: product };
  } catch (error) {
    return failure(`Failed to load product "${slug}"`, error);
  }
}
