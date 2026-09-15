"use client";

import Link from "next/link";
import Image from "next/image";
import { useActionState } from "react";
import { signIn } from "@/lib/products/actions";

export default function CmsLoginPage() {
  const [state, formAction, pending] = useActionState(signIn, {});
  return (
    <main className="flex min-h-screen flex-col gap-6 overflow-hidden rounded-[30px] bg-[#f1f5f9]">
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
        <span className="ml-auto flex items-center gap-1 text-sm font-medium">
          <Image src="/cms-user.svg" alt="" width={16} height={16} />
          Admin
        </span>
      </div>
      <section className="flex justify-center px-6 pt-[150px]">
        <form
          className="w-full max-w-[350px] rounded-[32px] border border-[#e2e8f0] p-6"
          action={formAction}
        >
          <h1 className="text-center text-xl font-bold">Sign-in as Admin</h1>
          <div className="mt-2 space-y-4">
            <label className="block text-sm">
              E-mail
              <input
                className="cms-input"
                type="email"
                name="email"
                defaultValue="admin@qubesmart360.com"
              />
            </label>
            <label className="block text-sm">
              Password
              <input className="cms-input" type="password" name="password" />
            </label>
          </div>
          {state.error ? (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}
          <div className="mt-2 flex justify-end">
            <button
              disabled={pending}
              className="rounded-xl bg-[#3f3f46] px-6 py-2 text-sm font-bold text-white disabled:opacity-60"
              type="submit"
            >
              {pending ? "Signing in..." : "Sign-in"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
