/**
 * Supabase connection configuration.
 *
 * The dashboard exposes several URLs for one project — the project URL, the Data API URL, the
 * pooler URL — and only the project URL is correct for a client. Pasting one of the others does not
 * fail loudly: `createClient` accepts any URL and then builds requests against the wrong paths, so
 * every read and write breaks with an opaque PostgREST error.
 *
 * A Supabase project URL is always an origin, so anything beyond it is discarded here.
 */

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

/** Returns the project origin, or null when the value is missing or unusable. */
export function resolveSupabaseUrl(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;

  try {
    const { origin, protocol } = new URL(value);
    if (protocol !== "https:" && protocol !== "http:") return null;
    return origin;
  } catch {
    return null;
  }
}

export function getSupabaseConfig(): SupabaseConfig | null {
  const url = resolveSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}
