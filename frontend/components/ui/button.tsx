import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary:
      "bg-vantara-navy text-white border-0 hover:bg-vantara-gold",
    secondary:
      "bg-transparent text-vantara-navy border border-vantara-border hover:border-vantara-gold hover:text-vantara-gold",
    ghost: "bg-transparent text-vantara-navy border-0 hover:bg-vantara-muted-bg",
    danger: "bg-red-600 text-white border-0 hover:bg-red-700",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
