import { apiRequest, jsonBody } from 'src/shared/api/http';

export interface AiAssistantSettings {
  providerAccountId: string;
  enabled: boolean;
  systemPrompt: string;
  fallbackReply: string;
  contextMessageLimit: number;
  updatedAt: string | null;
}

export interface UpdateAiAssistantSettingsInput {
  enabled: boolean;
  systemPrompt: string;
  fallbackReply: string;
}

const path = (accountId: string) => `/api/v1/whatsapp/accounts/${accountId}/ai-assistant`;

export function getAiAssistantSettings(accountId: string): Promise<AiAssistantSettings> {
  return apiRequest(path(accountId));
}

export function updateAiAssistantSettings(
  accountId: string,
  input: UpdateAiAssistantSettingsInput,
): Promise<AiAssistantSettings> {
  return apiRequest(path(accountId), { method: 'PUT', body: jsonBody(input) });
}
