/**
 * Product media rules.
 *
 * Uploads are restricted to raster formats: SVG is excluded deliberately, because a public bucket
 * would then serve attacker-controlled markup from an origin the site links to.
 */

export const DEFAULT_PRODUCT_IMAGE_BUCKET = "product-images";

/**
 * Resolved per call rather than captured at module load, so the value can be overridden and
 * tested without re-importing the module.
 */
export function getProductImageBucket(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGE_BUCKET?.trim() ||
    DEFAULT_PRODUCT_IMAGE_BUCKET
  );
}

/**
 * Next's default Server Action request-body limit, which the cap below has to stay clear of.
 *
 * It is a fact about the framework, not a rule of ours: `next.config.ts` does not raise
 * `experimental.serverActions.bodySizeLimit`, so this is the ceiling on the whole multipart request.
 * A body over it is refused with a 413 *before* the action runs, so nothing in this module — including
 * the size check — ever sees it.
 */
export const SERVER_ACTION_BODY_LIMIT_BYTES = 1024 * 1024;

/**
 * The largest image a CMS user may upload.
 *
 * Deliberately one megabyte *decimal*, not the 1 MiB the request limit allows. The upload is a
 * multipart body, so boundaries and part headers travel with the file; a file allowed right up to the
 * limit would push the request over it and be rejected as a 413 that no code here can report. This
 * value used to be 5 MB, which the request limit made unreachable — an oversized image was refused
 * before validation and left the form stuck on "Uploading image...".
 */
export const MAX_IMAGE_BYTES = 1000 * 1000;

/** The cap as the interface states it, so the copy and the enforced limit cannot drift apart. */
export const MAX_IMAGE_SIZE_LABEL = "1 MB";

export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;

export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

export function isAllowedImageType(value: string): value is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(value);
}

export function extensionFor(type: AllowedImageType): string {
  switch (type) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
  }
}

function startsWith(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

/**
 * Confirms the file really is the image type it claims to be. The declared MIME type comes from
 * the client and cannot be trusted on its own.
 */
export function matchesImageSignature(bytes: Uint8Array, type: AllowedImageType): boolean {
  switch (type) {
    case "image/png":
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "image/webp":
      return (
        startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      );
  }
}
