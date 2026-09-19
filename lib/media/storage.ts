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

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

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
