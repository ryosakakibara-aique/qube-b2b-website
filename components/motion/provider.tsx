"use client";

/**
 * The motion context for the marketing routes.
 *
 * Mounted by `app/(marketing)/layout.tsx` and deliberately not by the root layout: the CMS has no
 * animation, so putting this higher would ship the animation runtime to `/cms/*` for nothing.
 *
 * Two deliberate choices:
 *
 * - `LazyMotion` with `domAnimation` and the slim `m` components keeps the runtime at roughly 20 KB
 *   gzipped instead of the 34 KB the full `motion` component pulls in. `strict` makes that
 *   enforceable: importing `motion.div` anywhere inside this tree throws, so the heavy entry point
 *   cannot creep back in unnoticed.
 * - `reducedMotion="user"` is Motion's documented accessibility default: it disables transform and
 *   layout animation for visitors who ask for reduced motion, while leaving opacity alone. The
 *   primitives go further and drop their durations to zero as well, so that preference means no
 *   animation at all rather than a shorter one.
 */

import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import type { ReactNode } from "react";
import { MOTION_ENABLED } from "@/components/motion/tokens";

export function MotionProvider({ children }: { children: ReactNode }) {
  if (!MOTION_ENABLED) return <>{children}</>;

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
