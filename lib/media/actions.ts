"use server";

import { AuthorizationError, requireEditor } from "@/lib/auth/authorize";
import {
  extensionFor,
  getProductImageBucket,
  isAllowedImageType,
  matchesImageSignature,
  MAX_IMAGE_BYTES,
  MAX_IMAGE_SIZE_LABEL,
} from "@/lib/media/storage";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UploadImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Uploads one CMS product image to Supabase Storage and returns its public URL.
 *
 * The stored path is date-prefixed and UUID-named so uploads never collide and the bucket stays
 * browsable. Superseded files are not deleted; orphan cleanup is a separate, deliberate concern.
 */
export async function uploadProductImage(formData: FormData): Promise<UploadImageResult> {
  try {
    await requireEditor();
  } catch (error) {
    if (error instanceof AuthorizationError) return { ok: false, error: error.message };
    throw error;
  }

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

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured for this environment." };

  const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extensionFor(file.type)}`;
  const bucket = getProductImageBucket();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, bytes, { contentType: file.type, upsert: false });

  if (error) {
    console.error("[cms:media] Failed to upload product image", error);
    return { ok: false, error: "The image could not be uploaded. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return { ok: true, url: publicUrl };
}
