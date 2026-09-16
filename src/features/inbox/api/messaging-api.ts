import { apiRequest, jsonBody } from 'src/shared/api/http';

export interface Conversation {
  id: string;
  providerAccountId: string;
  customerWaId: string;
  customerName: string | null;
  status: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface MessageMedia {
  type: string;
  mediaId: string | null;
  link: string | null;
  caption: string | null;
  filename: string | null;
  mimeType: string | null;
}

export interface MessageContent {
  text: string | null;
  media: MessageMedia | null;
  template: { name: string; languageCode: string } | null;
}

export interface Message {
  id: string;
  conversationId: string;
  providerMessageId: string | null;
  direction: 'INBOUND' | 'OUTBOUND';
  type: string;
  status: string;
  senderWaId: string;
  recipientWaId: string;
  textBody: string | null;
  content: MessageContent | null;
  errorCode: string | null;
  errorMessage: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
}

export function listConversations(accountId: string): Promise<Page<Conversation>> {
  return apiRequest(`/api/v1/whatsapp/accounts/${accountId}/conversations?page=0&size=100`);
}

export async function listRecentMessages(conversationId: string): Promise<Page<Message>> {
  const size = 100;
  const firstPage = await apiRequest<Page<Message>>(
    `/api/v1/whatsapp/conversations/${conversationId}/messages?page=0&size=${size}`,
  );
  const lastPage = Math.max(0, Math.ceil(firstPage.totalElements / size) - 1);
  if (lastPage === 0) return firstPage;
  return apiRequest(
    `/api/v1/whatsapp/conversations/${conversationId}/messages?page=${lastPage}&size=${size}`,
  );
}

export function sendTextMessage(accountId: string, recipientWaId: string, text: string): Promise<Message> {
  return apiRequest(`/api/v1/whatsapp/accounts/${accountId}/messages`, {
    method: 'POST',
    body: jsonBody({ recipientWaId, text }),
  });
}

export interface SendMediaInput {
  type: 'IMAGE' | 'DOCUMENT';
  link: string;
  caption?: string;
  filename?: string;
}

export function sendMediaMessage(
  accountId: string,
  recipientWaId: string,
  media: SendMediaInput,
): Promise<Message> {
  return apiRequest(`/api/v1/whatsapp/accounts/${accountId}/messages/media`, {
    method: 'POST',
    body: jsonBody({ recipientWaId, ...media }),
  });
}

export function uploadAndSendMediaMessage(
  accountId: string,
  recipientWaId: string,
  file: File,
  caption?: string,
): Promise<Message> {
  const body = new FormData();
  body.append('recipientWaId', recipientWaId);
  body.append('file', file);
  if (caption?.trim()) body.append('caption', caption.trim());
  return apiRequest(`/api/v1/whatsapp/accounts/${accountId}/messages/media-upload`, {
    method: 'POST',
    body,
  });
}
