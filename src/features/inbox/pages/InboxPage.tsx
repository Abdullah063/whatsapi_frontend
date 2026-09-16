import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Button } from 'src/components/ui/button';
import { listAccounts } from 'src/features/accounts/api/accounts-api';
import { listMediaAssets, uploadMediaAsset, type MediaAsset } from 'src/features/media/api/media-assets-api';
import { apiErrorMessage } from 'src/shared/api/error-message';
import { listConversations, listRecentMessages, sendMediaMessage, sendTextMessage, uploadAndSendMediaMessage, type Message } from '../api/messaging-api';
import ConversationList from '../ui/ConversationList';
import MessageThread from '../ui/MessageThread';

export default function InboxPage() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const [draftRecipient, setDraftRecipient] = useState<string>();
  const accounts = useQuery({ queryKey: ['whatsapp', 'accounts'], queryFn: listAccounts });
  const activeAccounts = accounts.data?.filter((account) => account.status === 'ACTIVE') || [];
  const requestedAccountId = params.get('accountId');
  const accountId = activeAccounts.some((account) => account.id === requestedAccountId)
    ? requestedAccountId!
    : activeAccounts[0]?.id;

  const conversations = useQuery({
    queryKey: ['whatsapp', 'conversations', accountId],
    queryFn: () => listConversations(accountId!),
    enabled: Boolean(accountId),
    refetchInterval: 5_000,
  });

  const requestedConversationId = params.get('conversationId');
  const selectedConversation = conversations.data?.content.find(
    (conversation) => conversation.id === requestedConversationId,
  );
  const messages = useQuery({
    queryKey: ['whatsapp', 'messages', requestedConversationId, 'recent'],
    queryFn: () => listRecentMessages(requestedConversationId!),
    enabled: Boolean(selectedConversation),
    refetchInterval: 3_000,
  });

  const mediaAssets = useQuery({
    queryKey: ['media-assets', accountId],
    queryFn: () => listMediaAssets(accountId!),
    enabled: Boolean(accountId),
  });

  async function messageQueued(message: Message) {
    if (selectedConversation) {
      queryClient.setQueryData<{ content: Message[]; page: number; size: number; totalElements: number }>(
        ['whatsapp', 'messages', selectedConversation.id, 'recent'],
        (current) => current && !current.content.some((item) => item.id === message.id)
          ? { ...current, content: [...current.content, message], totalElements: current.totalElements + 1 }
          : current,
      );
    }
    await queryClient.invalidateQueries({ queryKey: ['whatsapp', 'conversations', accountId] });
    setDraftRecipient(undefined);
    setParams({ accountId: accountId!, conversationId: message.conversationId });
    void queryClient.invalidateQueries({ queryKey: ['analytics'] });
  }

  const send = useMutation({
    mutationFn: (text: string) => sendTextMessage(accountId!, selectedConversation?.customerWaId || draftRecipient!, text),
    onSuccess: messageQueued,
  });

  const sendMedia = useMutation({
    mutationFn: ({ asset, caption }: { asset: MediaAsset; caption: string }) => sendMediaMessage(
      accountId!,
      selectedConversation?.customerWaId || draftRecipient!,
      {
        type: asset.mediaType,
        link: asset.publicUrl,
        caption: caption || undefined,
        filename: asset.mediaType === 'DOCUMENT' ? asset.originalFilename : undefined,
      },
    ),
    onSuccess: messageQueued,
  });

  const uploadAndSendMedia = useMutation({
    mutationFn: async ({ file, name, caption, saveToGallery }: { file: File; name: string; caption: string; saveToGallery: boolean }) => {
      if (!saveToGallery) {
        return uploadAndSendMediaMessage(
          accountId!, selectedConversation?.customerWaId || draftRecipient!, file, caption,
        );
      }
      const asset = await uploadMediaAsset(accountId!, file, name);
      await queryClient.invalidateQueries({ queryKey: ['media-assets', accountId] });
      return sendMediaMessage(accountId!, selectedConversation?.customerWaId || draftRecipient!, {
        type: asset.mediaType,
        link: asset.publicUrl,
        caption: caption || undefined,
        filename: asset.mediaType === 'DOCUMENT' ? asset.originalFilename : undefined,
      });
    },
    onSuccess: messageQueued,
  });

  function selectAccount(nextAccountId: string) {
    setDraftRecipient(undefined);
    setParams({ accountId: nextAccountId });
  }

  function closeThread() {
    setDraftRecipient(undefined);
    setParams(accountId ? { accountId } : {});
  }

  const hasThread = Boolean(selectedConversation || draftRecipient);

  if (accounts.isPending) return <div className="h-[650px] animate-pulse rounded-xl bg-muted" />;
  if (accounts.isError) return <div className="rounded-xl border border-border bg-card p-6"><h1 className="text-xl font-semibold">Gelen kutusu yüklenemedi</h1><p className="mt-2 text-sm text-error">{apiErrorMessage(accounts.error)}</p><Button className="mt-4" onClick={() => accounts.refetch()}>Tekrar dene</Button></div>;
  if (activeAccounts.length === 0) {
    return <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-lightprimary text-primary"><Icon icon="solar:smartphone-linear" width={30} /></div><h1 className="mt-5 text-xl font-semibold">Aktif WhatsApp hesabı gerekli</h1><p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">Gelen kutusunu kullanabilmek için önce geçerli bir Meta Cloud API hesabı bağlayın.</p><Button asChild className="mt-6"><Link to="/whatsapp-accounts">WhatsApp hesabı bağla</Link></Button></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium text-primary">Mesajlaşma</p><h1 className="mt-1 text-2xl font-semibold md:text-3xl">Gelen kutusu</h1><p className="mt-2 text-sm text-muted-foreground">Tüm müşteri konuşmalarınızı tek ekrandan yönetin.</p></div>
        <label className="text-xs font-medium text-muted-foreground">WhatsApp hesabı<select value={accountId} onChange={(event) => selectAccount(event.target.value)} className="mt-1 block h-10 min-w-60 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring">{activeAccounts.map((account) => <option key={account.id} value={account.id}>{account.displayName || account.externalPhoneNumberId}</option>)}</select></label>
      </div>
      {conversations.isError && <div className="rounded-md bg-lighterror p-3 text-sm text-error">{apiErrorMessage(conversations.error)}</div>}
      <div className="overflow-hidden rounded-xl border border-border shadow-sm lg:grid lg:grid-cols-[330px_minmax(0,1fr)]">
        <div className={hasThread ? 'hidden lg:block' : 'block'}><ConversationList conversations={conversations.data?.content || []} selectedId={selectedConversation?.id} loading={conversations.isPending} onSelect={(conversation) => { setDraftRecipient(undefined); setParams({ accountId: accountId!, conversationId: conversation.id }); }} onStartConversation={(recipient) => { setDraftRecipient(recipient); setParams({ accountId: accountId! }); }} /></div>
        <div className={hasThread ? 'block' : 'hidden lg:block'}><MessageThread conversation={selectedConversation} draftRecipient={draftRecipient} messages={messages.data?.content || []} loading={messages.isPending && Boolean(selectedConversation)} sending={send.isPending} mediaAssets={mediaAssets.data || []} mediaLoading={mediaAssets.isPending} mediaSending={sendMedia.isPending || uploadAndSendMedia.isPending} error={send.isError ? apiErrorMessage(send.error) : sendMedia.isError ? apiErrorMessage(sendMedia.error) : uploadAndSendMedia.isError ? apiErrorMessage(uploadAndSendMedia.error) : mediaAssets.isError ? apiErrorMessage(mediaAssets.error) : messages.isError ? apiErrorMessage(messages.error) : null} onBack={closeThread} onSend={async (text) => { try { await send.mutateAsync(text); return true; } catch { return false; } }} onSendMedia={async (asset, caption) => { try { await sendMedia.mutateAsync({ asset, caption }); return true; } catch { return false; } }} onUploadMedia={async (file, name, caption, saveToGallery) => { try { await uploadAndSendMedia.mutateAsync({ file, name, caption, saveToGallery }); return true; } catch { return false; } }} /></div>
      </div>
    </div>
  );
}
