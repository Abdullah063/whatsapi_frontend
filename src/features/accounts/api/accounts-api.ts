import { apiRequest, jsonBody } from 'src/shared/api/http';

export interface WhatsAppAccount {
  id: string;
  provider: 'META_CLOUD';
  displayName: string | null;
  externalPhoneNumberId: string;
  externalBusinessAccountId: string;
  tokenExpiresAt: string | null;
  status: 'ACTIVE' | 'INVALID_CREDENTIALS' | 'DISABLED';
  createdAt: string;
  updatedAt: string;
}

export interface ConnectAccountInput {
  provider: 'META_CLOUD';
  displayName?: string;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string;
  webhookVerifyToken: string;
}

export function listAccounts(): Promise<WhatsAppAccount[]> {
  return apiRequest('/api/v1/whatsapp/accounts');
}

export function connectAccount(input: ConnectAccountInput): Promise<WhatsAppAccount> {
  return apiRequest('/api/v1/whatsapp/accounts', { method: 'POST', body: jsonBody(input) });
}

export function disconnectAccount(accountId: string): Promise<void> {
  return apiRequest(`/api/v1/whatsapp/accounts/${accountId}`, { method: 'DELETE' });
}
