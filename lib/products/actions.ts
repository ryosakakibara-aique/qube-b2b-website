"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { upsertMockProduct } from "@/lib/products/mock-data";
import type { ProductActionState } from "@/lib/products/types";

function requiredValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

export async function signIn(
  _: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const email = requiredValue(formData, "email");
  const password = requiredValue(formData, "password");
  if (!email || !password) return { error: "Enter your e-mail and password." };

  const supabase = await createSupabaseServerClient();
  if (!supabase)
    return { error: "Supabase is not configured for this environment." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Unable to sign in with those credentials." };
  redirect("/cms/products");
}

export async function saveProduct(
  _: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const title = requiredValue(formData, "title");
  const slug = requiredValue(formData, "slug");
  const description = requiredValue(formData, "description");
  if (!title || !slug || !description)
    return { error: "Title, path, and description are required." };

  const productId = requiredValue(formData, "id");
  const tags = requiredValue(formData, "tags")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    upsertMockProduct({
      id: productId || `mock-${slug}`,
      title,
      slug,
      description,
      tags,
      imageUrl: requiredValue(formData, "imageUrl") || undefined,
      imageAlt: requiredValue(formData, "imageAlt") || undefined,
      acquisition: requiredValue(formData, "acquisition"),
      locations: requiredValue(formData, "locations"),
      ctaLabel: requiredValue(formData, "ctaLabel"),
      contentSections: [1, 2, 3]
        .map((index) => ({
          heading: requiredValue(formData, `content${index}Heading`),
          body: requiredValue(formData, `content${index}Body`),
        }))
        .filter((section) => section.heading || section.body),
    });
    redirect("/cms/products");
  }

  const product = {
    title,
    slug,
    description,
    tags,
    image_url: requiredValue(formData, "imageUrl") || null,
    image_alt: requiredValue(formData, "imageAlt") || null,
    acquisition: requiredValue(formData, "acquisition"),
    locations: requiredValue(formData, "locations"),
    cta_label: requiredValue(formData, "ctaLabel"),
  };
  const query = productId
    ? supabase.from("products").update(product).eq("id", productId)
    : supabase.from("products").insert(product);
  const { error } = await query;
  if (error) return { error: "Unable to save the product." };
  redirect("/cms/products");
}
