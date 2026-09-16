import { Icon } from '@iconify/react';
import { useMemo, useState } from 'react';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import type { Conversation } from '../api/messaging-api';
import { contactLabel, formatPhone, relativeTime } from '../lib/message-format';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  loading: boolean;
  onSelect: (conversation: Conversation) => void;
  onStartConversation: (recipient: string) => void;
}

export default function ConversationList({ conversations, selectedId, loading, onSelect, onStartConversation }: ConversationListProps) {
  const [search, setSearch] = useState('');
  const [newConversation, setNewConversation] = useState(false);
  const [recipient, setRecipient] = useState('');
  const filtered = useMemo(() => {
    const value = search.trim().toLocaleLowerCase('tr-TR');
    if (!value) return conversations;
    return conversations.filter((conversation) =>
      `${conversation.customerName || ''} ${conversation.customerWaId}`.toLocaleLowerCase('tr-TR').includes(value),
    );
  }, [conversations, search]);

  function start() {
    const normalized = recipient.trim();
    if (!/^\+?[1-9][0-9]{5,19}$/.test(normalized)) return;
    onStartConversation(normalized);
    setNewConversation(false);
    setRecipient('');
  }

  return (
    <aside className="flex min-h-[650px] flex-col border-r border-border bg-card">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between"><div><h2 className="font-semibold">Konuşmalar</h2><p className="text-xs text-muted-foreground">{conversations.length} kayıt</p></div><Button size="icon" variant="lightprimary" onClick={() => setNewConversation((value) => !value)} aria-label="Yeni konuşma"><Icon icon={newConversation ? 'solar:close-circle-linear' : 'solar:pen-new-square-linear'} /></Button></div>
        {newConversation ? (
          <div className="mt-4 rounded-lg bg-muted/60 p-3"><label htmlFor="new-recipient" className="text-xs font-medium">WhatsApp numarası</label><Input id="new-recipient" className="mt-2" placeholder="905551112233" value={recipient} onChange={(event) => setRecipient(event.target.value.replace(/[^+\d]/g, ''))} onKeyDown={(event) => { if (event.key === 'Enter') start(); }} /><Button className="mt-2 w-full" size="sm" onClick={start} disabled={!/^\+?[1-9][0-9]{5,19}$/.test(recipient.trim())}>Mesaj yaz</Button></div>
        ) : (
          <div className="relative mt-4"><Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" placeholder="İsim veya numara ara" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading && Array.from({ length: 5 }).map((_, index) => <div key={index} className="m-4 h-16 animate-pulse rounded-lg bg-muted" />)}
        {!loading && filtered.length === 0 && <div className="px-6 py-12 text-center"><Icon icon="solar:chat-round-dots-linear" className="mx-auto text-muted-foreground" width={30} /><p className="mt-3 text-sm font-medium">Konuşma bulunamadı</p><p className="mt-1 text-xs text-muted-foreground">Yeni bir numaraya mesaj yazarak başlayabilirsiniz.</p></div>}
        {filtered.map((conversation) => {
          const selected = selectedId === conversation.id;
          return <button type="button" key={conversation.id} onClick={() => onSelect(conversation)} className={`flex w-full items-center gap-3 border-b border-border/70 p-4 text-left transition hover:bg-muted/60 ${selected ? 'bg-lightprimary' : ''}`}><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold ${selected ? 'bg-primary text-white' : 'bg-muted text-foreground'}`}>{contactLabel(conversation.customerName, conversation.customerWaId).slice(0, 1).toLocaleUpperCase('tr-TR')}</span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold">{contactLabel(conversation.customerName, conversation.customerWaId)}</span><span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(conversation.lastMessageAt)}</span></span><span className="mt-1 block truncate text-xs text-muted-foreground">{formatPhone(conversation.customerWaId)}</span></span></button>;
        })}
      </div>
    </aside>
  );
}
