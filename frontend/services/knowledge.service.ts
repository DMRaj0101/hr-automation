import { apiClient } from "./api-client";
import { backendApiClient } from "./backend-api-client";
import { ChatMessage } from "@/types/monitoring";

export interface ChipReply {
  text: string;
  source: string;
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  const { data } = await apiClient.get<ChatMessage[]>("/chatMessages");
  return data;
}

export async function getSuggestionChips(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>("/suggestionChips");
  return data;
}

export async function getChipReplies(): Promise<Record<string, ChipReply>> {
  const { data } = await apiClient.get<Record<string, ChipReply>>(
    "/chipReplies"
  );
  return data;
}

// New: send question to the real ops-chat backend endpoint
export async function askOpsQuestion(question: string): Promise<ChipReply> {
  const { data } = await backendApiClient.post<ChipReply>(
    "/hr-assistant/ops-chat",
    { question }
  );
  return data;
}