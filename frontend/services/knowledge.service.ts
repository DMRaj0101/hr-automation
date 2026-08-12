import { apiClient } from "./api-client";
import { backendApiClient } from "./backend-api-client";

export interface ChipReply {
  text: string;
  source: string;
}

// Mock -- suggestion chips shown before the user's first message, from
// mock-server/db.json. Purely UI decoration; the question they trigger
// still goes to the real backend via askOpsQuestion() below.
export async function getSuggestionChips(): Promise<string[]> {
  const { data } = await apiClient.get<string[]>("/suggestionChips");
  return data;
}

// Real backend -- every question the user actually asks (typed or via a
// suggestion chip) is answered here, not from the mock server.
export async function askOpsQuestion(question: string): Promise<ChipReply> {
  const { data } = await backendApiClient.post<ChipReply>(
    "/hr-assistant/ops-chat",
    { question }
  );
  return data;
}
