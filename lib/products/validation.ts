import type { ProductContentSection, ProductImage } from "@/lib/products/types";

/**
 * The CMS product form contract: field names, content limits and image slots.
 *
 * Every content block takes two images. The create/edit frames give only the first block two slots,
 * and that is how this was first built; the client then asked for a second image on the other blocks
 * as well, including blocks added in the CMS, so the per-position rule is gone. A deliberate
 * deviation from the frames rather than a reading of them.
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

/**
 * Images per content block: two, whatever the block's position.
 *
 * The database and the write function needed no change for this — `product_content_section_images`
 * is keyed by section and sort order and `save_product_content()` walks however many images it is
 * given, so the one-per-block limit only ever existed in this rule and the form that read it.
 */
export const SECTION_IMAGE_SLOTS = 2;

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
  /** The hero image: the product page banner, link previews and structured data. */
  imageUrl: string | null;
  imageAlt: string | null;
  /** The card image: the square tile in the `/products` carousel. Independent of the hero. */
  cardImageUrl: string | null;
  cardImageAlt: string | null;
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

/**
 * A url and its alt text travel together, whichever field they belong to.
 *
 * An image without a description is inaccessible; a description without an image is left over from
 * one that was removed, and storing it would put text in the database that describes nothing. The two
 * rules are one helper because they are one rule, and because it was previously written out three
 * times — twice for the product images and once per content-section image — where they could drift.
 */
function checkImagePair(
  fieldErrors: Record<string, string>,
  altField: string,
  url: string,
  alt: string,
): void {
  if (alt.length > MAX_ALT_LENGTH) {
    fieldErrors[altField] = `Keep image descriptions under ${MAX_ALT_LENGTH} characters.`;
  }

  if (url && !alt) {
    fieldErrors[altField] = "Describe this image for screen readers.";
  } else if (!url && alt) {
    fieldErrors[altField] = "Upload the image before describing it.";
  }
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
  checkImagePair(fieldErrors, "imageAlt", imageUrl, imageAlt);

  // The card image is a field of its own, not a fallback for the hero: a product may have either,
  // both, or neither, and an empty card image renders a card with no picture.
  const cardImageUrl = text(formData, "cardImageUrl");
  const cardImageAlt = text(formData, "cardImageAlt");
  checkImagePair(fieldErrors, "cardImageAlt", cardImageUrl, cardImageAlt);

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
    const slots = SECTION_IMAGE_SLOTS;
    for (let slot = 1; slot <= slots; slot += 1) {
      const url = text(formData, `content${position}Image${slot}Url`);
      const alt = text(formData, `content${position}Image${slot}Alt`);
      const altField = `content${position}Image${slot}Alt`;

      checkImagePair(fieldErrors, altField, url, alt);

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
      cardImageUrl: cardImageUrl || null,
      cardImageAlt: cardImageAlt || null,
      acquisition: text(formData, "acquisition"),
      locations: text(formData, "locations"),
      ctaLabel: text(formData, "ctaLabel"),
      published: text(formData, "published") === "true",
      sections,
    },
  };
}
