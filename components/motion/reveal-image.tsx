"use client";

import Image from "next/image";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { MOTION_ENABLED } from "@/components/motion/tokens";
import { instant, logoReveal } from "@/components/motion/variants";

/**
 * A `next/image` that reveals itself when it enters the viewport, sequenced by `index`.
 *
 * The image element animates directly, via `m.create(Image)`, rather than being wrapped in a motion
 * div. That is not a stylistic preference: the marquee grid's logos *are* their own grid items, so
 * wrapping one to animate it would have changed the grid it sits in — and the hero strip, which does
 * wrap each logo in a centring div, needs that same wrapper kept. Animating the image keeps both
 * contexts' markup exactly as it was, with nothing added but the motion attributes.
 *
 * Viewport-triggered and once-only, matching the rest of the system. The client-logo strip sits
 * inside a section that already reveals itself, so these read as a ripple within that fade rather
 * than as a second, competing entrance.
 */
const MotionImage = m.create(Image);

type RevealImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  index?: number;
  /** Uses the centring wrapper the hero strip has and the marquee overlay does not. */
  centred?: boolean;
};

export function RevealImage({
  src,
  alt,
  width,
  height,
  className,
  index = 0,
  centred = false,
}: RevealImageProps) {
  const reducedMotion = useReducedMotion();

  if (!MOTION_ENABLED) {
    const plain = (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
    return centred ? (
      <div className="flex items-center justify-center">{plain}</div>
    ) : (
      plain
    );
  }

  const variants = logoReveal(index);

  const mark = (
    <MotionImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      data-reveal=""
      variants={reducedMotion ? instant(variants) : variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.5 }}
    />
  );

  return centred ? (
    <div className="flex items-center justify-center">{mark}</div>
  ) : (
    mark
  );
}
