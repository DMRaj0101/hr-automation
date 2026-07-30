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
      },
      animation: {
        "pulse-dot": "pulse-dot 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
