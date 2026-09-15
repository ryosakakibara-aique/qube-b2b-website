import { CmsShell } from "@/components/cms/cms-shell";

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return <CmsShell>{children}</CmsShell>;
}
