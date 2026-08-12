"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useChatStore } from "@/store/chatStore";
import { getSuggestionChips } from "@/services/knowledge.service";
import { ChatMessage } from "@/components/knowledge-agent/ChatMessage";
import { SuggestionChips } from "@/components/knowledge-agent/SuggestionChips";
import { ChatInput } from "@/components/knowledge-agent/ChatInput";
import { Bot } from "lucide-react";

export default function KnowledgeAgentChatPage() {
  const { messages, input, setInput, sendMessage, sendChip } = useChatStore();
  const { data: chips } = useQuery({
    queryKey: ["suggestionChips"],
    queryFn: getSuggestionChips,
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    setIsLoading(true);
    try {
      await sendMessage(text);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendChip = async (text: string) => {
    setIsLoading(true);
    try {
      await sendChip(text);
    } finally {
      setIsLoading(false);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div
      className="flex flex-col overflow-hidden bg-gradient-to-br from-white via-white to-gray-50/50"
      style={{ height: "100vh" }}
    >
      {/* Messages area */}
      <div
        className="flex-1 overflow-y-auto scrollbar-thin"
        style={{ padding: "32px 48px", minHeight: 0 }}
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {isEmpty && !isLoading && (
            <div
              className="flex flex-col items-center justify-center h-64 gap-4 text-center"
              style={{ animation: "fade-in 400ms ease-out" }}
            >
              <div
                className="flex items-center justify-center rounded-2xl"
                style={{
                  width: 64,
                  height: 64,
                  backgroundColor: "#14213D",
                  backgroundImage: "linear-gradient(135deg, #14213D 0%, #1c2c52 100%)",
                  boxShadow: "0 8px 20px rgba(20,33,61,0.22)",
                }}
              >
                <Bot size={30} style={{ color: "#D9A653" }} strokeWidth={1.8} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-vantara-navy mb-1">
                  Start a conversation
                </h2>
                <p className="text-sm text-vantara-text-muted">
                  Ask me anything about your onboarding journey or company policies
                </p>
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((m, idx) => (
            <ChatMessage key={idx} message={m} />
          ))}

          {/* Scroll anchor */}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div
        className="shrink-0 bg-white border-t border-vantara-border"
        style={{
          padding: "24px 48px 32px",
          boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Suggestion chips */}
          {isEmpty && chips && (
            <div style={{ animation: "fade-in 300ms ease-out 100ms both" }}>
              <SuggestionChips
                chips={chips}
                onSelect={handleSendChip}
              />
            </div>
          )}

          {/* Input */}
          <div style={{ animation: "fade-in 300ms ease-out 200ms both" }}>
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => handleSendMessage(input)}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Global animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-message-in {
          animation: messageSlideIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-delayed {
          animation: fade-in 300ms ease-out 150ms both;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }

        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}