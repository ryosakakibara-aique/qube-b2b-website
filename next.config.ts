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
  images: {
    remotePatterns: supabaseStoragePatterns(),
  },
};

export default nextConfig;
