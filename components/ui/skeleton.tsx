import type { HTMLAttributes } from "react";

/**
 * Neutral loading placeholder.
 *
 * Figma defines no loading frames, so this stays deliberately plain rather than inventing a visual
 * language: the design's muted surface token, the documented control radius, and no animation when
 * the visitor has asked for reduced motion (handled by the `.skeleton` rule in globals.css).
 */
export function Skeleton({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton rounded-[var(--radius-control)] ${className}`.trim()}
      {...rest}
    />
  );
}
