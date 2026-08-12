"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SimpleSelectProps {
  options: string[];
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function SimpleSelect({
  options,
  value,
  onChange,
  className,
  style,
}: SimpleSelectProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative" style={style}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "h-12 w-full rounded-xl border border-vantara-border bg-white px-4 text-sm text-vantara-navy focus:outline-none focus:ring-2 focus:ring-vantara-gold flex items-center justify-between gap-2",
          className
        )}
      >
        <span>{value}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={cn("transition-transform", open && "rotate-180")}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-vantara-border bg-white shadow-lg">
          {options.map((opt) => (
            <li
              key={opt}
              onClick={() => {
                onChange({ target: { value: opt } });
                setOpen(false);
              }}
              className={cn(
                "cursor-pointer px-4 py-2 text-sm",
                opt === value
                  ? "bg-vantara-navy text-white"
                  : "text-vantara-navy hover:bg-vantara-navy/10"
              )}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}