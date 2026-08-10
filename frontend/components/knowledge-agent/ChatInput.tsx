import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2, MessagesSquare } from "lucide-react";
import { useState } from "react";

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  isLoading?: boolean;
}

const NAVY = "#14213D";
const GOLD = "#D9A653";

export function ChatInput({ value, onChange, onSend, isLoading = false }: ChatInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const isEmpty = !value.trim();

  const handleSend = () => {
    if (!isEmpty && !isLoading) onSend();
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-3 items-end">
        <div
          className="flex-1 relative transition-all duration-300"
          style={{
            borderRadius: 16,
            boxShadow: isFocused
              ? "0 0 0 3px rgba(217,166,83,0.18), 0 10px 28px rgba(20,33,61,0.14)"
              : "0 1px 3px rgba(20,33,61,0.08)",
          }}
        >
          <MessagesSquare
            size={17}
            strokeWidth={2}
            className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors duration-300"
            style={{ color: isFocused ? GOLD : "#9aa3b2" }}
          />

          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Ask about onboarding, policies, or team info..."
            disabled={isLoading}
            className="text-sm font-medium"
            style={{
              borderRadius: 16,
              borderColor: isFocused ? GOLD : "#e2e5ea",
              borderWidth: isFocused ? 2 : 1.5,
              transition: "all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              paddingLeft: 42,
              paddingRight: 16,
              height: 48,
              backgroundColor: isFocused ? "#fffdf8" : "#ffffff",
            }}
          />

          {isFocused && (
            <div
              className="absolute inset-x-3 bottom-[3px] h-[2px] rounded-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
                animation: "vt-shimmer 2s ease-in-out infinite",
              }}
            />
          )}
        </div>

        <Button
          onClick={handleSend}
          disabled={isEmpty || isLoading}
          className="flex items-center gap-2.5 transition-all duration-300 relative font-bold rounded-2xl"
          style={{
            height: 48,
            padding: "0 20px",
            backgroundColor: isEmpty ? "#c7cbd3" : NAVY,
            backgroundImage: isEmpty ? "none" : `linear-gradient(135deg, ${NAVY} 0%, #1c2c52 100%)`,
            color: "#ffffff",
            cursor: isEmpty || isLoading ? "not-allowed" : "pointer",
            boxShadow: isEmpty
              ? "0 2px 6px rgba(20,33,61,0.08)"
              : "0 6px 18px rgba(20,33,61,0.28), 0 0 0 1px rgba(217,166,83,0.15) inset",
          }}
          onMouseEnter={(e) => {
            if (!isEmpty && !isLoading) {
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 10px 24px rgba(20,33,61,0.36), 0 0 0 1px ${GOLD} inset`;
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = isEmpty
              ? "0 2px 6px rgba(20,33,61,0.08)"
              : "0 6px 18px rgba(20,33,61,0.28), 0 0 0 1px rgba(217,166,83,0.15) inset";
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={18} strokeWidth={2.5} className="animate-spin" style={{ color: GOLD }} />
              <span className="text-sm">Thinking</span>
              <span className="flex gap-0.5">
                <span className="vt-dot" style={{ animationDelay: "0ms" }} />
                <span className="vt-dot" style={{ animationDelay: "150ms" }} />
                <span className="vt-dot" style={{ animationDelay: "300ms" }} />
              </span>
            </>
          ) : (
            <>
              <Send size={17} strokeWidth={2.5} style={{ transform: isEmpty ? "none" : "translateX(1px)" }} />
              <span className="hidden sm:inline text-sm">Send</span>
            </>
          )}
        </Button>
      </div>

      <div
        className="px-1 text-[11px] font-medium overflow-hidden transition-all duration-300"
        style={{ color: "#9aa3b2", maxHeight: isFocused ? 16 : 0, opacity: isFocused ? 1 : 0 }}
      >
        Enter to send &nbsp;·&nbsp; Shift + Enter for a new line
      </div>

      <style>{`
        @keyframes vt-shimmer { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
        .vt-dot { width: 4px; height: 4px; border-radius: 999px; background: ${GOLD}; display: inline-block; animation: vt-bounce 1s ease-in-out infinite; }
        @keyframes vt-bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.5; } 40% { transform: translateY(-3px); opacity: 1; } }
      `}</style>
    </div>
  );
}