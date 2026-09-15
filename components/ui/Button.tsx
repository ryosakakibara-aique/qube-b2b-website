import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "dark" | "accent";

const variantClasses: Record<ButtonVariant, string> = {
  dark: "bg-[#27272a]",
  accent: "bg-[#10b9b8]",
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
      className={`inline-flex items-center justify-center rounded-xl px-5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 ${variantClasses[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
