import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  try {
    return createServerClient(config.url, config.anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot always write cookies; the request proxy handles refreshes.
          }
        },
      },
    });
  } catch (error) {
    // A malformed project URL must not turn every CMS route into a 500. Report it and let callers
    // render an explicit unconfigured state.
    console.error("[supabase] Could not create the server client", error);
    return null;
  }
}
