import type { ReactNode } from "react";
import { MotionProvider } from "@/components/motion/provider";

/**
 * The marketing route group's layout.
 *
 * The group previously had no layout of its own, which is why this file is new rather than edited.
 * It exists for one reason: to scope the motion context to the public pages. Mounting it in the root
 * layout instead would load the animation runtime into `/cms/*`, which has no motion and no reason to
 * pay for it.
 *
 * It renders no element of its own — `MotionProvider` is context only — so the DOM of every page in
 * this group is unchanged.
 */
export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <MotionProvider>{children}</MotionProvider>;
}
