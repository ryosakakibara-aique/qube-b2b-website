import type { CSSProperties, ReactNode } from "react";
import { CARD_TAG_LIMIT, selectTags } from "@/lib/products/tags";

/**
 * The product tag chip.
 *
 * A tag is the same object wherever it appears — on a `/products` carousel card and on the product
 * page — so there is one chip here and the two contexts differ only in the scale it is drawn at.
 * Before this module there were two chips that agreed on nothing: the carousel drew an 8px-radius
 * chip with a translucent brand-gradient fill and gradient-clipped text, and the product page drew a
 * pill with a `--brand-3` outline and `--brand-ink` text. Radius, border, fill, ink, padding and font
 * size all differed, the card's copy was written in hex literals rather than the tokens that exist
 * for exactly those colours, and neither value could be changed in one place.
 *
 * Client decisions (Round 23): radius **8px** — the existing `--radius-chip` token, not a new value —
 * and ink **`--brand-ink`**. The card's translucent fill is **not** kept: brand ink over that fill
 * measures 3.82:1 against the card's surface, under the 4.5:1 AA floor for text this size, while the
 * same ink on the unfilled surface measures 5.00:1 — the value the documentation already records for
 * tags. A fill and this ink cannot both hold.
 */

/**
 * The carousel card resizes as it moves away from the active position (236 → 212.4 → 188.8px), so its
 * chips scale with it; a fixed chip would be oversized on the outer tiers. These are that scale, not a
 * second design: the active tier is the product page's size.
 */
const CARD_TIERS = {
  active: { fontSize: 10, paddingX: 12, gap: 6 },
  adjacent: { fontSize: 9, paddingX: 10.8, gap: 5.4 },
  rest: { fontSize: 8, paddingX: 9.6, gap: 4.8 },
} as const;

export type ProductTagTier = keyof typeof CARD_TIERS;

/** The product page is one size, so it is not a tier. */
const PAGE = { fontSize: 10, paddingX: 12 } as const;

/** A card chip is tight against its text; the page has room to breathe. */
const CARD_PADDING_Y = 1;
const PAGE_PADDING_Y = 4;

const CHIP_CLASS =
  "whitespace-nowrap rounded-[var(--radius-chip)] border border-[var(--brand-3)] font-medium text-[var(--brand-ink)]";

type ChipProps = { className: string; style: CSSProperties; children: ReactNode };

/** Inside a card the chip is not a list item: the whole card is already one link. */
function CardChip({ className, style, children }: ChipProps) {
  return (
    <span className={className} style={style}>
      {children}
    </span>
  );
}

/** On the product page the chips are the items of a list. */
function PageChip({ className, style, children }: ChipProps) {
  return (
    <li className={className} style={style}>
      {children}
    </li>
  );
}

type ProductTagsProps = {
  tags: string[];
  /**
   * `card` scales the chip with the carousel's tier and may collapse the overflow; `page` draws every
   * tag at one size inside its own list.
   */
  variant: "card" | "page";
  /** Which carousel tier the card is at. Ignored by `page`. */
  tier?: ProductTagTier;
  /** Collapse anything past this many tags into a "+n" chip. Defaults to the card's limit. */
  limit?: number;
};

export function ProductTags({
  tags,
  variant,
  tier = "active",
  limit = variant === "card" ? CARD_TAG_LIMIT : undefined,
}: ProductTagsProps) {
  if (tags.length === 0) return null;

  const size = variant === "card" ? CARD_TIERS[tier] : PAGE;
  const { shown, hidden } = selectTags(tags, limit);

  const chipStyle: CSSProperties = {
    fontSize: size.fontSize,
    paddingLeft: size.paddingX,
    paddingRight: size.paddingX,
    paddingTop: variant === "card" ? CARD_PADDING_Y : PAGE_PADDING_Y,
    paddingBottom: variant === "card" ? CARD_PADDING_Y : PAGE_PADDING_Y,
  };

  const Chip = variant === "card" ? CardChip : PageChip;

  const chips = (
    <>
      {shown.map((tag) => (
        <Chip key={tag} className={CHIP_CLASS} style={chipStyle}>
          {tag}
        </Chip>
      ))}
      {hidden > 0 ? (
        <Chip key="overflow" className={CHIP_CLASS} style={chipStyle}>
          {/*
            The count is not a tag, so it is not read out as one: the visible "+4" is hidden from
            assistive technology and the sentence beside it says the same thing in words.
          */}
          <span aria-hidden="true">+{hidden}</span>
          <span className="sr-only">
            {hidden} more {hidden === 1 ? "tag" : "tags"}
          </span>
        </Chip>
      ) : null}
    </>
  );

  if (variant === "page") {
    return <ul className="flex flex-wrap justify-center gap-2">{chips}</ul>;
  }

  // The row's rhythm is the card's own: the gap between chips is the card's inner gap, and the row
  // sits half that distance below the description.
  const { gap } = CARD_TIERS[tier];

  return (
    <div className="flex flex-wrap" style={{ gap, paddingTop: gap / 2 }}>
      {chips}
    </div>
  );
}
