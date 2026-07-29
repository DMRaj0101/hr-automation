import * as React from "react";
import { cn } from "@/lib/utils";

interface SimpleSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: string[];
}

export function SimpleSelect({ options, className, ...props }: SimpleSelectProps) {
  return (
    <select
      className={cn(
        "h-12 rounded-xl border border-vantara-border bg-white px-4 text-sm text-vantara-navy focus:outline-none focus:ring-2 focus:ring-vantara-gold",
        className
      )}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
