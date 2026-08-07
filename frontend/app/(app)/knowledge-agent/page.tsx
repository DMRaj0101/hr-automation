"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useChatStore } from "@/store/chatStore";
import { getSuggestionChips } from "@/services/knowledge.service";
import { ChatMessage } from "@/components/knowledge-agent/ChatMessage";
import { SuggestionChips } from "@/components/knowledge-agent/SuggestionChips";
import { ChatInput } from "@/components/knowledge-agent/ChatInput";

export default function KnowledgeAgentChatPage() {
  const { messages, input, setInput, loadInitial, sendMessage, sendChip } =
    useChatStore();
  const { data: chips } = useQuery({
    queryKey: ["suggestionChips"],
    queryFn: getSuggestionChips,
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col overflow-hidden" style={{ height: "100vh" }}>
      <div className="shrink-0" style={{ padding: "40px 48px 24px" }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>Onboarding Q&amp;A</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin" style={{ padding: "0 48px", minHeight: 0 }}>
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {messages.map((m, idx) => (
            <ChatMessage key={idx} message={m} />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="shrink-0 bg-white" style={{ padding: "24px 48px 32px", borderTop: "1px solid #E5E7EB" }}>
        <div className="mx-auto max-w-3xl space-y-3">
          <SuggestionChips chips={chips ?? []} onSelect={sendChip} />
          <ChatInput
            value={input}
            onChange={setInput}
            onSend={() => sendMessage(input)}
          />
        </div>
      </div>
    </div>
  );
}