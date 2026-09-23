"use client";

/**
 * The three primitives every marketing page animates through.
 *
 * All render the element you ask for — `as="h2"`, `as="article"`, `as="ul"` — rather than wrapping
 * children in an extra div. That matters here: several sections are seamless grids whose shared 1px
 * borders and `lg:col-start-*` placement live on the child itself, so an inserted wrapper would move
 * the grid item and visibly break the panel.
 *
 * - `Reveal` animates when the element scrolls into view, once.
 * - `HeroReveal` animates on mount and only ever moves the element: the above-the-fold heading is
 *   the largest contentful paint element, and fading it in would delay the measured paint.
 * - `ScrollReveal` waits for the visitor to actually scroll before it reveals anything, for the
 *   elements that sit in the first screen where a viewport trigger would fire on load.
 */

import { useInView, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useRef, type ElementType, type ReactNode } from "react";
import { MOTION_ENABLED } from "@/components/motion/tokens";
import { useHasScrolled } from "@/components/motion/use-has-scrolled";
import {
  heroVariants,
  instant,
  revealVariants,
  type HeroVariantName,
  type RevealVariantName,
} from "@/components/motion/variants";

/**
 * The tags a reveal may render.
 *
 * Anchors are deliberately absent: these are motion elements rather than Next `<Link>`s, and using
 * one for a link would replace client-side navigation with a full page load.
 */
const TAGS = {
  div: m.div,
  section: m.section,
  article: m.article,
  aside: m.aside,
  h1: m.h1,
  h2: m.h2,
  p: m.p,
  ul: m.ul,
  li: m.li,
  span: m.span,
} as const;

export type MotionTag = keyof typeof TAGS;

type BaseProps = {
  as?: MotionTag;
  /** Position in its group, which sets the stagger delay. Capped, so long grids stay quick. */
  index?: number;
  className?: string;
  id?: string;
  children: ReactNode;
};

/** Fades in as it enters the viewport, then stays put. */
export function Reveal({
  as = "div",
  index = 0,
  variant = "rise",
  className,
  id,
  children,
}: BaseProps & { variant?: RevealVariantName }) {
  const reducedMotion = useReducedMotion();

  if (!MOTION_ENABLED) {
    const Plain = as as ElementType;
    return (
      <Plain className={className} id={id} data-reveal="">
        {children}
      </Plain>
    );
  }

  const Component = TAGS[as] as ElementType;
  const variants = revealVariants(variant, index);

  return (
    <Component
      className={className}
      id={id}
      data-reveal=""
      variants={reducedMotion ? instant(variants) : variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -10% 0px" }}
    >
      {children}
    </Component>
  );
}

/**
 * Reveals only after the visitor has scrolled, for content that is already on screen at load.
 *
 * `Reveal` cannot do this: its viewport trigger fires immediately for an element in the first screen,
 * so "hidden until you scroll" would really be "hidden until hydration". Here the visibility trigger
 * is combined with the scroll latch, and `once: true` turns the in-view half into a latch too, so the
 * element cannot disappear again when the visitor scrolls back past it.
 */
export function ScrollReveal({
  as = "div",
  index = 0,
  variant = "rise",
  className,
  id,
  children,
}: BaseProps & { variant?: RevealVariantName }) {
  const reducedMotion = useReducedMotion();
  const elementRef = useRef<HTMLElement>(null);
  const hasScrolled = useHasScrolled();
  // `once` makes this permanent the first time it is true, which is what keeps the reveal one-way.
  const inView = useInView(elementRef, { amount: 0.2, once: true });

  if (!MOTION_ENABLED) {
    const Plain = as as ElementType;
    return (
      <Plain className={className} id={id} data-reveal="">
        {children}
      </Plain>
    );
  }

  const Component = TAGS[as] as ElementType;
  const variants = revealVariants(variant, index);
  const revealed = hasScrolled && inView;

  return (
    <Component
      ref={elementRef}
      className={className}
      id={id}
      data-reveal=""
      variants={reducedMotion ? instant(variants) : variants}
      initial="hidden"
      animate={revealed ? "visible" : "hidden"}
    >
      {children}
    </Component>
  );
}
/**
 * Rises and fades into place on mount, as part of the above-the-fold cascade.
 *
 * The role matters: `heading` is the measured element and takes the shortest, undelayed fade, while
 * `support` and `visual` stagger in behind it. See `variants.ts` for why the heading is treated
 * differently.
 */
export function HeroReveal({
  as = "div",
  index = 0,
  variant = "support",
  className,
  id,
  children,
}: BaseProps & { variant?: HeroVariantName }) {
  const reducedMotion = useReducedMotion();

  if (!MOTION_ENABLED) {
    const Plain = as as ElementType;
    return (
      <Plain className={className} id={id} data-reveal="">
        {children}
      </Plain>
    );
  }

  const Component = TAGS[as] as ElementType;
  const variants = heroVariants(variant, index);

  return (
    <Component
      className={className}
      id={id}
      data-reveal=""
      variants={reducedMotion ? instant(variants) : variants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </Component>
  );
}
