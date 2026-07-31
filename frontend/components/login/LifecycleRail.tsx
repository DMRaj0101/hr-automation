"use client";

const STAGES = [
  {
    id: "01",
    title: "Onboarding",
    description:
      "Every new hire moves from signed offer to a confident first day, automatically.",
    active: true,
  },
  {
    id: "02",
    title: "Offboarding",
    description:
      "When someone leaves, access, assets, and paperwork are wrapped up cleanly.",
    active: false,
  },
];

export default function LifecycleRail() {
  return (
    <div className="relative mt-10">
      <div className="space-y-8">
        {STAGES.map((stage, index) => (
          <div key={stage.id} className="relative flex items-start gap-5">
            {/* Line (only between items) */}
            {index !== STAGES.length - 1 && (
              <div
                className="absolute left-[18px] top-9 h-[92px] w-[2px] overflow-hidden rounded-full"
                style={{
                  background:
                    "linear-gradient(to bottom, rgba(217,166,83,.35), rgba(79,209,197,.35))",
                }}
              >
                <span className="pulse pulse1" />
                <span className="pulse pulse2" />
              </div>
            )}

            {/* Circle */}
            <div
              className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-500 ${
                stage.active
                  ? "border-[#D9A653] bg-[#D9A653] text-[#14213D] shadow-[0_0_20px_rgba(217,166,83,.4)]"
                  : "border-[#42C6D8] bg-[#10213E] text-[#42C6D8]"
              }`}
            >
              {stage.id}
            </div>

            {/* Content */}
            <div className="pt-[2px]">
              <h3 className="text-[18px] font-semibold text-white">
                {stage.title}
              </h3>

              <p
                className="mt-1 max-w-[420px] text-[14px] leading-7"
                style={{
                  color: "rgba(255,255,255,.58)",
                }}
              >
                {stage.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .pulse {
          position: absolute;
          left: -2px;
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: #4fd1c5;
          box-shadow:
            0 0 8px #4fd1c5,
            0 0 18px rgba(79, 209, 197, 0.8);
          animation: travel 3.5s linear infinite;
        }

        .pulse2 {
          animation-delay: 1.75s;
        }

        @keyframes travel {
          0% {
            top: 0%;
            opacity: 0;
            transform: scale(0.5);
          }

          10% {
            opacity: 1;
            transform: scale(1);
          }

          90% {
            opacity: 1;
          }

          100% {
            top: calc(100% - 6px);
            opacity: 0;
            transform: scale(0.5);
          }
        }
      `}</style>
    </div>
  );
}