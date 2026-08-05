import { create } from "zustand";
import { ChatMessage } from "@/types/monitoring";
import { getChatMessages, getSuggestionChips, askOpsQuestion } from "@/services/knowledge.service";

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
  "I'm unable to answer that question right now. Please try again later.";
const FALLBACK_SOURCE = "Knowledge Agent";

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
    
    // Add user message
    set((s) => ({
      messages: [...s.messages, { role: "user", text: trimmed }],
      input: "",
    }));
    
    // Get reply from backend ops-chat endpoint
    try {
      const reply = await askOpsQuestion(trimmed);
      set((s) => ({
        messages: [
          ...s.messages,
          { role: "agent", text: reply.text, source: reply.source },
        ],
      }));
    } catch (err) {
      // Fallback on error
      set((s) => ({
        messages: [
          ...s.messages,
          { role: "agent", text: FALLBACK, source: FALLBACK_SOURCE },
        ],
      }));
    }
  },
  sendChip: async (text) => {
    await get().sendMessage(text);
  },
}));