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
 * The Server Action request-body limit, as configured in `next.config.ts`.
 *
 * Recorded here rather than only in the config because the image cap below has to stay under it, and
 * that relationship is what stops the upload field from promising a file the server will refuse. A
 * test reads `next.config.ts` and fails if the two disagree. Next's own default is 1 MiB, which is
 * what made the original 5 MB cap unreachable.
 */
export const SERVER_ACTION_BODY_LIMIT_BYTES = 6 * 1024 * 1024;

/**
 * The largest image a CMS user may upload.
 *
 * Five megabytes, which the client asked for. It has to stay below the request-body limit above with
 * room for the multipart boundaries and part headers that travel with the file, or a maximum-size
 * image would be refused as a 413 that no code here can report.
 */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** The cap as the interface states it, so the copy and the enforced limit cannot drift apart. */
export const MAX_IMAGE_SIZE_LABEL = "5 MB";

/**
 * What a product image should be uploaded at.
 *
 * Derived from how the file is actually displayed, not from the design:
 *
 * - the product carousel on `/products` shows it as a **210px square** (`product-carousel.tsx`), and
 * - the product page shows the same file as a full-width banner up to **1040 × 408**, centre-cropped
 *   (`app/(marketing)/products/[product]/page.tsx`).
 *
 * The banner is the binding constraint: covering 1040px on a high-density screen needs about 2080px
 * of source, so the guidance is a 2000px square. The carousel would be satisfied by far less, but it
 * receives the same file. At this size a JPEG or WebP sits well inside the 5 MB cap; a PNG of the
 * same dimensions may not.
 */
export const RECOMMENDED_IMAGE_SIZE = { width: 2000, height: 2000 } as const;

/** Shown beside the upload field, so an author knows what to prepare. */
export const RECOMMENDED_IMAGE_NOTE = `Square, ${RECOMMENDED_IMAGE_SIZE.width} × ${RECOMMENDED_IMAGE_SIZE.height} px or larger`;

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
