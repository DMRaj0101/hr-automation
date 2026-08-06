import { ChatMessage as ChatMessageType } from "@/types/monitoring";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="flex flex-col gap-1 animate-fade-in"
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        alignItems: isUser ? "flex-end" : "flex-start",
        maxWidth: "70%",
      }}
    >
      <div
        className="rounded-lg px-4 py-3 text-sm leading-relaxed shadow-sm transition-all hover:shadow-md"
        style={
          isUser
            ? {
                backgroundColor: "#14213D",
                color: "#fff",
                borderRadius: "16px 16px 4px 16px",
              }
            : {
                backgroundColor: "#f8f9fa",
                color: "#14213D",
                border: "1px solid #e5e7eb",
                borderRadius: "16px 16px 16px 4px",
              }
        }
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>

        {/* Copy button for agent messages */}
        {!isUser && (
          <button
            onClick={copyToClipboard}
            className="mt-2 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors"
            style={{
              color: "#666",
              backgroundColor: "#f0f0f0",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e0e0e0";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#f0f0f0";
            }}
          >
            {copied ? (
              <>
                <Check size={14} /> Copied
              </>
            ) : (
              <>
                <Copy size={14} /> Copy
              </>
            )}
          </button>
        )}
      </div>

      {/* Source badge only */}
      {!isUser && message.source && (
        <span
          className="px-2 py-0.5 text-[11px] font-medium rounded-full"
          style={{ backgroundColor: "#dbeafe", color: "#0ea5e9" }}
        >
          {message.source}
        </span>
      )}
    </div>
  );
} 