import type { ShowcaseTile } from "@/lib/content/types";

/**
 * The PANDORA showcase's nine slots.
 *
 * These are **layout**, not content, and they are deliberately not editable: the panel is a fixed
 * 3x4 grid whose tiles carry hand-placed `lg:col-start-*`, `lg:col-span-2` and `lg:row-span-2`
 * classes, and the exported photographs were paired to those shapes by aspect ratio (two wide, one
 * tall, six single). Letting an editor add, remove or move a tile would put a portrait photograph in
 * a landscape slot and tear the panel's shared 1px rules apart. The CMS edits the label and the
 * photograph, and nothing else.
 *
 * `shape` drives two things that must not disagree: the pixel guidance shown beside an upload, and
 * the pairing the test suite checks against each file's real dimensions.
 */

export type ShowcaseShape = "wide" | "tall" | "single";

export type ShowcaseSlot = {
  /** Stable React key and DOM identity. */
  id: string;
  variant: "dark" | "light";
  gridClassName: string;
  shape: ShowcaseShape;
  /** What an author should upload for this slot, in the CMS form. */
  uploadNote: string;
};

export const SHOWCASE_SLOTS: ShowcaseSlot[] = [
  {
    id: "terminals-1",
    variant: "dark",
    gridClassName: "lg:col-start-1 lg:row-start-1",
    shape: "single",
    uploadNote: "About 700 × 546 px (single tile)",
  },
  {
    id: "laundry",
    variant: "dark",
    gridClassName: "lg:col-start-2 lg:col-span-2 lg:row-start-1",
    shape: "wide",
    uploadNote: "Wide, about 1400 × 546 px (two-column tile)",
  },
  {
    id: "qube-app",
    variant: "dark",
    gridClassName: "lg:col-start-1 lg:row-start-2 lg:row-span-2",
    shape: "tall",
    uploadNote: "Portrait, about 700 × 1100 px (two-row tile)",
  },
  {
    id: "qr-cash",
    variant: "dark",
    gridClassName: "lg:col-start-2 lg:row-start-2",
    shape: "single",
    uploadNote: "About 700 × 546 px (single tile)",
  },
  {
    id: "data-config",
    variant: "dark",
    gridClassName: "lg:col-start-3 lg:row-start-2",
    shape: "single",
    uploadNote: "About 700 × 546 px (single tile)",
  },
  {
    id: "terminals-2",
    variant: "dark",
    gridClassName: "lg:col-start-2 lg:row-start-3",
    shape: "single",
    uploadNote: "About 700 × 546 px (single tile)",
  },
  {
    id: "real-time",
    variant: "dark",
    gridClassName: "lg:col-start-3 lg:row-start-3",
    shape: "single",
    uploadNote: "About 700 × 546 px (single tile)",
  },
  {
    id: "recreational",
    variant: "dark",
    gridClassName: "lg:col-start-1 lg:col-span-2 lg:row-start-4",
    shape: "wide",
    uploadNote: "Wide, about 1400 × 546 px (two-column tile)",
  },
  {
    id: "offices",
    variant: "dark",
    gridClassName: "lg:col-start-3 lg:row-start-4",
    shape: "single",
    uploadNote: "About 700 × 546 px (single tile)",
  },
];

/** A tile for a slot that has no stored content yet, so a render can never read `undefined`. */
export const EMPTY_TILE: ShowcaseTile = { label: "", imageUrl: "" };
