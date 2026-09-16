import type { Message } from '../api/messaging-api';

const relativeFormatter = new Intl.RelativeTimeFormat('tr', { numeric: 'auto' });

export function contactLabel(name: string | null, waId: string): string {
  return name?.trim() || formatPhone(waId);
}

export function formatPhone(value: string): string {
  return value.startsWith('+') ? value : `+${value}`;
}

export function relativeTime(value: string): string {
  const difference = new Date(value).getTime() - Date.now();
  const minutes = Math.round(difference / 60_000);
  if (Math.abs(minutes) < 60) return relativeFormatter.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relativeFormatter.format(hours, 'hour');
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return relativeFormatter.format(days, 'day');
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: 'short' }).format(new Date(value));
}

export function messageTime(value: string): string {
  return new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export function messageText(message: Message): string {
  if (message.textBody) return message.textBody;
  if (message.content?.media) return message.content.media.caption || message.content.media.filename || `${message.type.toLocaleLowerCase('tr-TR')} mesajı`;
  if (message.content?.template) return `Şablon: ${message.content.template.name}`;
  return `${message.type.toLocaleLowerCase('tr-TR')} mesajı`;
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    QUEUED: 'Sırada',
    SENT: 'Gönderildi',
    DELIVERED: 'Teslim edildi',
    READ: 'Okundu',
    FAILED: 'Başarısız',
    RECEIVED: 'Alındı',
  };
  return labels[status] || status;
}
