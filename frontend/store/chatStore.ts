import { create } from "zustand";
import { ChatMessage } from "@/types/monitoring";
import { getChatMessages, getChipReplies } from "@/services/knowledge.service";

interface ChatState {
  messages: ChatMessage[];
  input: string;
  loaded: boolean;
  setInput: (input: string) => void;
  loadInitial: () => Promise<void>;
  sendMessage: (text: string) => Promise<void>;
  sendChip: (text: string) => Promise<void>;
}

const FALLBACK =
  "I don't have a specific match for that yet — try asking about an employee's status, what's pending, or failed tickets.";
const FALLBACK_SOURCE = "Knowledge Agent";

async function resolveReply(text: string) {
  const replies = await getChipReplies();
  const match = replies[text];
  if (match) return match;
  return { text: FALLBACK, source: FALLBACK_SOURCE };
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  input: "",
  loaded: false,
  setInput: (input) => set({ input }),
  loadInitial: async () => {
    if (get().loaded) return;
    const messages = await getChatMessages();
    set({ messages, loaded: true });
  },
  sendMessage: async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    set((s) => ({
      messages: [...s.messages, { role: "user", text: trimmed }],
      input: "",
    }));
    const reply = await resolveReply(trimmed);
    set((s) => ({
      messages: [
        ...s.messages,
        { role: "agent", text: reply.text, source: reply.source },
      ],
    }));
  },
  sendChip: async (text) => {
    await get().sendMessage(text);
  },
}));
