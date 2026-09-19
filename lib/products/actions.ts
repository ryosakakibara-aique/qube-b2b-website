"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requireEditor } from "@/lib/auth/authorize";
import { isUniqueViolation } from "@/lib/products/repository";
import { parseProductForm } from "@/lib/products/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ProductActionState } from "@/lib/products/types";

/**
 * CMS product mutations.
 *
 * Every mutation re-checks authorization server-side; RLS is the final authority and will reject
 * anything these guards miss.
 */

function revalidateProductViews(slug: string) {
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/cms/products");
}

async function guardEditor(): Promise<ProductActionState | null> {
  try {
    await requireEditor();
    return null;
  } catch (error) {
    if (error instanceof AuthorizationError) return { error: error.message };
    throw error;
  }
}

export async function signIn(
  _: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your e-mail and password." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured for this environment." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Unable to sign in with those credentials." };

  redirect("/cms/products");
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/cms/login");
}

export async function saveProduct(
  _: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const denied = await guardEditor();
  if (denied) return denied;

  const validation = parseProductForm(formData);
  if (!validation.ok) {
    return {
      error: "Some fields need attention before this product can be saved.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured for this environment." };

  const { payload } = validation;
  const { error } = await supabase.rpc("save_product_content", {
    p_id: payload.id,
    p_title: payload.title,
    p_slug: payload.slug,
    p_description: payload.description,
    p_tags: payload.tags,
    p_image_url: payload.imageUrl,
    p_image_alt: payload.imageAlt,
    p_acquisition: payload.acquisition,
    p_locations: payload.locations,
    p_cta_label: payload.ctaLabel,
    p_published: payload.published,
    p_sections: payload.sections,
  });

  if (error) {
    if (isUniqueViolation(error)) {
      return {
        error: "That path is already used by another product.",
        fieldErrors: { slug: "This path is already in use." },
      };
    }
    console.error("[cms:products] Failed to save product", error);
    return { error: "The product could not be saved. Please try again." };
  }

  revalidateProductViews(payload.slug);
  redirect(`/cms/products?saved=${encodeURIComponent(payload.slug)}`);
}

export async function setProductPublished(
  _: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  const denied = await guardEditor();
  if (denied) return denied;

  const id = String(formData.get("id") ?? "");
  const slug = String(formData.get("slug") ?? "");
  const published = String(formData.get("published") ?? "") === "true";
  if (!id) return { error: "The product could not be identified." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured for this environment." };

  const { error } = await supabase
    .from("products")
    .update({ published })
    .eq("id", id);

  if (error) {
    console.error("[cms:products] Failed to change publication state", error);
    return { error: "The product status could not be changed. Please try again." };
  }

  if (slug) revalidateProductViews(slug);
  return { success: published ? "Product published." : "Product moved back to draft." };
}
