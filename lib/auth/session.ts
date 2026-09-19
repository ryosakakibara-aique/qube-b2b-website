import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  resolveAccessState,
  type AccessState,
  type SessionUser,
} from "@/lib/auth/roles";

/**
 * Session resolution.
 *
 * Roles come from `public.profiles`, never from client-supplied data, and an account that has not
 * been approved resolves to no access at all. Row level security applies the same rule
 * independently, so this is about presenting the right interface rather than about protection.
 *
 * Wrapped in React's `cache` so the layout and the page it renders share one lookup per request
 * instead of each performing their own.
 */
export const getAccessState = cache(async (): Promise<AccessState> => {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { status: "anonymous" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { status: "anonymous" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, approved")
    .eq("id", user.id)
    .maybeSingle();

  return resolveAccessState(
    { id: user.id, email: user.email ?? "" },
    profile,
  );
});

/** The signed-in staff member, or null for anyone without approved access. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const access = await getAccessState();
  return access.status === "active" ? access.user : null;
}
