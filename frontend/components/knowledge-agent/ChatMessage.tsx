import { ChatMessage as ChatMessageType } from "@/types/monitoring";
import { Copy, Check, Sparkles } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const NAVY = "#14213D";
const GOLD = "#D9A653";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex w-full vt-msg-in" style={{ justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div
        className="flex items-end gap-2.5"
        style={{ flexDirection: isUser ? "row-reverse" : "row", maxWidth: "78%", minWidth: 0 }}
      >
        <div
          className="flex items-center justify-center shrink-0 rounded-full font-bold"
          style={{
            width: 30,
            height: 30,
            minWidth: 30,
            fontSize: 12,
            backgroundColor: isUser ? NAVY : "#fff",
            color: isUser ? "#fff" : NAVY,
            border: isUser ? "none" : `1.5px solid ${GOLD}`,
            boxShadow: isUser ? "0 2px 6px rgba(20,33,61,0.25)" : "0 2px 6px rgba(217,166,83,0.2)",
          }}
        >
          {isUser ? "U" : <Sparkles size={14} strokeWidth={2.5} style={{ color: GOLD }} />}
        </div>

        <div className="flex flex-col gap-1.5 min-w-0" style={{ alignItems: isUser ? "flex-end" : "flex-start" }}>
          <div
            className="relative px-4 py-3 text-sm leading-relaxed transition-all duration-200 hover:-translate-y-[1px]"
            style={
              isUser
                ? {
                    backgroundColor: NAVY,
                    backgroundImage: "linear-gradient(135deg, #14213D 0%, #1c2c52 100%)",
                    color: "#fff",
                    borderRadius: "16px 16px 4px 16px",
                    boxShadow: "0 4px 14px rgba(20,33,61,0.22)",
                  }
                : {
                    backgroundColor: "#fffdf8",
                    color: NAVY,
                    border: "1px solid #ece6d8",
                    borderLeft: `3px solid ${GOLD}`,
                    borderRadius: "4px 16px 16px 16px",
                    boxShadow: "0 2px 8px rgba(20,33,61,0.06)",
                  }
            }
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
            ) : (
              <div className="vt-markdown break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Wide tables must scroll inside their own container
                    // rather than blow out the narrow (78%-max-width) chat
                    // bubble.
                    table: ({ children }) => (
                      <div className="vt-markdown-table-wrap">
                        <table>{children}</table>
                      </div>
                    ),
                  }}
                >
                  {message.text}
                </ReactMarkdown>
              </div>
            )}

            {!isUser && (
              <button
                onClick={copyToClipboard}
                className="mt-2.5 flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors"
                style={{
                  color: copied ? "#2f7a4d" : "#8b8371",
                  backgroundColor: copied ? "rgba(47,122,77,0.1)" : "rgba(217,166,83,0.1)",
                }}
                onMouseEnter={(e) => { if (!copied) e.currentTarget.style.backgroundColor = "rgba(217,166,83,0.2)"; }}
                onMouseLeave={(e) => { if (!copied) e.currentTarget.style.backgroundColor = "rgba(217,166,83,0.1)"; }}
              >
                {copied ? (<><Check size={12} /> Copied</>) : (<><Copy size={12} /> Copy</>)}
              </button>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes vt-msg-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .vt-msg-in { animation: vt-msg-in 280ms ease-out; }

        .vt-markdown > *:first-child { margin-top: 0; }
        .vt-markdown > *:last-child { margin-bottom: 0; }
        .vt-markdown p { margin: 0 0 8px; line-height: 1.6; }
        .vt-markdown ul, .vt-markdown ol { margin: 0 0 8px; padding-left: 20px; }
        .vt-markdown li { margin-bottom: 2px; }
        .vt-markdown strong { font-weight: 700; }
        .vt-markdown code { background: rgba(20,33,61,0.06); border-radius: 4px; padding: 1px 5px; font-size: 0.85em; }
        .vt-markdown a { color: ${GOLD}; text-decoration: underline; }
        .vt-markdown-table-wrap { overflow-x: auto; margin: 0 0 8px; }
        .vt-markdown table { border-collapse: collapse; width: 100%; margin: 0; font-size: 0.92em; }
        .vt-markdown th, .vt-markdown td { border: 1px solid #ece6d8; padding: 6px 10px; text-align: left; }
        .vt-markdown th { background: rgba(217,166,83,0.12); font-weight: 700; }
        .vt-markdown tr:nth-child(even) td { background: rgba(20,33,61,0.02); }
      `}</style>
    </div>
  );
}