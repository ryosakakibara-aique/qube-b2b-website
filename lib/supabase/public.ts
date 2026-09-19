import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";

/**
 * Cookie-free Supabase client for public reads.
 *
 * Public pages must not depend on request cookies: doing so forces every marketing route into
 * per-request dynamic rendering (see docs/DEVELOPMENT-PHASES.md §2.5). This client uses the
 * anonymous key and is therefore subject to the public RLS policies only.
 */
let publicClient: SupabaseClient | null | undefined;

export function getSupabasePublicClient(): SupabaseClient | null {
  if (publicClient !== undefined) return publicClient;

  const config = getSupabaseConfig();
  if (!config) {
    publicClient = null;
    return publicClient;
  }

  try {
    publicClient = createClient(config.url, config.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch (error) {
    // A malformed project URL makes `createClient` throw. That must not crash the route: it is
    // reported once and treated exactly like an unconfigured environment so callers can degrade
    // honestly instead of returning fabricated content or a 500.
    console.error("[supabase] Could not create the public client", error);
    publicClient = null;
  }

  return publicClient;
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfig() !== null;
}
