"use client";

import { ReactNode } from "react";

export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="vantara-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="glass vantara-modal">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-3.5 text-lg text-vantara-text-muted transition-colors hover:text-vantara-navy"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

export function ModalRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div
      className="flex justify-between py-2.5 text-[13.5px]"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
    >
      <span className="text-vantara-text-muted">{label}</span>
      <span className="text-right font-bold text-vantara-navy">{value}</span>
    </div>
  );
}