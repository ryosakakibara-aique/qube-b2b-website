import { CmsHeader } from "@/components/cms/cms-header";
import type { SessionUser } from "@/lib/auth/roles";

export function CmsShell({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-hidden rounded-[var(--radius-shell)] bg-[var(--background)]">
      <CmsHeader user={user} />
      <main className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1040px] px-6 py-8 lg:px-0 lg:py-12">
        {children}
      </main>
    </div>
  );
}
