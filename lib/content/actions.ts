"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthorizationError, requireEditor } from "@/lib/auth/authorize";
import { isMissingRelation } from "@/lib/products/errors";
import { parseHomepageForm } from "@/lib/content/validation";
import type { HomepageActionState, HomepageContent } from "@/lib/content/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * The homepage save.
 *
 * An upsert on the fixed id rather than an update: the record may not exist yet, because the
 * migration seeds no row and the page renders the built-in copy until someone saves. The first save
 * is therefore also the first insert, and nothing about that is visible to the editor.
 *
 * Authorization is re-checked here and again by RLS. Success is a redirect, so the screen shows a
 * confirmation rather than a form that looks unchanged.
 */

function toHomepageRow(payload: HomepageContent) {
  return {
    id: 1,
    hero_heading: payload.heroHeading,
    hero_sub_label: payload.heroSubLabel,
    hero_link_label: payload.heroLinkLabel,
    hero_link_href: payload.heroLinkHref,
    cta_label: payload.ctaLabel,
    cta_href: payload.ctaHref,
    video_url: payload.videoUrl,
    video_title: payload.videoTitle,
    features_heading: payload.featuresHeading,
    showcase_heading: payload.showcaseHeading,
    clients_heading: payload.clientsHeading,
    business_features: payload.businessFeatures,
    showcase_tiles: payload.showcaseTiles,
    client_logos: payload.logos,
    stories: payload.stories,
  };
}

export async function saveHomepage(
  _: HomepageActionState,
  formData: FormData,
): Promise<HomepageActionState> {
  try {
    await requireEditor();
  } catch (error) {
    if (error instanceof AuthorizationError) return { error: error.message };
    throw error;
  }

  const validation = parseHomepageForm(formData);
  if (!validation.ok) {
    return {
      error: "Some fields need attention before this page can be saved.",
      fieldErrors: validation.fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: "Supabase is not configured for this environment." };

  const { error } = await supabase
    .from("homepage")
    .upsert(toHomepageRow(validation.payload), { onConflict: "id" });

  if (error) {
    console.error("[cms:homepage] Failed to save the homepage content", error);
    return {
      error: isMissingRelation(error)
        ? "The homepage table does not exist yet. Apply the migrations in supabase/migrations/ in order."
        : "The homepage could not be saved. Please try again.",
    };
  }

  // The stories also render on the catalogue, and the logo strip on `/` only — both are cached at
  // 300s, so a save has to purge them or the editor sees nothing change for five minutes.
  revalidatePath("/");
  revalidatePath("/products");
  revalidatePath("/cms/home");

  redirect("/cms/home?saved=1");
}
