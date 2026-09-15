import { SiteNav } from "@/components/layout/site-nav";

export function CmsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden rounded-[30px] bg-[#f1f5f9]">
      <SiteNav admin />
      <main className="mx-auto min-h-[calc(100vh-72px)] w-full max-w-[1040px] px-6 py-8 lg:px-0 lg:py-12">
        {children}
      </main>
    </div>
  );
}
