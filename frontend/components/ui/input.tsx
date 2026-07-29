import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-xl border border-vantara-border bg-white px-4 text-sm text-vantara-navy placeholder:text-vantara-text-faint focus:outline-none focus:ring-2 focus:ring-vantara-gold",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
