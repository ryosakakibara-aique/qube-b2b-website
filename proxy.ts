import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabaseConfig } from "@/lib/supabase/config";

const LOGIN_PATH = "/cms/login";

/**
 * Session refresh and the authentication gate for every /cms route.
 *
 * Next.js 16 runs this file as the request proxy (formerly `middleware.ts`).
 * Authorization (which role may do what) is enforced server-side in the data layer and by RLS —
 * this only decides whether a request may reach the CMS at all, and it fails closed.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const config = getSupabaseConfig();
  const isLoginPath = request.nextUrl.pathname === LOGIN_PATH;

  const closeCms = () =>
    isLoginPath ? response : NextResponse.redirect(new URL(LOGIN_PATH, request.url));

  // Without usable credentials no session can be verified, so the CMS stays closed rather than
  // falling back to serving it unauthenticated.
  if (!config) {
    return closeCms();
  }

  let supabase;
  try {
    supabase = createServerClient(config.url, config.anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
  } catch (error) {
    console.error("[proxy] Could not create the Supabase client", error);
    return closeCms();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isLoginPath) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }
  if (user && isLoginPath) {
    return NextResponse.redirect(new URL("/cms/products", request.url));
  }

  return response;
}

export const config = { matcher: ["/cms/:path*"] };
