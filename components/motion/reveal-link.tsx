"use client";

import Link from "next/link";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { MOTION_ENABLED } from "@/components/motion/tokens";
import { instant, revealVariants, type RevealVariantName } from "@/components/motion/variants";

/**
 * A `next/link` that reveals itself, for links that are themselves grid items.
 *
 * The reveal primitives deliberately cannot render anchors: they are motion elements, and using one
 * for a link would replace client-side navigation with a full page load. Wrapping the link in a motion
 * div is the other obvious answer and it is the wrong one where the link *is* the grid item — the
 * placement classes would have to move onto the wrapper, which changes the grid it sits in. That is
 * exactly the case in the PANDORA showcase, whose tiles carry `lg:col-start-*`, `lg:col-span-2` and
 * `lg:row-span-2` on the anchor itself.
 *
 * So the link itself animates, through `m.create(Link)` — the same technique already used for images
 * in `reveal-image.tsx`. Motion consumes its own props and forwards only DOM props to the wrapped
 * component, so `href` and `className` reach Next's `Link` and navigation is untouched.
 *
 * The viewport settings match `Reveal`, and `data-reveal` is carried so the root layout's
 * no-JavaScript rule can restore the element instead of leaving it invisible.
 */
const MotionLink = m.create(Link);

export function RevealLink({
  href,
  index = 0,
  variant = "rise",
  className,
  children,
}: {
  href: string;
  /** Position in its group, which sets the stagger delay. Capped, so long grids stay quick. */
  index?: number;
  variant?: RevealVariantName;
  className?: string;
  children: React.ReactNode;
}) {
  const reducedMotion = useReducedMotion();

  if (!MOTION_ENABLED) {
    return (
      <Link href={href} className={className} data-reveal="">
        {children}
      </Link>
    );
  }

  const variants = revealVariants(variant, index);

  return (
    <MotionLink
      href={href}
      className={className}
      data-reveal=""
      variants={reducedMotion ? instant(variants) : variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2, margin: "0px 0px -10% 0px" }}
    >
      {children}
    </MotionLink>
  );
}
