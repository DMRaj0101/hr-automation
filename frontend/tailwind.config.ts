import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vantara: {
          navy: "#14213D",
          "navy-deep": "#0A1226",
          gold: "#D9A653",
          bg: "#FAFAF9",
          border: "#E5E7EB",
          "muted-bg": "#F9FAFB",
          "text-muted": "#6B7280",
          "text-faint": "#9CA3AF",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
        "message-slide-in": {
          from: {
            opacity: "0",
            transform: "translateY(12px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(8px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        shimmer: {
          "0%, 100%": {
            opacity: "0.3",
          },
          "50%": {
            opacity: "1",
          },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 1.5s ease-in-out infinite",
        "message-in": "message-slide-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
        "fade-in": "fade-in 300ms ease-out",
        "fade-in-delayed": "fade-in 300ms ease-out 150ms both",
      },
    },
  },
  plugins: [],
};

export default config;