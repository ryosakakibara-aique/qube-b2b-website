import { parseYouTubeId } from "@/lib/content/video";
import type {
  BusinessFeature,
  ClientLogo,
  HomepageContent,
  ShowcaseTile,
  StoryCard,
} from "@/lib/content/types";

/**
 * The homepage form contract: field names, limits and the two fixed group sizes.
 *
 * The rules are the ones the product form already enforces — trim, require, cap, and refuse an image
 * or a link that cannot render — applied to a page rather than a record. Two things are specific to
 * this screen:
 *
 * - **The business grid and the showcase are fixed.** Their counts come from the design (twelve cells
 *   fill whole rows at every breakpoint; nine tiles carry hand-placed grid geometry), so the form has
 *   no add or remove for them and this module reads exactly `BUSINESS_FEATURE_COUNT` and
 *   `SHOWCASE_TILE_COUNT` entries. The client asked for both to be fixed "for the mean time".
 * - **The video is a link, not an id.** Authors paste what the address bar gives them, so validation
 *   normalises every accepted form to an id and rejects anything that would embed an empty frame.
 */

export const BUSINESS_FEATURE_COUNT = 12;
export const SHOWCASE_TILE_COUNT = 9;

/** Logos and stories are variable, but the marquee and the 270px cards assume a small set. */
export const MIN_LOGO_COUNT = 1;
export const MAX_LOGO_COUNT = 12;
export const MIN_STORY_COUNT = 1;
export const MAX_STORY_COUNT = 12;

export const MAX_HEADING_LENGTH = 200;
export const MAX_SECTION_HEADING_LENGTH = 120;
export const MAX_LINK_LABEL_LENGTH = 60;
export const MAX_HREF_LENGTH = 300;
export const MAX_FEATURE_TITLE_LENGTH = 80;
export const MAX_FEATURE_HEADLINE_LENGTH = 200;
export const MAX_FEATURE_TEXT_LENGTH = 500;
export const MAX_TILE_LABEL_LENGTH = 80;
export const MAX_NAME_LENGTH = 120;
export const MAX_VIDEO_TITLE_LENGTH = 200;
export const MAX_VIDEO_URL_LENGTH = 300;

export type HomepageValidation =
  | { ok: true; payload: HomepageContent }
  | { ok: false; fieldErrors: Record<string, string> };

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function positiveInteger(formData: FormData, name: string): number {
  const value = Number.parseInt(text(formData, name), 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** An `href` a visitor can safely follow: a path, an in-page anchor, or an absolute http(s) URL. */
export function isSafeHref(value: string): boolean {
  if (!value) return false;
  if (value.startsWith("#")) return value.length > 1;
  // `//host` is protocol-relative and behaves as an off-site link, which an internal path is not.
  if (value.startsWith("/")) return !value.startsWith("//");

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * An image this site can actually serve: a file in `public/`, or an object in Supabase Storage.
 *
 * The repository paths are still valid after the move to storage — the seeded copy points at
 * `/pandora-features-images/...` — so both forms are accepted rather than forcing every asset to be
 * re-uploaded before the page can render.
 */
export function isStoredImageUrl(value: string): boolean {
  if (!value) return false;
  if (value.startsWith("/")) return !value.startsWith("//");

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function required(
  formData: FormData,
  fieldErrors: Record<string, string>,
  name: string,
  message: string,
  limit: number,
): string {
  const value = text(formData, name);
  if (!value) {
    fieldErrors[name] = message;
  } else if (value.length > limit) {
    fieldErrors[name] = `Keep this under ${limit} characters.`;
  }
  return value;
}

export function parseHomepageForm(formData: FormData): HomepageValidation {
  const fieldErrors: Record<string, string> = {};

  const heroHeading = required(
    formData,
    fieldErrors,
    "heroHeading",
    "Add the hero headline.",
    MAX_HEADING_LENGTH,
  );
  const heroSubLabel = required(
    formData,
    fieldErrors,
    "heroSubLabel",
    "Add the sub-heading label.",
    MAX_LINK_LABEL_LENGTH,
  );
  const heroLinkLabel = required(
    formData,
    fieldErrors,
    "heroLinkLabel",
    "Add the link text beside the sub-heading.",
    MAX_LINK_LABEL_LENGTH,
  );
  const heroLinkHref = required(
    formData,
    fieldErrors,
    "heroLinkHref",
    "Add the path that link should open.",
    MAX_HREF_LENGTH,
  );
  if (heroLinkHref && !isSafeHref(heroLinkHref)) {
    fieldErrors.heroLinkHref = "Use a path like /products, or a full https:// link.";
  }

  const ctaLabel = required(
    formData,
    fieldErrors,
    "ctaLabel",
    "Add the button label.",
    MAX_LINK_LABEL_LENGTH,
  );
  const ctaHref = required(
    formData,
    fieldErrors,
    "ctaHref",
    "Add the path the button should open.",
    MAX_HREF_LENGTH,
  );
  if (ctaHref && !isSafeHref(ctaHref)) {
    fieldErrors.ctaHref = "Use a path like #contact, or a full https:// link.";
  }

  const featuresHeading = required(
    formData,
    fieldErrors,
    "featuresHeading",
    "Add the heading above the business grid.",
    MAX_SECTION_HEADING_LENGTH,
  );
  const showcaseHeading = required(
    formData,
    fieldErrors,
    "showcaseHeading",
    "Add the PANDORA heading.",
    MAX_SECTION_HEADING_LENGTH,
  );
  const clientsHeading = required(
    formData,
    fieldErrors,
    "clientsHeading",
    "Add the client strip heading.",
    MAX_SECTION_HEADING_LENGTH,
  );

  // The video may be empty: that is the poster state, which is a legitimate way to ship the hero.
  const videoUrl = text(formData, "videoUrl");
  const videoTitle = text(formData, "videoTitle");
  if (videoUrl.length > MAX_VIDEO_URL_LENGTH) {
    fieldErrors.videoUrl = `Keep the link under ${MAX_VIDEO_URL_LENGTH} characters.`;
  } else if (videoUrl && !parseYouTubeId(videoUrl)) {
    fieldErrors.videoUrl =
      "Paste a YouTube link — watch, youtu.be, shorts or embed — or leave it empty for the poster.";
  }
  if (videoUrl && !videoTitle) {
    fieldErrors.videoTitle = "Describe the video: this is what a screen reader announces.";
  } else if (videoTitle.length > MAX_VIDEO_TITLE_LENGTH) {
    fieldErrors.videoTitle = `Keep the description under ${MAX_VIDEO_TITLE_LENGTH} characters.`;
  }

  const businessFeatures: BusinessFeature[] = [];
  for (let position = 1; position <= BUSINESS_FEATURE_COUNT; position += 1) {
    const title = required(
      formData,
      fieldErrors,
      `feature${position}Title`,
      `Business ${position} needs a title.`,
      MAX_FEATURE_TITLE_LENGTH,
    );
    const headline = required(
      formData,
      fieldErrors,
      `feature${position}Headline`,
      `Business ${position} needs a headline.`,
      MAX_FEATURE_HEADLINE_LENGTH,
    );
    const body = required(
      formData,
      fieldErrors,
      `feature${position}Text`,
      `Business ${position} needs its line of detail.`,
      MAX_FEATURE_TEXT_LENGTH,
    );
    businessFeatures.push({ title, headline, text: body });
  }

  const showcaseTiles: ShowcaseTile[] = [];
  for (let position = 1; position <= SHOWCASE_TILE_COUNT; position += 1) {
    const label = required(
      formData,
      fieldErrors,
      `tile${position}Label`,
      `Tile ${position} needs a label.`,
      MAX_TILE_LABEL_LENGTH,
    );
    const imageUrl = text(formData, `tile${position}ImageUrl`);
    if (!imageUrl) {
      fieldErrors[`tile${position}ImageUrl`] = "Upload the photograph for this tile.";
    } else if (!isStoredImageUrl(imageUrl)) {
      fieldErrors[`tile${position}ImageUrl`] = "Upload the photograph again.";
    }
    showcaseTiles.push({ label, imageUrl });
  }

  const logos = readLogos(formData, fieldErrors);
  const stories = readStories(formData, fieldErrors);

  if (Object.keys(fieldErrors).length > 0) return { ok: false, fieldErrors };

  return {
    ok: true,
    payload: {
      heroHeading,
      heroSubLabel,
      heroLinkLabel,
      heroLinkHref,
      ctaLabel,
      ctaHref,
      videoUrl,
      // Stored only alongside a link: a description of a video that is not there describes nothing.
      videoTitle: videoUrl ? videoTitle : "",
      featuresHeading,
      showcaseHeading,
      clientsHeading,
      businessFeatures,
      showcaseTiles,
      logos,
      stories,
    },
  };
}

function clampCount(formData: FormData, name: string, max: number): number {
  const requested = Number.parseInt(text(formData, name) || "0", 10);
  if (!Number.isFinite(requested)) return 0;
  return Math.min(Math.max(requested, 0), max);
}

function readLogos(
  formData: FormData,
  fieldErrors: Record<string, string>,
): ClientLogo[] {
  const count = clampCount(formData, "logoCount", MAX_LOGO_COUNT);
  const logos: ClientLogo[] = [];

  if (count < MIN_LOGO_COUNT) {
    fieldErrors.logoCount = "Add at least one client logo.";
    return logos;
  }

  for (let position = 1; position <= count; position += 1) {
    const name = required(
      formData,
      fieldErrors,
      `logo${position}Name`,
      `Logo ${position} needs the client's name: it is the image's alt text.`,
      MAX_NAME_LENGTH,
    );
    const imageUrl = text(formData, `logo${position}ImageUrl`);
    const width = positiveInteger(formData, `logo${position}Width`);
    const height = positiveInteger(formData, `logo${position}Height`);

    if (!imageUrl || !isStoredImageUrl(imageUrl)) {
      fieldErrors[`logo${position}ImageUrl`] = "Upload this logo.";
    } else if (!width || !height) {
      // Without the intrinsic size `next/image` cannot reserve space, and the strip shifts as the
      // logos load. The uploader measures the file, so this only happens when the measurement failed.
      fieldErrors[`logo${position}ImageUrl`] =
        "Upload this logo again so its pixel size can be recorded.";
    }

    logos.push({ name, imageUrl, width, height });
  }

  return logos;
}

function readStories(
  formData: FormData,
  fieldErrors: Record<string, string>,
): StoryCard[] {
  const count = clampCount(formData, "storyCount", MAX_STORY_COUNT);
  const stories: StoryCard[] = [];

  if (count < MIN_STORY_COUNT) {
    fieldErrors.storyCount = "Add at least one success story.";
    return stories;
  }

  for (let position = 1; position <= count; position += 1) {
    const name = required(
      formData,
      fieldErrors,
      `story${position}Name`,
      `Story ${position} needs the client's name: it is the logo's alt text.`,
      MAX_NAME_LENGTH,
    );
    const logoUrl = text(formData, `story${position}LogoUrl`);
    const logoWidth = positiveInteger(formData, `story${position}LogoWidth`);
    const logoHeight = positiveInteger(formData, `story${position}LogoHeight`);
    // The photograph is optional: a story without one renders the plain black card the design has.
    const imageUrl = text(formData, `story${position}ImageUrl`);

    if (!logoUrl || !isStoredImageUrl(logoUrl)) {
      fieldErrors[`story${position}LogoUrl`] = "Upload this story's logo.";
    } else if (!logoWidth || !logoHeight) {
      fieldErrors[`story${position}LogoUrl`] =
        "Upload this logo again so its pixel size can be recorded.";
    }
    if (imageUrl && !isStoredImageUrl(imageUrl)) {
      fieldErrors[`story${position}ImageUrl`] = "Upload this story's photograph again.";
    }

    stories.push({ name, logoUrl, logoWidth, logoHeight, imageUrl });
  }

  return stories;
}
