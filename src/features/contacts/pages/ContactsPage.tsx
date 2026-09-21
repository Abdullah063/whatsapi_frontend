import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { Card, CardContent } from 'src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import { Textarea } from 'src/components/ui/textarea';
import { listAccounts } from 'src/features/accounts/api/accounts-api';
import { apiErrorMessage } from 'src/shared/api/error-message';
import {
  type AddBlacklistEntryInput,
  type BlacklistSource,
  type BulkAddResult,
  type ContactGroup,
  type ContactImportResult,
  addBlacklistEntry,
  addContacts,
  createContactGroup,
  deleteBlacklistEntry,
  deleteContactGroup,
  importContacts,
  listBlacklist,
  listBlacklistReasonCodes,
  listContactGroups,
  listContacts,
  removeContact,
  updateContactGroup,
} from '../api/contacts-api';

const PAGE_SIZE = 25;
const dateFormatter = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });

function formatDate(value: string): string {
  return dateFormatter.format(new Date(value));
}

function pageCount(total: number): number {
  return Math.max(1, Math.ceil(total / PAGE_SIZE));
}

function sourceLabel(source: BlacklistSource): string {
  return source === 'MANUAL' ? 'Manuel' : 'Provider hatası';
}

function parseContacts(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [phoneNumber = '', ...nameParts] = line.split(/[;,\t]/);
      const displayName = nameParts.join(' ').trim();
      return {
        phoneNumber: phoneNumber.trim(),
        ...(displayName ? { displayName } : {}),
      };
    });
}

export default function ContactsPage() {
  const queryClient = useQueryClient();
  const importInput = useRef<HTMLInputElement>(null);
  const accounts = useQuery({ queryKey: ['whatsapp', 'accounts'], queryFn: listAccounts });
  const [accountId, setAccountId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const deferredContactSearch = useDeferredValue(contactSearch);
  const [contactPage, setContactPage] = useState(0);
  const [blacklistSearch, setBlacklistSearch] = useState('');
  const deferredBlacklistSearch = useDeferredValue(blacklistSearch);
  const [blacklistSource, setBlacklistSource] = useState<'ALL' | BlacklistSource>('ALL');
  const [blacklistReason, setBlacklistReason] = useState('ALL');
  const [blacklistPage, setBlacklistPage] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ContactGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkContacts, setBulkContacts] = useState('');
  const [bulkResult, setBulkResult] = useState<BulkAddResult | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ContactImportResult | null>(null);
  const [blacklistDialogOpen, setBlacklistDialogOpen] = useState(false);
  const [blacklistPhone, setBlacklistPhone] = useState('');
  const [blacklistEntrySource, setBlacklistEntrySource] = useState<BlacklistSource>('MANUAL');
  const [blacklistReasonCode, setBlacklistReasonCode] = useState('');
  const [blacklistReasonMessage, setBlacklistReasonMessage] = useState('');

  useEffect(() => {
    if (!accountId && accounts.data?.length) setAccountId(accounts.data[0].id);
  }, [accountId, accounts.data]);

  const groups = useQuery({
    queryKey: ['contact-groups', accountId],
    queryFn: () => listContactGroups(accountId),
    enabled: Boolean(accountId),
  });

  useEffect(() => {
    const available = groups.data || [];
    if (!available.length) {
      setSelectedGroupId('');
      return;
    }
    if (!available.some((group) => group.id === selectedGroupId)) setSelectedGroupId(available[0].id);
  }, [groups.data, selectedGroupId]);

  const selectedGroup = groups.data?.find((group) => group.id === selectedGroupId) || null;
  const contacts = useQuery({
    queryKey: ['contacts', accountId, selectedGroupId, deferredContactSearch, contactPage],
    queryFn: () => listContacts(accountId, selectedGroupId, {
      search: deferredContactSearch,
      page: contactPage,
      size: PAGE_SIZE,
    }),
    enabled: Boolean(accountId && selectedGroupId),
  });
  const blacklist = useQuery({
    queryKey: [
      'blacklist',
      accountId,
      deferredBlacklistSearch,
      blacklistSource,
      blacklistReason,
      blacklistPage,
    ],
    queryFn: () => listBlacklist(accountId, {
      search: deferredBlacklistSearch,
      source: blacklistSource === 'ALL' ? undefined : blacklistSource,
      reasonCode: blacklistReason === 'ALL' ? undefined : blacklistReason,
      page: blacklistPage,
      size: PAGE_SIZE,
    }),
    enabled: Boolean(accountId),
  });
  const blacklistSummary = useQuery({
    queryKey: ['blacklist-summary', accountId],
    queryFn: () => listBlacklist(accountId, { page: 0, size: 1 }),
    enabled: Boolean(accountId),
  });
  const reasonCodes = useQuery({
    queryKey: ['blacklist-reason-codes', accountId],
    queryFn: () => listBlacklistReasonCodes(accountId),
    enabled: Boolean(accountId),
  });

  const resetFeedback = () => {
    setNotice(null);
    setActionError(null);
  };
  const refreshGroupsAndContacts = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['contact-groups', accountId] }),
      queryClient.invalidateQueries({ queryKey: ['contacts', accountId] }),
    ]);
  };
  const refreshBlacklist = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['blacklist', accountId] }),
      queryClient.invalidateQueries({ queryKey: ['blacklist-summary', accountId] }),
      queryClient.invalidateQueries({ queryKey: ['blacklist-reason-codes', accountId] }),
    ]);
  };

  const saveGroup = useMutation({
    mutationFn: () => editingGroup
      ? updateContactGroup(accountId, editingGroup.id, { name: groupName, description: groupDescription })
      : createContactGroup(accountId, { name: groupName, description: groupDescription }),
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ['contact-groups', accountId] });
      setSelectedGroupId(saved.id);
      setGroupDialogOpen(false);
      setNotice(editingGroup ? 'Grup güncellendi.' : 'Yeni kişi grubu oluşturuldu.');
      setActionError(null);
    },
    onError: (error) => setActionError(apiErrorMessage(error)),
  });
  const removeGroupMutation = useMutation({
    mutationFn: (groupId: string) => deleteContactGroup(accountId, groupId),
    onSuccess: async () => {
      setSelectedGroupId('');
      await refreshGroupsAndContacts();
      setNotice('Kişi grubu silindi.');
      setActionError(null);
    },
    onError: (error) => setActionError(apiErrorMessage(error)),
  });
  const addContactsMutation = useMutation({
    mutationFn: () => addContacts(accountId, selectedGroupId, parseContacts(bulkContacts)),
    onSuccess: async (result) => {
      setBulkResult(result);
      setBulkContacts('');
      await refreshGroupsAndContacts();
      setNotice(`${result.added} kişi gruba eklendi.`);
      setActionError(null);
    },
    onError: (error) => setActionError(apiErrorMessage(error)),
  });
  const importContactsMutation = useMutation({
    mutationFn: () => importContacts(accountId, selectedGroupId, importFile!),
    onSuccess: async (result) => {
      setImportResult(result);
      setImportFile(null);
      if (importInput.current) importInput.current.value = '';
      await refreshGroupsAndContacts();
      setNotice(`${result.added} kişi dosyadan eklendi.`);
      setActionError(null);
    },
    onError: (error) => setActionError(apiErrorMessage(error)),
  });
  const removeContactMutation = useMutation({
    mutationFn: (contactId: string) => removeContact(accountId, selectedGroupId, contactId),
    onSuccess: async () => {
      await refreshGroupsAndContacts();
      setNotice('Kişi gruptan kaldırıldı.');
      setActionError(null);
    },
    onError: (error) => setActionError(apiErrorMessage(error)),
  });
  const addBlacklistMutation = useMutation({
    mutationFn: () => {
      const input: AddBlacklistEntryInput = {
        phoneNumber: blacklistPhone,
        source: blacklistEntrySource,
        ...(blacklistReasonCode.trim() ? { reasonCode: blacklistReasonCode.trim() } : {}),
        ...(blacklistReasonMessage.trim() ? { reasonMessage: blacklistReasonMessage.trim() } : {}),
      };
      return addBlacklistEntry(accountId, input);
    },
    onSuccess: async () => {
      await refreshBlacklist();
      setBlacklistDialogOpen(false);
      setNotice('Numara kara listeye eklendi.');
      setActionError(null);
    },
    onError: (error) => setActionError(apiErrorMessage(error)),
  });
  const removeBlacklistMutation = useMutation({
    mutationFn: (entryId: string) => deleteBlacklistEntry(accountId, entryId),
    onSuccess: async () => {
      await refreshBlacklist();
      setNotice('Numara kara listeden çıkarıldı.');
      setActionError(null);
    },
    onError: (error) => setActionError(apiErrorMessage(error)),
  });

  const summary = useMemo(() => ({
    groups: groups.data?.length || 0,
    contacts: groups.data?.reduce((total, group) => total + group.contactCount, 0) || 0,
    blacklist: blacklistSummary.data?.totalElements || 0,
  }), [blacklistSummary.data?.totalElements, groups.data]);

  const openCreateGroup = () => {
    resetFeedback();
    setEditingGroup(null);
    setGroupName('');
    setGroupDescription('');
    setGroupDialogOpen(true);
  };
  const openEditGroup = (group: ContactGroup) => {
    resetFeedback();
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupDescription(group.description || '');
    setGroupDialogOpen(true);
  };
  const openBulkDialog = () => {
    resetFeedback();
    setBulkContacts('');
    setBulkResult(null);
    setBulkDialogOpen(true);
  };
  const openImportDialog = () => {
    resetFeedback();
    setImportFile(null);
    setImportResult(null);
    if (importInput.current) importInput.current.value = '';
    setImportDialogOpen(true);
  };
  const openBlacklistDialog = () => {
    resetFeedback();
    setBlacklistPhone('');
    setBlacklistEntrySource('MANUAL');
    setBlacklistReasonCode('');
    setBlacklistReasonMessage('');
    setBlacklistDialogOpen(true);
  };
  const changeAccount = (value: string) => {
    setAccountId(value);
    setSelectedGroupId('');
    setContactPage(0);
    setBlacklistPage(0);
    resetFeedback();
  };

  if (accounts.isPending) return <div className="h-80 animate-pulse rounded-2xl bg-muted" />;
  if (accounts.isError) return <Card><CardContent><p className="text-sm text-error">{apiErrorMessage(accounts.error)}</p></CardContent></Card>;

  return <div className="space-y-6">
    <section className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-center">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20"><Icon icon="solar:users-group-rounded-linear" width={25} /></div>
        <div><p className="text-sm font-medium text-primary">Kitle yönetimi</p><h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Kişiler ve gruplar</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Kampanya hedeflerinizi gruplandırın, dosyadan aktarın ve gönderim dışı numaraları yönetin.</p></div>
      </div>
      {accounts.data?.length ? <Select value={accountId} onValueChange={changeAccount}><SelectTrigger className="h-10 min-w-56 bg-background"><SelectValue /></SelectTrigger><SelectContent>{accounts.data.map((account) => <SelectItem key={account.id} value={account.id}>{account.displayName || account.externalPhoneNumberId}</SelectItem>)}</SelectContent></Select> : null}
    </section>

    {!accounts.data?.length ? <Card className="border-dashed"><CardContent className="py-12 text-center"><Icon icon="solar:smartphone-linear" width={30} className="mx-auto text-muted-foreground" /><h2 className="mt-4 font-semibold">Önce WhatsApp hesabı bağlayın</h2><p className="mt-1 text-sm text-muted-foreground">Kişiler, bağlı WhatsApp hesabına göre ayrı tutulur.</p></CardContent></Card> : <>
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Kişi grubu', value: summary.groups, icon: 'solar:folder-with-files-linear', tone: 'bg-lightprimary text-primary' },
          { label: 'Toplam kişi', value: summary.contacts, icon: 'solar:user-rounded-linear', tone: 'bg-lightsuccess text-success' },
          { label: 'Kara listede', value: summary.blacklist, icon: 'solar:shield-warning-linear', tone: 'bg-lighterror text-error' },
        ].map((item) => <Card key={item.label} className="gap-0 p-5 shadow-sm"><CardContent className="flex items-center gap-4"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}><Icon icon={item.icon} width={22} /></div><div><p className="text-xl font-semibold">{item.value.toLocaleString('tr-TR')}</p><p className="text-sm text-muted-foreground">{item.label}</p></div></CardContent></Card>)}
      </section>

      {(notice || actionError) && <div className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${actionError ? 'bg-lighterror text-error' : 'bg-lightsuccess text-success'}`}><span>{actionError || notice}</span><button type="button" aria-label="Bildirimi kapat" onClick={resetFeedback}><Icon icon="solar:close-circle-linear" width={19} /></button></div>}

      <Tabs defaultValue="contacts" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto bg-card p-1.5 shadow-sm sm:w-auto">
          <TabsTrigger value="contacts"><Icon icon="solar:users-group-two-rounded-linear" />Gruplar ve kişiler</TabsTrigger>
          <TabsTrigger value="blacklist"><Icon icon="solar:shield-warning-linear" />Kara liste</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts">
          <div className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
            <Card className="gap-0 p-0 shadow-sm">
              <CardContent>
                <div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-semibold">Kişi grupları</h2><p className="mt-1 text-xs text-muted-foreground">{summary.groups} grup</p></div><Button size="sm" onClick={openCreateGroup}><Icon icon="solar:add-circle-linear" />Yeni grup</Button></div>
                {groups.isPending && <div className="space-y-3 p-4">{[1, 2, 3].map((item) => <div key={item} className="h-20 animate-pulse rounded-xl bg-muted" />)}</div>}
                {groups.isError && <p className="p-5 text-sm text-error">{apiErrorMessage(groups.error)}</p>}
                {groups.data?.length === 0 && <div className="p-8 text-center"><Icon icon="solar:folder-open-linear" width={30} className="mx-auto text-muted-foreground" /><p className="mt-3 font-medium">Henüz grup yok</p><p className="mt-1 text-xs text-muted-foreground">İlk grubunuzu oluşturarak başlayın.</p></div>}
                <div className="max-h-[650px] space-y-2 overflow-y-auto p-3">
                  {groups.data?.map((group) => <div key={group.id} className={`group w-full rounded-xl border p-4 transition ${selectedGroupId === group.id ? 'border-primary bg-lightprimary' : 'border-border hover:border-primary/40 hover:bg-muted/40'}`}>
                    <button type="button" onClick={() => { setSelectedGroupId(group.id); setContactPage(0); }} className="block w-full text-left"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold">{group.name}</p><p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{group.description || 'Açıklama eklenmemiş'}</p></div><Badge variant={selectedGroupId === group.id ? 'primary' : 'gray'}>{group.contactCount}</Badge></div></button>
                    <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2"><span className="text-xs text-muted-foreground">{formatDate(group.updatedAt)}</span><span className="flex opacity-100 xl:opacity-0 xl:group-hover:opacity-100"><button type="button" aria-label="Grubu düzenle" onClick={() => openEditGroup(group)} className="rounded-md p-1.5 text-primary hover:bg-lightprimary"><Icon icon="solar:pen-linear" /></button><button type="button" aria-label="Grubu sil" onClick={() => { if (window.confirm(`“${group.name}” grubu ve içindeki kişiler silinsin mi?`)) removeGroupMutation.mutate(group.id); }} className="rounded-md p-1.5 text-error hover:bg-lighterror"><Icon icon="solar:trash-bin-trash-linear" /></button></span></div>
                  </div>)}
                </div>
              </CardContent>
            </Card>

            <Card className="min-w-0 gap-0 p-0 shadow-sm">
              <CardContent>
                {!selectedGroup ? <div className="py-20 text-center"><Icon icon="solar:users-group-rounded-linear" width={36} className="mx-auto text-muted-foreground" /><h2 className="mt-4 font-semibold">Bir kişi grubu seçin</h2><p className="mt-1 text-sm text-muted-foreground">Grup kişileri burada görüntülenecek.</p></div> : <>
                  <div className="flex flex-col justify-between gap-4 border-b border-border p-5 lg:flex-row lg:items-center"><div><h2 className="text-lg font-semibold">{selectedGroup.name}</h2><p className="mt-1 text-xs text-muted-foreground">{selectedGroup.contactCount.toLocaleString('tr-TR')} kayıtlı kişi</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={openImportDialog}><Icon icon="solar:upload-linear" />Dosyadan aktar</Button><Button size="sm" onClick={openBulkDialog}><Icon icon="solar:user-plus-linear" />Kişi ekle</Button></div></div>
                  <div className="p-5"><div className="relative max-w-md"><Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={contactSearch} onChange={(event) => { setContactSearch(event.target.value); setContactPage(0); }} className="pl-9" placeholder="Ad veya telefon numarası ara" /></div></div>
                  {contacts.isPending && <div className="mx-5 mb-5 h-64 animate-pulse rounded-xl bg-muted" />}
                  {contacts.isError && <p className="px-5 pb-5 text-sm text-error">{apiErrorMessage(contacts.error)}</p>}
                  {contacts.data && <>
                    {contacts.data.content.length ? <Table><TableHeader><TableRow><TableHead className="pl-5">Kişi</TableHead><TableHead>Telefon</TableHead><TableHead>Eklenme tarihi</TableHead><TableHead className="w-14"><span className="sr-only">İşlem</span></TableHead></TableRow></TableHeader><TableBody>{contacts.data.content.map((contact) => <TableRow key={contact.id}><TableCell className="pl-5"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-lightprimary font-semibold text-primary">{(contact.displayName || contact.phoneNumber).charAt(0).toLocaleUpperCase('tr-TR')}</div><span className="font-medium">{contact.displayName || 'İsimsiz kişi'}</span></div></TableCell><TableCell className="font-mono text-xs">{contact.phoneNumber}</TableCell><TableCell className="text-muted-foreground">{formatDate(contact.createdAt)}</TableCell><TableCell><Button size="icon" variant="ghosterror" disabled={removeContactMutation.isPending} aria-label="Kişiyi gruptan kaldır" onClick={() => { if (window.confirm(`${contact.displayName || contact.phoneNumber} gruptan kaldırılsın mı?`)) removeContactMutation.mutate(contact.id); }}><Icon icon="solar:trash-bin-trash-linear" /></Button></TableCell></TableRow>)}</TableBody></Table> : <div className="px-5 pb-12 text-center"><Icon icon="solar:user-cross-linear" width={32} className="mx-auto text-muted-foreground" /><p className="mt-3 font-medium">{contactSearch ? 'Aramayla eşleşen kişi yok' : 'Bu grup henüz boş'}</p><p className="mt-1 text-xs text-muted-foreground">Kişileri tek seferde veya dosyadan ekleyebilirsiniz.</p></div>}
                    <div className="flex items-center justify-between border-t border-border p-4"><p className="text-xs text-muted-foreground">Toplam {contacts.data.totalElements.toLocaleString('tr-TR')} kişi · Sayfa {contacts.data.page + 1}/{pageCount(contacts.data.totalElements)}</p><div className="flex gap-2"><Button size="sm" variant="ghost" disabled={contactPage === 0} onClick={() => setContactPage((page) => page - 1)}><Icon icon="solar:alt-arrow-left-linear" />Önceki</Button><Button size="sm" variant="ghost" disabled={(contactPage + 1) * PAGE_SIZE >= contacts.data.totalElements} onClick={() => setContactPage((page) => page + 1)}>Sonraki<Icon icon="solar:alt-arrow-right-linear" /></Button></div></div>
                  </>}
                </>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="blacklist">
          <Card className="gap-0 p-0 shadow-sm"><CardContent>
            <div className="flex flex-col justify-between gap-4 border-b border-border p-5 lg:flex-row lg:items-center"><div><h2 className="text-lg font-semibold">Kara liste</h2><p className="mt-1 text-sm text-muted-foreground">Mesaj gönderilmemesi gereken numaraları hesap bazında yönetin.</p></div><Button onClick={openBlacklistDialog}><Icon icon="solar:shield-plus-linear" />Numara ekle</Button></div>
            <div className="grid gap-3 p-5 md:grid-cols-[minmax(220px,1fr)_190px_210px]"><div className="relative"><Icon icon="solar:magnifer-linear" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input value={blacklistSearch} onChange={(event) => { setBlacklistSearch(event.target.value); setBlacklistPage(0); }} className="pl-9" placeholder="Telefon veya açıklama ara" /></div><Select value={blacklistSource} onValueChange={(value) => { setBlacklistSource(value as 'ALL' | BlacklistSource); setBlacklistPage(0); }}><SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tüm kaynaklar</SelectItem><SelectItem value="MANUAL">Manuel</SelectItem><SelectItem value="PROVIDER_ERROR">Provider hatası</SelectItem></SelectContent></Select><Select value={blacklistReason} onValueChange={(value) => { setBlacklistReason(value); setBlacklistPage(0); }}><SelectTrigger className="w-full bg-background"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="ALL">Tüm nedenler</SelectItem>{reasonCodes.data?.map((reason) => <SelectItem key={reason.reasonCode} value={reason.reasonCode}>{reason.reasonCode} ({reason.count})</SelectItem>)}</SelectContent></Select></div>
            {blacklist.isPending && <div className="mx-5 mb-5 h-64 animate-pulse rounded-xl bg-muted" />}
            {blacklist.isError && <p className="px-5 pb-5 text-sm text-error">{apiErrorMessage(blacklist.error)}</p>}
            {blacklist.data && <>{blacklist.data.content.length ? <Table><TableHeader><TableRow><TableHead className="pl-5">Telefon</TableHead><TableHead>Kaynak</TableHead><TableHead>Neden</TableHead><TableHead>Eklenme tarihi</TableHead><TableHead className="w-14"><span className="sr-only">İşlem</span></TableHead></TableRow></TableHeader><TableBody>{blacklist.data.content.map((entry) => <TableRow key={entry.id}><TableCell className="pl-5 font-mono text-xs font-medium">{entry.phoneNumber}</TableCell><TableCell><Badge variant={entry.source === 'MANUAL' ? 'lightPrimary' : 'lightWarning'}>{sourceLabel(entry.source)}</Badge></TableCell><TableCell><p className="font-medium">{entry.reasonCode || 'Belirtilmedi'}</p>{entry.reasonMessage && <p className="mt-1 max-w-sm truncate text-xs text-muted-foreground">{entry.reasonMessage}</p>}</TableCell><TableCell className="text-muted-foreground">{formatDate(entry.createdAt)}</TableCell><TableCell><Button size="icon" variant="ghosterror" disabled={removeBlacklistMutation.isPending} aria-label="Kara listeden çıkar" onClick={() => { if (window.confirm(`${entry.phoneNumber} kara listeden çıkarılsın mı?`)) removeBlacklistMutation.mutate(entry.id); }}><Icon icon="solar:trash-bin-trash-linear" /></Button></TableCell></TableRow>)}</TableBody></Table> : <div className="px-5 pb-12 text-center"><Icon icon="solar:shield-check-linear" width={34} className="mx-auto text-success" /><p className="mt-3 font-medium">Kayıt bulunamadı</p><p className="mt-1 text-xs text-muted-foreground">Seçili filtrelerde kara liste kaydı yok.</p></div>}<div className="flex items-center justify-between border-t border-border p-4"><p className="text-xs text-muted-foreground">Toplam {blacklist.data.totalElements.toLocaleString('tr-TR')} kayıt · Sayfa {blacklist.data.page + 1}/{pageCount(blacklist.data.totalElements)}</p><div className="flex gap-2"><Button size="sm" variant="ghost" disabled={blacklistPage === 0} onClick={() => setBlacklistPage((page) => page - 1)}><Icon icon="solar:alt-arrow-left-linear" />Önceki</Button><Button size="sm" variant="ghost" disabled={(blacklistPage + 1) * PAGE_SIZE >= blacklist.data.totalElements} onClick={() => setBlacklistPage((page) => page + 1)}>Sonraki<Icon icon="solar:alt-arrow-right-linear" /></Button></div></div></>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </>}

    <Dialog open={groupDialogOpen} onOpenChange={setGroupDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingGroup ? 'Grubu düzenle' : 'Yeni kişi grubu'}</DialogTitle><DialogDescription className="font-normal text-muted-foreground">Kişileri kampanya ve toplu gönderimler için mantıksal gruplarda tutun.</DialogDescription></DialogHeader><div className="space-y-4"><div><Label htmlFor="group-name">Grup adı</Label><Input id="group-name" className="mt-2" maxLength={200} value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="VIP müşteriler" /></div><div><Label htmlFor="group-description">Açıklama</Label><Textarea id="group-description" maxLength={500} value={groupDescription} onChange={(event) => setGroupDescription(event.target.value)} placeholder="Bu grubun kullanım amacını yazın" /></div></div>{actionError && <p className="rounded-lg bg-lighterror p-3 text-sm font-normal text-error">{actionError}</p>}<DialogFooter><Button variant="ghost" onClick={() => setGroupDialogOpen(false)}>Vazgeç</Button><Button disabled={!groupName.trim() || saveGroup.isPending} onClick={() => { resetFeedback(); saveGroup.mutate(); }}>{saveGroup.isPending ? 'Kaydediliyor…' : 'Kaydet'}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Toplu kişi ekle</DialogTitle><DialogDescription className="font-normal text-muted-foreground">Her satıra telefon numarası ve isteğe bağlı adı yazın. Telefon ile adı virgül, noktalı virgül veya Tab ile ayırabilirsiniz.</DialogDescription></DialogHeader><div><Label htmlFor="bulk-contacts">Kişiler</Label><Textarea id="bulk-contacts" className="min-h-52 font-mono" value={bulkContacts} onChange={(event) => { setBulkContacts(event.target.value); setBulkResult(null); }} placeholder={'905551112233, Ayşe Yılmaz\n905554445566, Mehmet Kaya'} /><p className="mt-2 text-xs text-muted-foreground">En fazla 1.000 kişi · Şu an {parseContacts(bulkContacts).length} satır</p></div>{bulkResult && <div className="grid grid-cols-4 gap-2 rounded-xl bg-muted/60 p-3 text-center text-sm"><div><b className="block text-lg">{bulkResult.added}</b>Eklendi</div><div><b className="block text-lg">{bulkResult.skipped}</b>Atlandı</div><div><b className="block text-lg">{bulkResult.invalid}</b>Geçersiz</div><div><b className="block text-lg">{bulkResult.requested}</b>Toplam</div></div>}{actionError && <p className="rounded-lg bg-lighterror p-3 text-sm text-error">{actionError}</p>}<DialogFooter><Button variant="ghost" onClick={() => setBulkDialogOpen(false)}>Kapat</Button><Button disabled={!parseContacts(bulkContacts).length || parseContacts(bulkContacts).length > 1000 || addContactsMutation.isPending} onClick={() => { resetFeedback(); addContactsMutation.mutate(); }}>{addContactsMutation.isPending ? 'Ekleniyor…' : 'Kişileri ekle'}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}><DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>Dosyadan kişi aktar</DialogTitle><DialogDescription className="font-normal text-muted-foreground">CSV, XLS veya XLSX dosyanızdaki telefon ve ad sütunlarını içe aktarın.</DialogDescription></DialogHeader><div className="rounded-xl border border-dashed border-border p-5"><Label htmlFor="contact-import">Kişi dosyası</Label><Input ref={importInput} id="contact-import" type="file" className="mt-2" accept=".csv,.xls,.xlsx,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { setImportFile(event.target.files?.[0] || null); setImportResult(null); }} /><p className="mt-2 text-xs text-muted-foreground">İlk satır başlık olabilir. Desteklenen sütunlar: telefon numarası ve kişi adı.</p></div>{importResult && <div className="space-y-3"><div className="grid grid-cols-4 gap-2 rounded-xl bg-muted/60 p-3 text-center text-sm"><div><b className="block text-lg">{importResult.added}</b>Eklendi</div><div><b className="block text-lg">{importResult.skipped}</b>Atlandı</div><div><b className="block text-lg">{importResult.invalid}</b>Geçersiz</div><div><b className="block text-lg">{importResult.blank}</b>Boş</div></div>{importResult.issues.length > 0 && <div className="max-h-36 overflow-auto rounded-lg bg-lighterror p-3 text-xs text-error">{importResult.issues.map((issue) => <p key={`${issue.rowNumber}-${issue.code}`} className="mb-1">Satır {issue.rowNumber}: {issue.message}</p>)}{importResult.issuesTruncated && <p className="font-semibold">Daha fazla hata raporu kısaltıldı.</p>}</div>}</div>}{actionError && <p className="rounded-lg bg-lighterror p-3 text-sm text-error">{actionError}</p>}<DialogFooter><Button variant="ghost" onClick={() => setImportDialogOpen(false)}>Kapat</Button><Button disabled={!importFile || importContactsMutation.isPending} onClick={() => { resetFeedback(); importContactsMutation.mutate(); }}>{importContactsMutation.isPending ? 'Aktarılıyor…' : 'İçe aktar'}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={blacklistDialogOpen} onOpenChange={setBlacklistDialogOpen}><DialogContent><DialogHeader><DialogTitle>Kara listeye numara ekle</DialogTitle><DialogDescription className="font-normal text-muted-foreground">Bu numara kampanya gönderimlerinin dışında tutulur.</DialogDescription></DialogHeader><div className="space-y-4"><div><Label htmlFor="blacklist-phone">Telefon numarası</Label><Input id="blacklist-phone" className="mt-2" maxLength={50} value={blacklistPhone} onChange={(event) => setBlacklistPhone(event.target.value)} placeholder="905551112233" /></div><div><Label>Kaynak</Label><Select value={blacklistEntrySource} onValueChange={(value) => setBlacklistEntrySource(value as BlacklistSource)}><SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MANUAL">Manuel</SelectItem><SelectItem value="PROVIDER_ERROR">Provider hatası</SelectItem></SelectContent></Select></div><div><Label htmlFor="blacklist-reason-code">Neden kodu</Label><Input id="blacklist-reason-code" className="mt-2" maxLength={100} value={blacklistReasonCode} onChange={(event) => setBlacklistReasonCode(event.target.value)} placeholder="OPT_OUT" /></div><div><Label htmlFor="blacklist-reason-message">Açıklama</Label><Textarea id="blacklist-reason-message" maxLength={500} value={blacklistReasonMessage} onChange={(event) => setBlacklistReasonMessage(event.target.value)} placeholder="Kullanıcı ileti almak istemiyor" /></div></div>{actionError && <p className="rounded-lg bg-lighterror p-3 text-sm font-normal text-error">{actionError}</p>}<DialogFooter><Button variant="ghost" onClick={() => setBlacklistDialogOpen(false)}>Vazgeç</Button><Button disabled={!blacklistPhone.trim() || addBlacklistMutation.isPending} onClick={() => { resetFeedback(); addBlacklistMutation.mutate(); }}>{addBlacklistMutation.isPending ? 'Ekleniyor…' : 'Kara listeye ekle'}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
