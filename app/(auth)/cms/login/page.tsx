import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { CmsLoginForm } from "@/components/cms/login-form";
import { Notice } from "@/components/ui/notice";

export const metadata: Metadata = {
  title: "CMS sign in",
  robots: { index: false, follow: false },
};

export default async function CmsLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col gap-6 overflow-hidden rounded-[var(--radius-shell)] bg-[var(--background)]">
      <div className="mx-auto flex h-[72px] w-full items-center px-6 lg:px-[200px]">
        <Link href="/" aria-label="QUBE home">
          <Image
            src="/cms-qube-logo.svg"
            alt="QUBE"
            width={99}
            height={32}
            priority
          />
        </Link>
      </div>
      <section className="flex flex-col items-center gap-4 px-6 pt-[150px]">
        {state === "pending" ? (
          <div className="w-full max-w-[350px]">
            <Notice variant="info">
              Your account exists but has not been approved for CMS access yet. An
              administrator has to grant access before you can sign in.
            </Notice>
          </div>
        ) : null}
        <CmsLoginForm />
      </section>
    </main>
  );
}
