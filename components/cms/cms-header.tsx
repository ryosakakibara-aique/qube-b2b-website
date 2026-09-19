import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/lib/products/actions";
import type { SessionUser, UserRole } from "@/lib/auth/roles";

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrator",
  editor: "Editor",
  viewer: "Viewer",
};

/**
 * CMS header: navigation, identity and session controls. Deliberately free of product-specific
 * logic.
 */
export function CmsHeader({ user }: { user: SessionUser | null }) {
  return (
    <header className="border-b border-[var(--border-subtle)] bg-[var(--background)]">
      <div className="mx-auto flex h-[72px] w-full max-w-[1040px] items-center gap-6 px-6 lg:px-0">
        <Link href="/cms/products" className="shrink-0" aria-label="QUBE CMS home">
          <Image
            src="/cms-qube-logo.svg"
            alt="QUBE"
            width={99}
            height={32}
            priority
          />
        </Link>

        {user ? (
          <>
            <nav aria-label="CMS sections" className="flex items-center gap-4 text-sm">
              <Link
                href="/cms/products"
                className="font-medium transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
              >
                Products
              </Link>
              {user.role === "admin" ? (
                <Link
                  href="/cms/inquiries"
                  className="font-medium transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                >
                  Inquiries
                </Link>
              ) : null}
            </nav>

            <div className="ml-auto flex items-center gap-4 text-sm">
              <p className="flex items-center gap-1">
                <Image src="/cms-user.svg" alt="" width={16} height={16} />
                <span className="font-medium">{user.email}</span>
                <span className="text-[var(--text-muted)]">
                  &middot; {ROLE_LABELS[user.role]}
                </span>
              </p>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-[var(--radius-chip)] border border-[var(--border)] px-3 py-1 text-xs font-bold transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
                >
                  Sign out
                </button>
              </form>
            </div>
          </>
        ) : null}
      </div>
    </header>
  );
}
