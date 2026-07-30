import { ChatMessage as ChatMessageType } from "@/types/monitoring";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";
  return (
    <div
      className="flex flex-col"
      style={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        alignItems: isUser ? "flex-end" : "flex-start",
        maxWidth: isUser ? "60%" : "65%",
      }}
    >
      <div
        className="px-4 py-2.5 text-sm"
        style={
          isUser
            ? {
                backgroundColor: "#14213D",
                color: "#fff",
                borderRadius: "16px 16px 4px 16px",
              }
            : {
                backgroundColor: "#fff",
                color: "#14213D",
                border: "1px solid #E5E7EB",
                borderRadius: "16px 16px 16px 4px",
              }
        }
      >
        {message.text}
      </div>
      {!isUser && message.source && (
        <span
          className="mt-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{ backgroundColor: "#DBEAFE", color: "#1D4ED8" }}
        >
          Source: {message.source}
        </span>
      )}
    </div>
  );
}
