import { getSupabasePublicClient, isSupabaseConfigured } from "@/lib/supabase/public";
import { fetchProductBySlug, fetchProducts } from "@/lib/products/repository";
import {
  describeProductFailure,
  PRODUCT_NOT_CONFIGURED,
} from "@/lib/products/errors";
import type { DataResult } from "@/lib/result";
import type { Product } from "@/lib/products/types";

/**
 * Public (anonymous) product reads.
 *
 * These functions never substitute invented content for a failed query — a failure is returned so
 * the page can render an explicit unavailable state.
 */

const NOT_CONFIGURED = PRODUCT_NOT_CONFIGURED;

function unavailable(scope: string, error: unknown): DataResult<never> {
  console.error(`[products] ${scope}`, error);
  return { ok: false, error: describeProductFailure(error) };
}

export async function getPublishedProducts(): Promise<DataResult<Product[]>> {
  const client = getSupabasePublicClient();
  if (!client) return { ok: false, error: NOT_CONFIGURED };

  try {
    const products = await fetchProducts(client, { publishedOnly: true });
    return { ok: true, data: products };
  } catch (error) {
    return unavailable("Failed to load published products", error);
  }
}

export async function getPublishedProductBySlug(
  slug: string,
): Promise<DataResult<Product | null>> {
  const client = getSupabasePublicClient();
  if (!client) return { ok: false, error: NOT_CONFIGURED };

  try {
    const product = await fetchProductBySlug(client, slug, { publishedOnly: true });
    return { ok: true, data: product };
  } catch (error) {
    return unavailable(`Failed to load product "${slug}"`, error);
  }
}

/** Slugs of published products, for sitemap generation. */
export async function getPublishedProductSlugs(): Promise<DataResult<string[]>> {
  const result = await getPublishedProducts();
  if (!result.ok) return result;
  return { ok: true, data: result.data.map((product) => product.slug) };
}

export { isSupabaseConfigured };
