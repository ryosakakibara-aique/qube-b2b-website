/**
 * The single source of numbers for the marketing motion system.
 *
 * Motion is not in the Figma design. The exports this project can read are outline-converted and
 * contain no timing, easing or distance values, so every number here is an engineering proposal
 * rather than a design measurement. They live in one module so the proposal can be retuned in one
 * place, and `tests/motion-tokens.test.ts` keeps `app/globals.css` — which repeats them as custom
 * properties for the CSS-only micro-interactions — in step with this file.
 *
 * Only `opacity` and `transform` are ever animated: both are composited, so a reveal cannot cause
 * layout shift or a repaint. `tests/motion-tokens.test.ts` enforces that against the variants.
 */

/**
 * Turns the motion system off without touching any component.
 *
 * Set to `false` and every primitive renders its children in a plain element with no motion props,
 * the provider stops mounting `LazyMotion`, and the route transition and navigation panel stop
 * animating — verified by building with it off: zero hidden reveals in the markup, no transforms on
 * the hero, and the panel rendered as a plain `<nav>`. The CSS micro-interactions stay, because they
 * are CSS.
 *
 * What it does **not** do is remove the bytes. The imports remain, and a runtime constant cannot
 * remove an import, so the vendor chunks still load (~32 KB gzipped). Reclaiming those means removing
 * the dependency, which is a revert of this feature rather than a flag.
 */
export const MOTION_ENABLED = true;

/** Seconds, because that is the unit Motion takes. `globals.css` mirrors these in milliseconds. */
export const DURATION = {
  /** Hover and press feedback. */
  micro: 0.15,
  /** Cards, buttons and other small state changes. */
  fast: 0.2,
  /** A component appearing. */
  base: 0.3,
  /**
   * The above-the-fold heading. The shortest of the hero entrances on purpose: this element is the
   * largest contentful paint, and while it fades, it must finish fading before anything else does.
   */
  hero: 0.26,
  /** A section revealing as it enters the viewport. */
  reveal: 0.45,
  /** A route changing under the visitor. */
  enter: 0.25,
  /** Leaving is always quicker than arriving. */
  exit: 0.15,
} as const;

/**
 * Decelerating ease — fast at the start, settling at the end.
 *
 * A mutable tuple rather than `as const` because Motion's `ease` takes `[number, number, number,
 * number]`. The same curve is mirrored as `--motion-ease-out` in `app/globals.css`.
 */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Pixels. */
export const DISTANCE = {
  /** Scroll reveal. Small enough to read as polish rather than as movement. */
  reveal: 20,
  /** Supporting above-the-fold content, and the hero entrance's default. */
  enter: 12,
  /** The above-the-fold heading, which carries a touch more travel than its support. */
  heroHeading: 16,
  /** Hover lift, used by the CSS utility only. */
  lift: 2,
} as const;

/** The hero visual settles from this scale. Subtle enough to read as settling, not as zooming. */
export const HERO_SCALE = 0.99;

/** Seconds between siblings in a staggered list. */
export const STAGGER = 0.06;

/**
 * The stagger stops growing after this many steps.
 *
 * A nine-cell grid with an uncapped stagger would still be settling most of a second after it
 * entered the viewport, which reads as slow rather than premium. Capping the step count bounds the
 * tail however long the list is, without dropping the stagger entirely.
 */
export const MAX_STAGGER_STEPS = 5;

/** Scale applied while a control is pressed, used by the CSS utility only. */
export const PRESS_SCALE = 0.98;

/** Delay, in seconds, for the item at `index` in a staggered group. */
export function staggerDelay(index: number, step: number = STAGGER): number {
  const steps = Math.min(Math.max(Math.trunc(index) || 0, 0), MAX_STAGGER_STEPS);
  return Number((steps * step).toFixed(4));
}

/**
 * Seconds between the client logos in the strip — smaller than `STAGGER`, and deliberately not
 * capped by `MAX_STAGGER_STEPS`.
 *
 * The cap exists so an open-ended list cannot leave its last item waiting on eight predecessors. The
 * logo strip is a fixed eight, so its tail is bounded by construction (7 × 50ms = 350ms) and every
 * logo gets its own beat instead of the last three sharing one.
 */
export const LOGO_STAGGER = 0.05;

/** Delay, in seconds, for the logo at `index`. Uncapped for the reason above. */
export function logoDelay(index: number, step: number = LOGO_STAGGER): number {
  const steps = Math.max(Math.trunc(index) || 0, 0);
  return Number((steps * step).toFixed(4));
}
