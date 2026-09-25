/**
 * The carousel's geometry.
 *
 * It lives apart from the component for one reason: the strip's offsets, its tiers and the drag's
 * snap target are pure arithmetic, and the component renders JSX, which Node's test runner cannot
 * import. `tests/carousel-gesture.test.ts` exercises the snap for real rather than by reading source.
 */

/**
 * Figma exact pixel sizes — 3 tiers based on distance from the active card.
 *
 * The tag chip's sizes are deliberately absent: the chip is shared with the product page, so
 * `components/products/product-tags.tsx` owns them and scales them by this same tier.
 */
export const CARD_SIZES = {
  active: {
    w: 236,
    h: 442,
    img: 210,
    p: 12,
    innerGap: 6,
    fs: 16,
    fsSmall: 12.8,
  },
  adjacent: {
    w: 212.4,
    h: 397.8,
    img: 189,
    p: 10.8,
    innerGap: 5.4,
    fs: 14.4,
    fsSmall: 11.5,
  },
  rest: {
    w: 188.8,
    h: 353.6,
    img: 168,
    p: 9.6,
    innerGap: 4.8,
    fs: 12.8,
    fsSmall: 10.2,
  },
} as const;

export type SizeKey = keyof typeof CARD_SIZES;

/** Fixed gap between every card (Figma: gap-[16px]). */
export const CARD_GAP = 16;

export function distanceTier(dist: number): SizeKey {
  if (dist === 0) return "active";
  if (dist === 1) return "adjacent";
  return "rest";
}

/** Sum of card widths + gaps preceding `index` in the flat (non-wrapping) extended strip. */
export function offsetOfIndex(activeIndex: number, index: number): number {
  let x = 0;
  for (let i = 0; i < index; i += 1) {
    x += CARD_SIZES[distanceTier(Math.abs(i - activeIndex))].w + CARD_GAP;
  }
  return x;
}

/** Center of card[index] within the strip, for a given activeIndex. */
export function centerOfIndex(activeIndex: number, index: number): number {
  const w = CARD_SIZES[distanceTier(Math.abs(index - activeIndex))].w;
  return offsetOfIndex(activeIndex, index) + w / 2;
}

/**
 * The card left nearest the middle of the window after a drag, which is what the strip snaps to.
 *
 * `centre` is a position in the strip's own coordinates; the component turns its pixel offset into
 * one before asking. The answer is not "distance divided by a pitch": the tiers differ by up to 47px,
 * so each candidate's real centre is measured and the nearest wins. A drag shorter than the gap
 * between two centres therefore returns the card it started on, and the caller slides back to it.
 */
export function nearestIndex(activeIndex: number, centre: number, count: number): number {
  let best = 0;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < count; index += 1) {
    const distance = Math.abs(centerOfIndex(activeIndex, index) - centre);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = index;
    }
  }

  return best;
}
