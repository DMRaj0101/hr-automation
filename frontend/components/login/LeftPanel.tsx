"use client";

import { Logo } from "@/components/common/Logo";
import AnimatedBackground from "./AnimatedBackground";
import LifecycleRail from "./LifecycleRail";

export default function LeftPanel() {
  return (
    <div
      className="relative h-full overflow-hidden text-white"
      style={{
        background:
          "linear-gradient(160deg,#14213D 0%,#0A1226 55%,#08101F 100%)",
      }}
    >
      {/* Background */}
      <AnimatedBackground />

      {/* Gold Top Border */}
      <div
        className="absolute top-0 left-0 h-[3px] w-full"
        style={{
          background:
            "linear-gradient(90deg,#D9A653 0%,rgba(217,166,83,.5) 60%,transparent)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-between px-20 py-14">

       {/* ================= Header ================= */}

<div className="pt-2">

  <div className="flex items-center gap-5">

    <div className="relative">

      {/* Glow */}
      <div className="absolute inset-0 rounded-lg bg-[#D9A653] blur-xl opacity-40 animate-pulse" />

      {/* Logo Box */}
      <div className="relative h-12 w-12 rounded-md bg-[#D9A653] shadow-xl shadow-[#D9A653]/40 animate-float" />

    </div>

    <div>

      <h2 className="text-[30px] font-extrabold tracking-[0.22em] text-white">
        VANTARA
      </h2>

      <p
        className="mt-1 uppercase text-[13px] font-semibold tracking-[0.45em]"
        style={{ color: "#D9A653" }}
      >
        PEOPLE OPERATIONS PLATFORM
      </p>

    </div>

  </div>

</div>

       {/* ================= Hero ================= */}

<div className="-mt-2">

  <h1
    className="text-[18px] font-normal leading-[40px] text-white whitespace-nowrap"
    style={{
      color: "rgba(255,255,255,.95)",
    }}
  >
    One system for every stage of the employee lifecycle.
  </h1>

  <div className="mt-12">
    <LifecycleRail />
  </div>

</div>

        {/* ================= Footer ================= */}

        <div>

          <div
            className="mb-5 h-px w-full"
            style={{
              background:
                "linear-gradient(90deg,rgba(255,255,255,.12),transparent)",
            }}
          />

          <p
            className="text-xs"
            style={{
              color: "rgba(255,255,255,.45)",
            }}
          >
            © {new Date().getFullYear()} Vantara. All rights reserved.
          </p>

        </div>

      </div>

      {/* Animation */}

      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
          100% {
            transform: translateY(0px);
          }
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
}