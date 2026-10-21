/**
 * The homepage content model.
 *
 * One record holds the whole landing page: only the copy the client listed as editorial. Site chrome
 * (nav, footer), the enquiry section, the parallax band, the "Ask how we can help" band and the
 * PANDORA grid's geometry stay in code — see docs/DEVELOPMENT-PHASES.md §1 and CLAUDE.md decision 14.
 *
 * The two fixed groups are fixed for a reason rather than by convention: the business grid divides by
 * 1, 2 and 3 so twelve cells fill whole rows at every breakpoint, and the showcase is a 3x4 panel
 * whose nine tiles carry hand-placed `lg:col-start-*` / `row-span-*` geometry. `BUSINESS_FEATURE_COUNT`
 * and `SHOWCASE_TILE_COUNT` are the single place those numbers live.
 */

export type BusinessFeature = {
  title: string;
  headline: string;
  text: string;
};

/**
 * One PANDORA tile. The tile's *shape and position* are layout and stay in `SHOWCASE_SLOTS`; only the
 * label and the photograph are content.
 */
export type ShowcaseTile = {
  label: string;
  imageUrl: string;
};

export type ClientLogo = {
  /** The brand name, used as the image's alt text. A logo without one is announced as "image". */
  name: string;
  imageUrl: string;
  /** Intrinsic size, so `next/image` can reserve space and the strip cannot shift as logos load. */
  width: number;
  height: number;
};

export type StoryCard = {
  name: string;
  logoUrl: string;
  logoWidth: number;
  logoHeight: number;
  /** The photograph behind the card. Empty renders the plain black card the design has today. */
  imageUrl: string;
};

export type HomepageContent = {
  heroHeading: string;
  /** The bold label that precedes the hero's secondary link ("QUBE Product Suite"). */
  heroSubLabel: string;
  heroLinkLabel: string;
  heroLinkHref: string;
  ctaLabel: string;
  ctaHref: string;
  /** A YouTube URL in any of its common forms. Empty renders the poster state. */
  videoUrl: string;
  /** The iframe's accessible name. An embed has no `alt`, so this is what a screen reader announces. */
  videoTitle: string;
  featuresHeading: string;
  showcaseHeading: string;
  clientsHeading: string;
  businessFeatures: BusinessFeature[];
  showcaseTiles: ShowcaseTile[];
  logos: ClientLogo[];
  stories: StoryCard[];
};

export type HomepageActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};
