import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Product } from "@/lib/products/types";
import { mockProducts } from "@/lib/products/mock-data";

type ProductRow = {
  id: string;
  title: string;
  slug: string;
  description: string;
  tags: string[] | null;
  image_url: string | null;
  image_alt: string | null;
  acquisition: string;
  locations: string;
  cta_label: string;
  product_content_sections?: Array<{
    heading: string;
    body: string;
    image_url: string | null;
    image_alt: string | null;
    sort_order: number;
  }>;
};

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    tags: row.tags ?? [],
    imageUrl: row.image_url ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    acquisition: row.acquisition,
    locations: row.locations,
    ctaLabel: row.cta_label,
    contentSections: (row.product_content_sections ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((section) => ({
        heading: section.heading,
        body: section.body,
        imageUrl: section.image_url ?? undefined,
        imageAlt: section.image_alt ?? undefined,
      })),
  };
}

export async function getProducts(): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return mockProducts;

  const { data, error } = await supabase
    .from("products")
    .select("*, product_content_sections(*)")
    .order("title");
  if (error || !data) return mockProducts;
  return (data as ProductRow[]).map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase)
    return mockProducts.find((product) => product.slug === slug) ?? null;

  const { data, error } = await supabase
    .from("products")
    .select("*, product_content_sections(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data)
    return mockProducts.find((product) => product.slug === slug) ?? null;
  return mapProduct(data as ProductRow);
}
