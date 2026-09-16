import { Icon } from '@iconify/react';
import { type FormEvent, useEffect, useRef, useState } from 'react';
import { Button } from 'src/components/ui/button';
import { Textarea } from 'src/components/ui/textarea';
import type { Conversation, Message } from '../api/messaging-api';
import { contactLabel, formatPhone, messageText, messageTime, statusLabel } from '../lib/message-format';

interface MessageThreadProps {
  conversation?: Conversation;
  draftRecipient?: string;
  messages: Message[];
  loading: boolean;
  sending: boolean;
  error?: string | null;
  onSend: (text: string) => Promise<boolean>;
  onBack?: () => void;
}

export default function MessageThread({ conversation, draftRecipient, messages, loading, sending, error, onSend, onBack }: MessageThreadProps) {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const recipient = conversation?.customerWaId || draftRecipient;

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const value = text.trim();
    if (!value || !recipient || sending) return;
    if (await onSend(value)) setText('');
  }

  if (!recipient) {
    return <section className="hidden min-h-[650px] items-center justify-center bg-muted/20 p-8 text-center lg:flex"><div><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-lightprimary text-primary"><Icon icon="solar:chat-round-dots-linear" width={30} /></div><h2 className="mt-4 text-lg font-semibold">Bir konuşma seçin</h2><p className="mt-2 max-w-sm text-sm text-muted-foreground">Mesaj geçmişini görüntülemek veya yeni bir mesaj göndermek için soldan bir konuşma seçin.</p></div></section>;
  }

  return (
    <section className="flex min-h-[650px] min-w-0 flex-col bg-muted/20">
      <header className="flex h-[77px] items-center gap-3 border-b border-border bg-card px-4"><Button variant="ghost" size="icon" className="lg:hidden" onClick={onBack}><Icon icon="solar:arrow-left-linear" /></Button><span className="flex h-10 w-10 items-center justify-center rounded-full bg-lightprimary font-semibold text-primary">{contactLabel(conversation?.customerName || null, recipient).slice(0, 1).toLocaleUpperCase('tr-TR')}</span><div className="min-w-0"><h2 className="truncate text-sm font-semibold">{conversation ? contactLabel(conversation.customerName, recipient) : formatPhone(recipient)}</h2><p className="truncate text-xs text-muted-foreground">{formatPhone(recipient)}</p></div><span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2 w-2 rounded-full bg-success" />Otomatik yenileniyor</span></header>
      <div className="flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
        {loading && <div className="flex h-full items-center justify-center"><Icon icon="svg-spinners:ring-resize" className="text-primary" width={28} /></div>}
        {!loading && messages.length === 0 && <div className="flex h-full items-center justify-center text-center"><div><p className="text-sm font-medium">Henüz mesaj yok</p><p className="mt-1 text-xs text-muted-foreground">İlk mesajı aşağıdaki alandan gönderebilirsiniz.</p></div></div>}
        {messages.map((message) => {
          const outbound = message.direction === 'OUTBOUND';
          return <div key={message.id} className={`flex ${outbound ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-[70%] ${outbound ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-border bg-card'}`}><p className="whitespace-pre-wrap break-words">{messageText(message)}</p><div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${outbound ? 'text-white/75' : 'text-muted-foreground'}`}><span>{messageTime(message.occurredAt)}</span>{outbound && <><Icon icon={message.status === 'READ' ? 'solar:check-read-linear' : 'solar:check-circle-linear'} /><span>{statusLabel(message.status)}</span></>}</div>{message.status === 'FAILED' && message.errorMessage && <p className="mt-2 border-t border-white/20 pt-2 text-xs">{message.errorMessage}</p>}</div></div>;
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="border-t border-border bg-card p-3 sm:p-4">
        {error && <p className="mb-2 rounded-md bg-lighterror px-3 py-2 text-xs text-error">{error}</p>}
        <div className="flex items-end gap-2"><Textarea value={text} onChange={(event) => setText(event.target.value.slice(0, 4096))} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} rows={1} placeholder="Mesajınızı yazın…" className="max-h-36 min-h-11 resize-none" /><Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!text.trim() || sending} aria-label="Mesaj gönder"><Icon icon={sending ? 'svg-spinners:ring-resize' : 'solar:plain-2-bold'} /></Button></div><div className="mt-1 flex justify-between px-1 text-[10px] text-muted-foreground"><span>Yeni satır için Shift + Enter</span><span>{text.length}/4096</span></div>
      </form>
    </section>
  );
}
