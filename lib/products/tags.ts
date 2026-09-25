/**
 * How many product tags a card shows.
 *
 * This is content logic rather than presentation — "the card shows three and the rest become a +n
 * chip" — and it lives in its own module for one reason: `components/products/product-tags.tsx`
 * renders JSX, which Node's test runner cannot import, so the rule would otherwise be testable only
 * by reading source text. `tests/product-tags.test.ts` exercises it directly.
 *
 * Note the relationship with `MAX_TAG_COUNT` in `validation.ts`: that is how many an editor may
 * store, this is how many a card shows. The card's limit has to stay below the store limit or the
 * "+n" chip could never appear.
 */

/** Three chips fit one line on the narrowest carousel card; the rest collapse. */
export const CARD_TAG_LIMIT = 3;

export type TagSelection = {
  /** The tags to draw, in order. */
  shown: string[];
  /** How many were left out, which is what the "+n" chip counts. */
  hidden: number;
};

/**
 * Splits a tag list into what is drawn and what is counted. With no limit, everything is drawn —
 * which is what the product page does, since it has the room.
 */
export function selectTags(tags: string[], limit?: number): TagSelection {
  const shown = typeof limit === "number" ? tags.slice(0, Math.max(limit, 0)) : tags;
  return { shown, hidden: tags.length - shown.length };
}
