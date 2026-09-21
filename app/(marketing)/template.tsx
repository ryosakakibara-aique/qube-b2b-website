"use client";

/**
 * The entrance a marketing route plays as the visitor moves between pages.
 *
 * Enter only, by design. The App Router unmounts the outgoing tree as soon as a navigation commits,
 * so an exit animation needs a frozen-router workaround that interferes with streaming and server
 * components; `template.tsx` is Next's own answer, and it re-mounts on every navigation, which is
 * exactly the hook this needs.
 *
 * The first load is deliberately not animated. `initial={false}` renders the route at its final
 * state, so a hard load paints immediately instead of waiting on hydration to fade the page in — the
 * difference between a fast first paint and a slow one on a cold visit.
 */

import { useEffect } from "react";
import type { ReactNode } from "react";
import * as m from "motion/react-m";
import { MOTION_ENABLED } from "@/components/motion/tokens";
import { routeEnter } from "@/components/motion/variants";

/**
 * Module scope, so it survives navigation: the first mount of the session is a load, every later one
 * is a client-side route change.
 */
let hasRenderedOnce = false;

export default function MarketingTemplate({
  children,
}: {
  children: ReactNode;
}) {
  useEffect(() => {
    hasRenderedOnce = true;
  }, []);

  if (!MOTION_ENABLED) return <>{children}</>;

  return (
    <m.div
      variants={routeEnter}
      initial={hasRenderedOnce ? "hidden" : false}
      animate="visible"
    >
      {children}
    </m.div>
  );
}
