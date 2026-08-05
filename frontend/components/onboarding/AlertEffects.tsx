"use client";

import React from "react";

interface EffectProps {
  color: string;
}

/* ==========================================================
   SERVER EFFECT (Critical)
========================================================== */

export function ServerEffect({ color }: EffectProps) {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 w-[250px] overflow-hidden">

      <svg
        viewBox="0 0 320 220"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <defs>

          <radialGradient
            id="serverGlow"
            cx="50%"
            cy="50%"
            r="70%"
          >
            <stop
              offset="0%"
              stopColor={color}
              stopOpacity=".16"
            />
            <stop
              offset="100%"
              stopColor={color}
              stopOpacity="0"
            />
          </radialGradient>

        </defs>

        <ellipse
          cx="250"
          cy="112"
          rx="120"
          ry="105"
          fill="url(#serverGlow)"
        />

        {/* Decorative Waves */}

        <path
          d="M120 220 C180 170 205 150 240 110 S290 40 320 10"
          stroke={color}
          strokeOpacity=".20"
          strokeWidth="2"
        />

        <path
          d="M150 220 C205 175 225 145 255 105 S300 45 320 25"
          stroke={color}
          strokeOpacity=".15"
          strokeWidth="1.6"
        />

        <path
          d="M170 220 C225 180 245 160 275 120 S305 70 320 50"
          stroke={color}
          strokeOpacity=".12"
          strokeWidth="1.4"
        />

        {/* Server Stack */}

        <g transform="translate(210 48)">

          {[0, 38, 76].map((y) => (

            <g key={y}>

              <rect
                x="0"
                y={y}
                width="82"
                height="28"
                rx="10"
                fill={color}
                opacity=".18"
              />

              <rect
                x="0"
                y={y}
                width="82"
                height="28"
                rx="10"
                stroke={color}
                strokeWidth="1.5"
              />

              <line
                x1="15"
                x2="42"
                y1={y + 14}
                y2={y + 14}
                stroke={color}
                strokeWidth="2"
              />

              <circle
                cx="62"
                cy={y + 14}
                r="2.5"
                fill={color}
              />

              <circle
                cx="71"
                cy={y + 14}
                r="2.5"
                fill={color}
              />

            </g>

          ))}

        </g>

      </svg>

    </div>
  );
}

/* ==========================================================
   CLIPBOARD EFFECT (High)
========================================================== */

export function ClipboardEffect({ color }: EffectProps) {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 w-[250px] overflow-hidden">

      <svg
        viewBox="0 0 320 220"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >

        <defs>

          <radialGradient id="clipGlow">

            <stop
              offset="0%"
              stopColor={color}
              stopOpacity=".16"
            />

            <stop
              offset="100%"
              stopColor={color}
              stopOpacity="0"
            />

          </radialGradient>

        </defs>

        <ellipse
          cx="248"
          cy="120"
          rx="110"
          ry="90"
          fill="url(#clipGlow)"
        />

        <rect
          x="225"
          y="48"
          width="68"
          height="98"
          rx="8"
          stroke={color}
          strokeWidth="2"
          opacity=".45"
        />

        <rect
          x="243"
          y="37"
          width="34"
          height="16"
          rx="5"
          stroke={color}
          strokeWidth="2"
        />

        {[72, 90, 108].map((y) => (

          <line
            key={y}
            x1="240"
            x2="278"
            y1={y}
            y2={y}
            stroke={color}
            strokeWidth="2"
          />

        ))}

        <line
          x1="285"
          y1="118"
          x2="304"
          y2="99"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
        />

      </svg>

    </div>
  );
}
/* ==========================================================
   CLOUD EFFECT (Medium)
========================================================== */

export function CloudEffect({ color }: EffectProps) {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 w-[250px] overflow-hidden">

      <svg
        viewBox="0 0 320 220"
        className="absolute inset-0 h-full w-full"
        fill="none"
      >
        <defs>

          <radialGradient id="cloudGlow">

            <stop
              offset="0%"
              stopColor={color}
              stopOpacity=".16"
            />

            <stop
              offset="100%"
              stopColor={color}
              stopOpacity="0"
            />

          </radialGradient>

        </defs>

        <ellipse
          cx="248"
          cy="118"
          rx="120"
          ry="92"
          fill="url(#cloudGlow)"
        />

        {/* Cloud */}

        <g opacity=".28">

          <circle
            cx="240"
            cy="92"
            r="24"
            fill={color}
          />

          <circle
            cx="266"
            cy="82"
            r="30"
            fill={color}
          />

          <circle
            cx="292"
            cy="96"
            r="22"
            fill={color}
          />

          <rect
            x="220"
            y="96"
            width="90"
            height="34"
            rx="17"
            fill={color}
          />

        </g>

        {/* Document */}

        <rect
          x="250"
          y="84"
          width="34"
          height="44"
          rx="5"
          fill={color}
          opacity=".9"
        />

        <line
          x1="260"
          x2="274"
          y1="97"
          y2="97"
          stroke="white"
          strokeWidth="2"
        />

        <line
          x1="260"
          x2="274"
          y1="105"
          y2="105"
          stroke="white"
          strokeWidth="2"
        />

        <line
          x1="260"
          x2="274"
          y1="113"
          y2="113"
          stroke="white"
          strokeWidth="2"
        />

      </svg>

    </div>
  );
}

/* ==========================================================
   DEFAULT EXPORT
========================================================== */

interface AlertEffectsProps {
  severity: string;
}

export default function AlertEffects({
  severity,
}: AlertEffectsProps) {

  switch (severity) {

    case "critical":
      return (
        <ServerEffect color="#EF4444" />
      );

    case "high":
      return (
        <ClipboardEffect color="#F59E0B" />
      );

    case "medium":
    default:
      return (
        <CloudEffect color="#2563EB" />
      );
  }
}