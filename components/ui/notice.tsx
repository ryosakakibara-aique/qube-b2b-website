import type { ReactNode } from "react";

type NoticeVariant = "info" | "error" | "success";

const variantClasses: Record<NoticeVariant, string> = {
  info: "border-[var(--border)] bg-[var(--surface)]",
  error: "border-red-300 bg-red-50 text-red-800",
  success: "border-[var(--brand-2)] bg-[var(--surface)]",
};

/**
 * Inline feedback for empty, error and success states, shared by the CMS and the public site.
 * Errors are announced immediately; successes are announced politely.
 */
export function Notice({
  variant = "info",
  children,
}: {
  variant?: NoticeVariant;
  children: ReactNode;
}) {
  const role = variant === "error" ? "alert" : variant === "success" ? "status" : undefined;

  return (
    <p
      role={role}
      className={`rounded-[var(--radius-card-sm)] border px-4 py-3 text-xs ${variantClasses[variant]}`}
    >
      {children}
    </p>
  );
}
