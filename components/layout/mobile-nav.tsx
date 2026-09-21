"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { MOTION_ENABLED } from "@/components/motion/tokens";
import { panelDrop } from "@/components/motion/variants";

type NavItem = { href: string; label: string };

/**
 * Collapsible navigation for narrow viewports.
 *
 * The public frames this project can read are desktop-only — `docs/design/screenshots/` is absent and
 * the committed exports were outline-converted — so the collapsed state follows the existing tokens
 * rather than a measured mobile design. The interaction itself is standard: a disclosure button,
 * `aria-expanded`/`aria-controls` wiring, Escape to close with focus returned to the button, and
 * closing on navigation.
 */
export function MobileNav({
  items,
  accountItem,
  cta,
}: {
  items: NavItem[];
  accountItem: NavItem;
  cta: NavItem;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => setOpen(false);

  const panelClassName =
    "absolute inset-x-0 top-[72px] z-50 border-b border-[var(--border-subtle)] bg-[var(--background)] px-6 py-4";

  const panel = (
    <>
      <ul className="flex flex-col">
        {[...items, accountItem].map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={close}
              className="block py-2 text-sm font-medium text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={cta.href}
        onClick={close}
        className="cta-gradient mt-2 inline-flex w-full items-center justify-center rounded-[var(--radius-control)] px-5 py-3 text-sm font-bold text-[var(--brand-foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
      >
        {cta.label}
      </Link>
    </>
  );

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-chip)] border border-[var(--border)] text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="h-5 w-5"
        >
          {open ? (
            <>
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </>
          ) : (
            <>
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </>
          )}
        </svg>
      </button>

      {/* Enter and exit both animate. This panel is the one real overlay in the public site, so it
          is the one place `AnimatePresence` is used — route changes deliberately do not animate
          their exit, because the App Router discards the outgoing tree.

          The panel body is built once and the element around it depends on the kill switch, so
          turning motion off cannot leave this panel stuck at its hidden state with no runtime left
          to animate it in. */}
      <AnimatePresence>
        {open ? (
          MOTION_ENABLED ? (
            <m.nav
              id="mobile-navigation"
              aria-label="Primary navigation"
              variants={panelDrop}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={panelClassName}
            >
              {panel}
            </m.nav>
          ) : (
            <nav
              id="mobile-navigation"
              aria-label="Primary navigation"
              className={panelClassName}
            >
              {panel}
            </nav>
          )
        ) : null}
      </AnimatePresence>
    </div>
  );
}
