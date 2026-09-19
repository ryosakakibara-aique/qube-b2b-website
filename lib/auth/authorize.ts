import { canEditContent, type SessionUser } from "@/lib/auth/roles";
import { getSessionUser } from "@/lib/auth/session";

/**
 * Server-side authorization guards.
 *
 * Every mutation calls one of these. Client-side role checks are presentation only — RLS is the
 * final authority, and these guards keep the error messages useful before the database refuses.
 */

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthorizationError("Your session has expired. Please sign in again.");
  return user;
}

export async function requireEditor(): Promise<SessionUser> {
  const user = await requireSession();
  if (!canEditContent(user.role)) {
    throw new AuthorizationError("Your account does not have permission to change content.");
  }
  return user;
}
