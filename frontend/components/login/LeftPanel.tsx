"use client";

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

          <div className="flex items-center gap-6">

            {/* ---- V Logo Box (rotating) ---- */}
            <div className="v-box-wrap">
              <div className="v-box">
                <span className="v-box-shine" />
                <span className="v-letter">V</span>
              </div>
            </div>

            {/* ---- Wordmark ---- */}
            <div>
              <h2
                className="text-[38px] font-bold tracking-[0.12em] text-white leading-none"
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              >
                VANTARA
              </h2>

              {/* underline */}
              <div
                className="mt-2 h-[2px] w-[210px]"
                style={{
                  background:
                    "linear-gradient(90deg,#D9A653 0%,rgba(217,166,83,.1) 100%)",
                }}
              />

              <p
                className="mt-2 uppercase text-[12px] font-semibold tracking-[0.32em] leading-none"
                style={{ color: "#D9A653" }}
              >
                People Operations Platform
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

            One system. Every stage of the employee lifecycle.
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
        .v-box-wrap{
          display: inline-flex;
          perspective: 900px;
        }

        .v-box{
          position: relative;
          width: 96px;
          height: 96px;
          border-radius: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;

          background: linear-gradient(155deg,#F0C97A 0%,#D9A653 45%,#B8813A 100%);

          box-shadow:
            0 0 30px rgba(217,166,83,.4),
            0 0 70px rgba(217,166,83,.15),
            inset 0 2px 4px rgba(255,255,255,.5),
            inset 0 -6px 10px rgba(0,0,0,.2);

          transform-style: preserve-3d;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          will-change: transform;
          animation: vBoxRotate 6s ease-in-out infinite;
        }

        .v-box-shine{
          position: absolute;
          top: -40%;
          left: -160%;
          width: 55%;
          height: 220%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255,255,255,.55),
            transparent
          );
          transform: rotate(20deg);
          animation: vBoxShine 4.5s linear infinite;
        }

        .v-letter{
          position: relative;
          z-index: 2;
          color: #14213D;
          font-size: 52px;
          font-weight: 900;
          font-family: 'Playfair Display', Georgia, serif;
        }

        @keyframes vBoxRotate{
          0%, 100%{
            transform: rotateY(0deg) rotateX(0deg) translateZ(0);
          }
          25%{
            transform: rotateY(18deg) rotateX(4deg) translateZ(0);
          }
          50%{
            transform: rotateY(0deg) rotateX(0deg) translateZ(0);
          }
          75%{
            transform: rotateY(-18deg) rotateX(-4deg) translateZ(0);
          }
        }

        @keyframes vBoxShine{
          from{ left: -160%; }
          to{ left: 200%; }
        }
      `}</style>

    </div>
  );
}