import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product, ProductContentSection, ProductImage } from "@/lib/products/types";

/**
 * Shared row mapping and column selection for the `products` aggregate.
 * Kept in one place so public reads, CMS reads and mutations stay consistent.
 */

export const PRODUCT_SELECT = [
  "id",
  "title",
  "slug",
  "description",
  "tags",
  "image_url",
  "image_alt",
  "card_image_url",
  "card_image_alt",
  "acquisition",
  "locations",
  "cta_label",
  "published",
  "created_at",
  "updated_at",
  "product_content_sections(id, sort_order, heading, body, product_content_section_images(sort_order, url, alt))",
].join(",");

type SectionImageRow = {
  sort_order: number;
  url: string;
  alt: string | null;
};

type SectionRow = {
  id: string;
  sort_order: number;
  heading: string;
  body: string;
  product_content_section_images: SectionImageRow[] | null;
};

export type ProductRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[] | null;
  image_url: string | null;
  image_alt: string | null;
  card_image_url: string | null;
  card_image_alt: string | null;
  acquisition: string;
  locations: string;
  cta_label: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  product_content_sections: SectionRow[] | null;
};

function mapImages(rows: SectionImageRow[] | null): ProductImage[] {
  return (rows ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => ({ url: image.url, alt: image.alt ?? "" }));
}

function mapSection(row: SectionRow): ProductContentSection {
  return {
    heading: row.heading,
    body: row.body,
    images: mapImages(row.product_content_section_images),
  };
}

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    tags: row.tags ?? [],
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    cardImageUrl: row.card_image_url ?? undefined,
    cardImageAlt: row.card_image_alt ?? undefined,
    acquisition: row.acquisition,
    locations: row.locations,
    ctaLabel: row.cta_label,
    published: row.published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    contentSections: (row.product_content_sections ?? [])
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(mapSection),
  };
}

/**
 * Postgres unique-violation. Used to turn a duplicate slug into a field error.
 */
export function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}

export type ProductListOptions = {
  publishedOnly: boolean;
  limit?: number;
  offset?: number;
};

/**
 * Reads the product aggregate through the supplied client, so the caller decides whether the
 * query runs as the anonymous public role or as the signed-in staff role.
 */
export async function fetchProducts(
  client: SupabaseClient,
  { publishedOnly, limit, offset }: ProductListOptions,
): Promise<Product[]> {
  let query = client
    .from("products")
    .select(PRODUCT_SELECT)
    .order("title", { ascending: true });

  if (publishedOnly) query = query.eq("published", true);
  if (typeof offset === "number" && typeof limit === "number") {
    query = query.range(offset, offset + limit - 1);
  } else if (typeof limit === "number") {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as unknown as ProductRow[]).map(mapProduct);
}

/**
 * Counts matching products without transferring any rows. Kept separate from `fetchProducts` so a
 * list read never pays for a `COUNT(*)` it does not use.
 */
export async function countProducts(
  client: SupabaseClient,
  { publishedOnly }: { publishedOnly: boolean },
): Promise<number> {
  let query = client.from("products").select("id", { count: "exact", head: true });
  if (publishedOnly) query = query.eq("published", true);

  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

/**
 * Reads a single product by slug. Returns `null` when no row matches, which the pages turn into
 * a 404 rather than an empty screen.
 */
export async function fetchProductBySlug(
  client: SupabaseClient,
  slug: string,
  { publishedOnly }: { publishedOnly: boolean },
): Promise<Product | null> {
  let query = client.from("products").select(PRODUCT_SELECT).eq("slug", slug);
  if (publishedOnly) query = query.eq("published", true);

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data as unknown as ProductRow) : null;
}
