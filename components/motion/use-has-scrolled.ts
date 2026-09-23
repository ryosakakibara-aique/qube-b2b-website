"use client";

import { useEffect, useState } from "react";

/**
 * "The visitor has scrolled" — as a one-way latch, with the shared threshold that decides it.
 *
 * This exists because the hero sits inside the first screen: anything triggered by visibility alone
 * fires on load, so a rule that is meant to wait for a scroll needs a scroll signal, and a scroll
 * position cannot be read from an IntersectionObserver threshold.
 *
 * The listener removes itself once it has fired, because after that the answer never changes again.
 * Keeping the threshold here rather than in each consumer means the reveal and the video's playback
 * cannot disagree about when the visitor has "started scrolling".
 */
export const SCROLL_THRESHOLD_PX = 120;

export function useHasScrolled(threshold: number = SCROLL_THRESHOLD_PX): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (scrolled) return;

    const onScroll = () => {
      if (window.scrollY > threshold) setScrolled(true);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [scrolled, threshold]);

  return scrolled;
}
