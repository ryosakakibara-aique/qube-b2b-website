import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CmsShell } from "@/components/cms/cms-shell";
import { getAccessState } from "@/lib/auth/session";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CmsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await getAccessState();

  // An account that exists but has not been approved is sent to the sign-in screen, which explains
  // the situation, rather than being shown an empty CMS that looks broken.
  if (access.status === "pending") redirect("/cms/login?state=pending");

  return (
    <CmsShell user={access.status === "active" ? access.user : null}>
      {children}
    </CmsShell>
  );
}
