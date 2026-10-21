"use server";

import { AuthorizationError, requireEditor } from "@/lib/auth/authorize";
import {
  extensionFor,
  getProductImageBucket,
  getSiteImageBucket,
  isAllowedImageType,
  isAllowedSiteImageType,
  matchesImageSignature,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_SIZE_LABEL,
  SITE_IMAGE_BYTES,
  SITE_IMAGE_SIZE_LABEL,
} from "@/lib/media/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UploadImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Stores one file and returns its public URL.
 *
 * The stored path is date-prefixed and UUID-named so uploads never collide and the bucket stays
 * browsable. Superseded files are not deleted; orphan cleanup is a separate, deliberate concern.
 */
async function storeImage(
  bytes: Uint8Array,
  contentType: string,
  extension: string,
  bucket: string,
  scope: string,
): Promise<UploadImageResult> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured for this environment." };

  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType, upsert: false });

  if (error) {
    console.error(`[cms:media] Failed to upload ${scope}`, error);
    return { ok: false, error: "The image could not be uploaded. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return { ok: true, url: publicUrl };
}

async function denied(): Promise<UploadImageResult | null> {
  try {
    await requireEditor();
    return null;
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, error: error.message };
    throw error;
  }
}

/** Uploads one CMS product image to Supabase Storage and returns its public URL. */
export async function uploadProductImage(formData: FormData): Promise<UploadImageResult> {
  const refusal = await denied();
  if (refusal) return refusal;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image to upload." };
  }
  if (!isAllowedImageType(file.type)) {
    return { ok: false, error: "Upload a PNG, JPEG or WebP image." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: `Images must be ${MAX_IMAGE_SIZE_LABEL} or smaller.` };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesImageSignature(bytes, file.type)) {
    return { ok: false, error: "That file does not look like a valid image." };
  }

  return storeImage(
    bytes,
    file.type,
    extensionFor(file.type),
    getProductImageBucket(),
    "product image",
  );
}

/**
 * Uploads one homepage image — a client logo, a showcase tile or a story photograph.
 *
 * PNG only, 2 MB, and the same signature check as the product upload: the declared MIME type comes
 * from the client and cannot be trusted on its own. The bucket enforces the same two rules, so a
 * request that gets past this still cannot store a JPEG or an oversized file.
 */
export async function uploadSiteImage(formData: FormData): Promise<UploadImageResult> {
  const refusal = await denied();
  if (refusal) return refusal;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image to upload." };
  }
  if (!isAllowedSiteImageType(file.type)) {
    return { ok: false, error: "Homepage images must be PNG files." };
  }
  if (file.size > SITE_IMAGE_BYTES) {
    return {
      ok: false,
      error: `Homepage images must be ${SITE_IMAGE_SIZE_LABEL} or smaller.`,
    };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!matchesImageSignature(bytes, file.type)) {
    return { ok: false, error: "That file does not look like a valid PNG." };
  }

  return storeImage(bytes, file.type, "png", getSiteImageBucket(), "homepage image");
}
