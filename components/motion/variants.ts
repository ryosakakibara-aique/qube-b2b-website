/**
 * The motion vocabulary, as plain objects.
 *
 * Pure data on purpose: no React, no hooks, no DOM, so `tests/motion-tokens.test.ts` can assert the
 * rules that keep the system coherent — only composited properties are animated, the above-the-fold
 * entrance never touches opacity, and a stagger delay is bounded.
 *
 * Everything a page animates should come from one of these. A page that needs a new effect adds a
 * variant here rather than inventing a transition inline, which is what stops four components from
 * drifting into four slightly different animations.
 */

import {
  DISTANCE,
  DURATION,
  EASE_OUT,
  HERO_SCALE,
  logoDelay,
  staggerDelay,
} from "@/components/motion/tokens";

export type RevealVariantName = "rise" | "fade";

/** The three roles in the above-the-fold sequence. */
export type HeroVariantName = "heading" | "support" | "visual";

/**
 * The state an element animates from. Instant by definition — there is nothing to ease when an
 * element is being placed in its starting position — so only the properties are interesting.
 */
export type HiddenVariant = {
  opacity?: number;
  y?: number;
  scale?: number;
  transition: { duration: 0 };
};

/** The state an element settles into. This is where the timing lives. */
export type VisibleVariant = {
  opacity?: number;
  y?: number;
  scale?: number;
  transition: {
    duration: number;
    ease: [number, number, number, number];
    delay?: number;
  };
};

export type VariantSet = {
  hidden: HiddenVariant;
  visible: VisibleVariant;
};

/**
 * The fade-and-rise shape, with the delay supplied by whichever sequencing rule applies.
 *
 * Two rules exist because two kinds of list exist: an open-ended one, where the step count is capped,
 * and the client-logo strip, whose length is fixed and known.
 */
function riseAt(delay: number): VariantSet {
  return {
    hidden: { opacity: 0, y: DISTANCE.reveal, transition: { duration: 0 } },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATION.reveal, ease: EASE_OUT, delay },
    },
  };
}

/**
 * Scroll reveal: fades in while rising into place, once.
 *
 * `index` is the item's position in its group; it drives the capped stagger delay.
 */
export function revealRise(index = 0): VariantSet {
  return riseAt(staggerDelay(index));
}

/**
 * One client logo in the strip: the same fade and rise, sequenced across a list of known length.
 *
 * See `LOGO_STAGGER` for why this one is not capped the way a general stagger is.
 */
export function logoReveal(index = 0): VariantSet {
  return riseAt(logoDelay(index));
}

/**
 * Scroll reveal without movement: opacity only.
 *
 * Used where moving the element would break something visible — cells in a seamless bordered grid,
 * whose shared 1px rules would visibly come apart mid-animation, and the sticky workspace card.
 */
export function revealFade(index = 0): VariantSet {
  return {
    hidden: { opacity: 0, transition: { duration: 0 } },
    visible: {
      opacity: 1,
      transition: {
        duration: DURATION.reveal,
        ease: EASE_OUT,
        delay: staggerDelay(index),
      },
    },
  };
}

/**
 * The above-the-fold sequence: heading, then its support, then the visual. All three fade.
 *
 * The sequence is a cascade, not a queue — each element starts 60ms after the previous one and they
 * overlap, so the whole hero has settled by about 630ms rather than assembling element by element.
 *
 * This deliberately gives up the pure-LCP position recorded in Round 14: the heading *is* the
 * largest contentful paint element on `/` and `/products`, and text at `opacity: 0` is not a valid
 * LCP candidate, so the metric now lands when the heading finishes fading rather than at first
 * paint. Two rules keep that cost as small as it can be while the fade exists: the heading takes the
 * shortest duration of the three, and it never takes a delay, whatever index it is given.
 */

/** The measured element: shortest fade, and it takes no index, so it can never be delayed. */
export function heroHeading(): VariantSet {
  return {
    hidden: { opacity: 0, y: DISTANCE.heroHeading, transition: { duration: 0 } },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: DURATION.hero, ease: EASE_OUT, delay: 0 },
    },
  };
}

/** Supporting copy and controls, staggered behind the heading. */
export function heroSupport(index = 0): VariantSet {
  return {
    hidden: { opacity: 0, y: DISTANCE.enter, transition: { duration: 0 } },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: DURATION.base,
        ease: EASE_OUT,
        delay: staggerDelay(index),
      },
    },
  };
}

/** The hero visual, last in the cascade and the only element that scales. */
export function heroVisual(index = 0): VariantSet {
  return {
    hidden: {
      opacity: 0,
      y: DISTANCE.reveal,
      scale: HERO_SCALE,
      transition: { duration: 0 },
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: DURATION.reveal,
        ease: EASE_OUT,
        delay: staggerDelay(index),
      },
    },
  };
}

/** Resolves a hero role to its variants. */
export function heroVariants(
  name: HeroVariantName,
  index = 0,
): VariantSet {
  if (name === "heading") return heroHeading();
  if (name === "visual") return heroVisual(index);
  return heroSupport(index);
}

/**
 * A route arriving under the visitor.
 *
 * Enter only. The App Router unmounts the outgoing tree immediately, so an exit animation needs a
 * frozen-router workaround that breaks streaming and server components; Next's own answer is
 * `template.tsx`, which gives entrance without exit. This is that entrance, and it is skipped on the
 * first load (see `app/(marketing)/template.tsx`) so a hard load is never hidden behind a fade.
 *
 * Opacity only, with no rise. This wrapper contains an entire page, so a transform on it would
 * become the containing block for every fixed-position descendant — a trap that would only surface
 * later, as a broken sticky header or overlay, far from the code that caused it.
 */
export const routeEnter: VariantSet = {
  hidden: { opacity: 0, transition: { duration: 0 } },
  visible: {
    opacity: 1,
    transition: { duration: DURATION.enter, ease: EASE_OUT },
  },
};

/** The collapsed navigation panel: drops in, and leaves faster than it arrived. */
export const panelDrop = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.fast, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: DURATION.exit, ease: EASE_OUT },
  },
};

/** Resolves a reveal name to its variants. */
export function revealVariants(
  name: RevealVariantName,
  index = 0,
): VariantSet {
  return name === "fade" ? revealFade(index) : revealRise(index);
}

/**
 * The same variants with all the time taken out.
 *
 * Handed to the primitives when the visitor has asked for reduced motion. Motion's
 * `reducedMotion="user"` already removes transform and layout animation but keeps opacity fades;
 * this goes further, so the element is simply present when it enters the viewport rather than
 * animating into it.
 */
export function instant(set: VariantSet): VariantSet {
  return {
    hidden: { ...set.hidden, transition: { duration: 0 } },
    visible: {
      ...set.visible,
      transition: { ...set.visible.transition, duration: 0, delay: 0 },
    },
  };
}
