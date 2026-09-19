import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "dark" | "accent";

const variantClasses: Record<ButtonVariant, string> = {
  dark: "bg-[var(--surface-dark)] text-white",
  accent: "cta-gradient text-[var(--brand-foreground)]",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({
  variant = "dark",
  className = "",
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center rounded-[var(--radius-control)] px-5 py-2 text-xs font-bold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)] disabled:opacity-60 ${variantClasses[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
