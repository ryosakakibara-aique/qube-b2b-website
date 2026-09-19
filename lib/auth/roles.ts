/**
 * Role policy.
 *
 * Deliberately free of I/O so the rules that encode the V1 decision (CLAUDE.md → Confirmed V1
 * Decisions, item 1) can be unit tested without a Next runtime or a database.
 */

export const USER_ROLES = ["admin", "editor", "viewer"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
};

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

/** Roles allowed to create and modify content. A `viewer` is read-only. */
export function canEditContent(role: UserRole): boolean {
  return role === "admin" || role === "editor";
}

/** Roles allowed to destroy content. */
export function canDeleteContent(role: UserRole): boolean {
  return role === "admin";
}

/**
 * Resolves the effective role of a signed-in account.
 *
 * Returns null when the account has not been approved by an operator. Having an account must not by
 * itself grant access: Supabase projects allow public sign-up by default, and the database enforces
 * the same rule in `public.current_user_role()`.
 */
export function resolveSessionRole(
  profile: { role?: unknown; approved?: unknown } | null | undefined,
): UserRole | null {
  if (!profile) return null;
  if (profile.approved !== true) return null;
  return isUserRole(profile.role) ? profile.role : null;
}

/**
 * The three states the CMS can be in for a visitor.
 *
 * `pending` is distinct from `anonymous` on purpose: an account that exists but has not been
 * approved should be told that, not shown an empty CMS that looks broken.
 */
export type AccessState =
  | { status: "anonymous" }
  | { status: "pending" }
  | { status: "active"; user: SessionUser };

export function resolveAccessState(
  account: { id: string; email: string } | null,
  profile: { role?: unknown; approved?: unknown } | null | undefined,
): AccessState {
  if (!account) return { status: "anonymous" };

  const role = resolveSessionRole(profile);
  if (!role) return { status: "pending" };

  return {
    status: "active",
    user: { id: account.id, email: account.email, role },
  };
}
