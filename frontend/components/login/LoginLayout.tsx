"use client";

import { ReactNode } from "react";

interface LoginLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

export default function LoginLayout({
  left,
  right,
}: LoginLayoutProps) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-white">

      {/* Exact 50 / 50 Split */}
      <div className="grid h-full w-full grid-cols-2">

        {/* Left Panel */}
        <section className="relative h-full overflow-hidden">
          {left}
        </section>

        {/* Right Panel */}
        <section className="flex h-full items-center justify-center bg-white">

          <div className="w-full max-w-[500px] px-8">
            {right}
          </div>

        </section>

      </div>

    </div>
  );
}