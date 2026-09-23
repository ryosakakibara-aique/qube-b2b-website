import type { NextConfig } from "next";

/**
 * Allows next/image to optimise CMS-uploaded product imagery served from Supabase Storage.
 * Derived from the configured project URL rather than hardcoded, so no host is invented.
 */
function supabaseStoragePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return [];

  try {
    const { hostname, protocol } = new URL(raw);
    return [
      {
        protocol: protocol === "http:" ? "http" : "https",
        hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    console.warn(
      `[next.config] NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${raw}`,
    );
    return [];
  }
}

const nextConfig: NextConfig = {
  /*
    The CMS uploads product images through a Server Action, and Next refuses a Server Action request
    body larger than this (1 MiB by default). It is raised to 6 MB so the 5 MB image cap is actually
    reachable — at the default, anything bigger was refused with a 413 before validation ran. The
    extra megabyte is headroom for the multipart boundaries and part headers that travel with the
    file. `lib/media/storage.ts` records the same figure, and a test keeps the two in step.
  */
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  images: {
    remotePatterns: supabaseStoragePatterns(),
  },
};

export default nextConfig;
