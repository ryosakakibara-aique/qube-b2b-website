import type { ProductContentSection, ProductImage } from "@/lib/products/types";

/**
 * The CMS product form contract: field names, content limits and image slots.
 *
 * The slot layout mirrors the Figma create/edit screens: the first content block accepts two
 * images, later blocks accept one.
 *
 * The number of content blocks is data-driven rather than fixed at three. The Figma create screen
 * shows three blocks, but the designed product detail pages render more than three service blocks
 * for some products, and a fixed count would silently delete the extras on save.
 */

export const MIN_SECTION_COUNT = 3;
export const MAX_SECTION_COUNT = 8;

/** Character limits from the placeholders in the create/edit frames. */
export const LONG_CONTENT_LIMIT = 3000;
export const SHORT_CONTENT_LIMIT = 1000;

export function sectionBodyLimit(position: number): number {
  return position === 1 ? LONG_CONTENT_LIMIT : SHORT_CONTENT_LIMIT;
}

export function sectionImageSlots(position: number): number {
  return position === 1 ? 2 : 1;
}

export const MAX_TITLE_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MAX_TAG_COUNT = 12;
export const MAX_ALT_LENGTH = 250;
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type ProductPayload = {
  id: string | null;
  title: string;
  slug: string;
  description: string;
  tags: string[];
  imageUrl: string | null;
  imageAlt: string | null;
  acquisition: string;
  locations: string;
  ctaLabel: string;
  published: boolean;
  sections: ProductContentSection[];
};

export type ProductValidation =
  | { ok: true; payload: ProductPayload }
  | { ok: false; fieldErrors: Record<string, string> };

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function parseProductForm(formData: FormData): ProductValidation {
  const fieldErrors: Record<string, string> = {};

  const title = text(formData, "title");
  if (!title) fieldErrors.title = "Add a product title.";
  else if (title.length > MAX_TITLE_LENGTH) {
    fieldErrors.title = `Keep the title under ${MAX_TITLE_LENGTH} characters.`;
  }

  const slug = text(formData, "slug").toLowerCase();
  if (!slug) fieldErrors.slug = "Add a path for this product.";
  else if (!SLUG_PATTERN.test(slug)) {
    fieldErrors.slug = "Use lower-case letters, numbers and single hyphens, e.g. parcel-locker.";
  }

  const description = text(formData, "description");
  if (!description) fieldErrors.description = "Add a short description.";
  else if (description.length > MAX_DESCRIPTION_LENGTH) {
    fieldErrors.description = `Keep the description under ${MAX_DESCRIPTION_LENGTH} characters.`;
  }

  const tags = Array.from(
    new Set(
      text(formData, "tags")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
  if (tags.length > MAX_TAG_COUNT) {
    fieldErrors.tags = `Use at most ${MAX_TAG_COUNT} tags.`;
  }

  const imageUrl = text(formData, "imageUrl");
  const imageAlt = text(formData, "imageAlt");
  if (imageUrl && !imageAlt) {
    fieldErrors.imageAlt = "Describe the product image for screen readers.";
  } else if (imageAlt.length > MAX_ALT_LENGTH) {
    fieldErrors.imageAlt = `Keep image descriptions under ${MAX_ALT_LENGTH} characters.`;
  }

  const requestedCount = Number.parseInt(text(formData, "sectionCount") || "0", 10);
  const sectionCount = Number.isFinite(requestedCount)
    ? Math.min(Math.max(requestedCount, 0), MAX_SECTION_COUNT)
    : 0;

  const sections: ProductContentSection[] = [];

  for (let position = 1; position <= sectionCount; position += 1) {
    const heading = text(formData, `content${position}Heading`);
    const body = text(formData, `content${position}Body`);
    const bodyLimit = sectionBodyLimit(position);
    if (body.length > bodyLimit) {
      fieldErrors[`content${position}Body`] =
        `Content ${position} is limited to ${bodyLimit.toLocaleString("en-US")} characters.`;
    }

    const images: ProductImage[] = [];
    const slots = sectionImageSlots(position);
    for (let slot = 1; slot <= slots; slot += 1) {
      const url = text(formData, `content${position}Image${slot}Url`);
      const alt = text(formData, `content${position}Image${slot}Alt`);
      const altField = `content${position}Image${slot}Alt`;

      if (alt.length > MAX_ALT_LENGTH) {
        fieldErrors[altField] = `Keep image descriptions under ${MAX_ALT_LENGTH} characters.`;
      }

      if (url && !alt) {
        fieldErrors[altField] = "Describe this image for screen readers.";
      } else if (!url && alt) {
        fieldErrors[altField] = "Upload the image before describing it.";
      }

      if (url) images.push({ url, alt });
    }

    if (heading || body || images.length > 0) {
      sections.push({ heading, body, images });
    }
  }

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  const id = text(formData, "id");

  return {
    ok: true,
    payload: {
      id: id || null,
      title,
      slug,
      description,
      tags,
      imageUrl: imageUrl || null,
      imageAlt: imageAlt || null,
      acquisition: text(formData, "acquisition"),
      locations: text(formData, "locations"),
      ctaLabel: text(formData, "ctaLabel"),
      published: text(formData, "published") === "true",
      sections,
    },
  };
}
