import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { Card, CardContent } from 'src/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from 'src/components/ui/dialog';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select';
import { Switch } from 'src/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table';
import { Textarea } from 'src/components/ui/textarea';
import { listAccounts } from 'src/features/accounts/api/accounts-api';
import { apiErrorMessage } from 'src/shared/api/error-message';
import {
  type ActionExecutionStatus,
  type ActionMatchType,
  type ExternalAction,
  type SaveExternalActionInput,
  actionToInput,
  createAction,
  deleteAction,
  listActionExecutions,
  listActions,
  updateAction,
} from '../api/actions-api';

interface ActionForm {
  name: string;
  command: string;
  matchType: ActionMatchType;
  endpointUrl: string;
  sharedSecret: string;
  acknowledgementMessage: string;
  pendingMessage: string;
  failureMessage: string;
  timeoutMinutes: string;
  priority: string;
  enabled: boolean;
}

const emptyForm: ActionForm = {
  name: '',
  command: '/rapor',
  matchType: 'STARTS_WITH',
  endpointUrl: '',
  sharedSecret: '',
  acknowledgementMessage: 'İsteğiniz alındı. Hazır olduğunda sonucu buradan göndereceğim.',
  pendingMessage: 'Bu işlem için hâlâ bekleyen bir isteğiniz var. Hazır olduğunda size göndereceğim.',
  failureMessage: 'İşleminiz şu anda tamamlanamadı. Lütfen daha sonra tekrar deneyin.',
  timeoutMinutes: '240',
  priority: '100',
  enabled: true,
};

const statusMeta: Record<ActionExecutionStatus, { label: string; icon: string; variant: 'lightWarning' | 'lightInfo' | 'lightSuccess' | 'lightError' }> = {
  QUEUED: { label: 'Sırada', icon: 'solar:clock-circle-linear', variant: 'lightWarning' },
  DISPATCHING: { label: 'Gönderiliyor', icon: 'solar:upload-linear', variant: 'lightInfo' },
  PENDING: { label: 'Sonuç bekleniyor', icon: 'solar:hourglass-line-linear', variant: 'lightInfo' },
  COMPLETED: { label: 'Tamamlandı', icon: 'solar:check-circle-linear', variant: 'lightSuccess' },
  FAILED: { label: 'Başarısız', icon: 'solar:danger-circle-linear', variant: 'lightError' },
  TIMED_OUT: { label: 'Zaman aşımı', icon: 'solar:clock-circle-linear', variant: 'lightError' },
};

const numberFormatter = new Intl.NumberFormat('tr-TR');
const dateFormatter = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
const EXECUTION_PAGE_SIZE = 50;

function formatDate(value: string | null): string {
  return value ? dateFormatter.format(new Date(value)) : '—';
}

function formatDuration(seconds: number): string {
  if (seconds % 3600 === 0) return `${seconds / 3600} saat`;
  if (seconds >= 3600) return `${Math.round(seconds / 360) / 10} saat`;
  return `${Math.ceil(seconds / 60)} dakika`;
}

function generateSecret(): string {
  const bytes = new Uint8Array(32);
  window.crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function toForm(action: ExternalAction): ActionForm {
  return {
    name: action.name,
    command: action.command,
    matchType: action.matchType,
    endpointUrl: action.endpointUrl,
    sharedSecret: '',
    acknowledgementMessage: action.acknowledgementMessage,
    pendingMessage: action.pendingMessage,
    failureMessage: action.failureMessage,
    timeoutMinutes: String(Math.ceil(action.timeoutSeconds / 60)),
    priority: String(action.priority),
    enabled: action.enabled,
  };
}

function toInput(form: ActionForm): SaveExternalActionInput {
  return {
    name: form.name.trim(),
    command: form.command.trim(),
    matchType: form.matchType,
    endpointUrl: form.endpointUrl.trim(),
    ...(form.sharedSecret.trim() ? { sharedSecret: form.sharedSecret.trim() } : {}),
    acknowledgementMessage: form.acknowledgementMessage.trim(),
    pendingMessage: form.pendingMessage.trim(),
    failureMessage: form.failureMessage.trim(),
    timeoutSeconds: Number(form.timeoutMinutes) * 60,
    priority: Number(form.priority),
    enabled: form.enabled,
  };
}

export default function ActionsPage() {
  const queryClient = useQueryClient();
  const accounts = useQuery({ queryKey: ['whatsapp', 'accounts'], queryFn: listAccounts });
  const [accountId, setAccountId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [protocolOpen, setProtocolOpen] = useState(false);
  const [editing, setEditing] = useState<ExternalAction | null>(null);
  const [form, setForm] = useState<ActionForm>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [executionPage, setExecutionPage] = useState(0);

  useEffect(() => {
    if (!accountId && accounts.data?.length) setAccountId(accounts.data[0].id);
  }, [accountId, accounts.data]);

  const actions = useQuery({
    queryKey: ['external-actions', accountId],
    queryFn: () => listActions(accountId),
    enabled: Boolean(accountId),
  });
  const executions = useQuery({
    queryKey: ['action-executions', accountId, executionPage],
    queryFn: () => listActionExecutions(accountId, executionPage, EXECUTION_PAGE_SIZE),
    enabled: Boolean(accountId),
    refetchInterval: 10_000,
  });

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['external-actions', accountId] }),
      queryClient.invalidateQueries({ queryKey: ['action-executions', accountId] }),
    ]);
  };
  const save = useMutation({
    mutationFn: (input: SaveExternalActionInput) => editing
      ? updateAction(accountId, editing.id, input)
      : createAction(accountId, input),
    onSuccess: async () => {
      await refresh();
      setDialogOpen(false);
      setEditing(null);
      setForm(emptyForm);
      setFormError(null);
    },
    onError: (error) => setFormError(apiErrorMessage(error)),
  });
  const toggle = useMutation({
    mutationFn: ({ action, enabled }: { action: ExternalAction; enabled: boolean }) =>
      updateAction(accountId, action.id, { ...actionToInput(action), enabled }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (actionId: string) => deleteAction(accountId, actionId),
    onSuccess: refresh,
  });

  const summary = useMemo(() => {
    const executionList = executions.data?.content || [];
    return {
      active: (actions.data || []).filter((action) => action.enabled).length,
      pending: executionList.filter((execution) => ['QUEUED', 'DISPATCHING', 'PENDING'].includes(execution.status)).length,
      completed: executionList.filter((execution) => execution.status === 'COMPLETED').length,
      failed: executionList.filter((execution) => execution.status === 'FAILED' || execution.status === 'TIMED_OUT').length,
    };
  }, [actions.data, executions.data?.content]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, sharedSecret: generateSecret() });
    setFormError(null);
    setCopied(false);
    setDialogOpen(true);
  };
  const openEdit = (action: ExternalAction) => {
    setEditing(action);
    setForm(toForm(action));
    setFormError(null);
    setCopied(false);
    setDialogOpen(true);
  };
  const copySecret = async () => {
    await navigator.clipboard.writeText(form.sharedSecret);
    setCopied(true);
  };
  const submit = () => {
    const input = toInput(form);
    if (!input.name || !input.command || !input.endpointUrl
      || !input.acknowledgementMessage || !input.pendingMessage || !input.failureMessage) {
      setFormError('Ad, komut, endpoint ve kullanıcı mesajlarının tamamı zorunludur.');
      return;
    }
    if (!editing && (!input.sharedSecret || input.sharedSecret.length < 32)) {
      setFormError('Yeni aksiyon için en az 32 karakterlik bir secret gereklidir.');
      return;
    }
    if (input.timeoutSeconds < 60 || input.timeoutSeconds > 604800) {
      setFormError('Zaman aşımı 1 dakika ile 7 gün arasında olmalıdır.');
      return;
    }
    setFormError(null);
    save.mutate(input);
  };

  if (accounts.isPending) return <div className="h-80 animate-pulse rounded-2xl bg-muted" />;
  if (accounts.isError) return <Card><CardContent><p className="text-sm text-error">{apiErrorMessage(accounts.error)}</p></CardContent></Card>;

  return <div className="space-y-6">
    <section className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-center">
      <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-white shadow-lg shadow-secondary/20"><Icon icon="solar:server-square-cloud-linear" width={25} /></div><div><p className="text-sm font-medium text-secondary">Dış sistem entegrasyonu</p><h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Aksiyonlar</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">WhatsApp komutlarıyla başka sistemlerde uzun süren işler başlatın; sonuç hazır olduğunda otomatik gönderin.</p></div></div>
      <div className="flex flex-col gap-3 sm:flex-row">{accounts.data?.length ? <Select value={accountId} onValueChange={(value) => { setAccountId(value); setExecutionPage(0); }}><SelectTrigger className="h-10 min-w-56 bg-background"><SelectValue /></SelectTrigger><SelectContent>{accounts.data.map((account) => <SelectItem key={account.id} value={account.id}>{account.displayName || account.externalPhoneNumberId}</SelectItem>)}</SelectContent></Select> : null}<Button variant="outline" onClick={() => setProtocolOpen(true)}><Icon icon="solar:code-file-linear" />Protokol</Button><Button onClick={openCreate}><Icon icon="solar:add-circle-linear" />Yeni aksiyon</Button></div>
    </section>

    {!accounts.data?.length ? <Card className="border-dashed"><CardContent className="py-12 text-center"><Icon icon="solar:smartphone-linear" width={30} className="mx-auto text-muted-foreground" /><h2 className="mt-4 font-semibold">Önce WhatsApp hesabı bağlayın</h2></CardContent></Card> : <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Aktif aksiyon', value: summary.active, icon: 'solar:bolt-circle-linear', tone: 'bg-lightprimary text-primary' },
          { label: 'Sonuç bekleyen', value: summary.pending, icon: 'solar:hourglass-line-linear', tone: 'bg-lightinfo text-info' },
          { label: 'Tamamlanan', value: summary.completed, icon: 'solar:check-circle-linear', tone: 'bg-lightsuccess text-success' },
          { label: 'Başarısız / süre aşımı', value: summary.failed, icon: 'solar:danger-circle-linear', tone: 'bg-lighterror text-error' },
        ].map((item) => <Card key={item.label} className="gap-0 p-5 shadow-sm"><CardContent className="flex items-center gap-4"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}><Icon icon={item.icon} width={22} /></div><div><p className="text-2xl font-semibold">{numberFormatter.format(item.value)}</p><p className="text-sm text-muted-foreground">{item.label}</p></div></CardContent></Card>)}
      </section>

      <section className="space-y-4"><div className="flex items-end justify-between"><div><h2 className="text-lg font-semibold">Komut aksiyonları</h2><p className="mt-1 text-sm text-muted-foreground">Küçük öncelik numarası önce değerlendirilir.</p></div><Badge variant="gray">{actions.data?.length || 0} aksiyon</Badge></div>
        {actions.isPending && <div className="grid gap-4 lg:grid-cols-2">{[1, 2].map((item) => <div key={item} className="h-56 animate-pulse rounded-2xl bg-muted" />)}</div>}
        {actions.isError && <Card><CardContent><p className="text-sm text-error">{apiErrorMessage(actions.error)}</p></CardContent></Card>}
        {actions.data?.length === 0 && <Card className="border-dashed"><CardContent className="py-12 text-center"><Icon icon="solar:server-square-cloud-linear" width={34} className="mx-auto text-muted-foreground" /><h3 className="mt-4 font-semibold">İlk aksiyonunuzu oluşturun</h3><p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">Örneğin `/rapor` komutunu raporlama sisteminize bağlayıp sonuç hazır olduğunda PDF gönderebilirsiniz.</p><Button className="mt-5" onClick={openCreate}>Aksiyon oluştur</Button></CardContent></Card>}
        <div className="grid gap-4 lg:grid-cols-2">{actions.data?.map((action) => <Card key={action.id} className={`gap-0 p-0 shadow-sm ${action.enabled ? 'border-primary/30' : 'opacity-75'}`}><CardContent><div className="flex items-start gap-4 p-5"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.enabled ? 'bg-lightprimary text-primary' : 'bg-muted text-muted-foreground'}`}><Icon icon="solar:code-circle-linear" width={22} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{action.name}</h3><Badge variant={action.enabled ? 'lightSuccess' : 'gray'}>{action.enabled ? 'Aktif' : 'Kapalı'}</Badge><Badge variant="lightSecondary">Öncelik {action.priority}</Badge></div><code className="mt-2 inline-block rounded-md bg-muted px-2 py-1 text-xs font-semibold text-primary">{action.command}{action.matchType === 'STARTS_WITH' ? ' …' : ''}</code></div><Switch checked={action.enabled} disabled={toggle.isPending} onCheckedChange={(enabled) => toggle.mutate({ action, enabled })} /></div><div className="space-y-3 border-t border-border px-5 py-4"><div className="flex items-start gap-2 text-sm"><Icon icon="solar:link-linear" className="mt-0.5 shrink-0 text-muted-foreground" /><span className="min-w-0 break-all text-muted-foreground">{action.endpointUrl}</span></div><div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span className="flex items-center gap-1.5"><Icon icon="solar:clock-circle-linear" />{formatDuration(action.timeoutSeconds)} timeout</span><span className="flex items-center gap-1.5"><Icon icon="solar:shield-keyhole-linear" />HMAC secret kayıtlı</span><span className="flex items-center gap-1.5"><Icon icon="solar:calendar-linear" />{formatDate(action.updatedAt)}</span></div></div><div className="flex justify-end gap-2 border-t border-border p-3"><Button size="sm" variant="ghostprimary" onClick={() => openEdit(action)}><Icon icon="solar:pen-linear" />Düzenle</Button><Button size="sm" variant="ghosterror" disabled={remove.isPending} onClick={() => { if (window.confirm(`“${action.name}” aksiyonu ve geçmişi silinsin mi?`)) remove.mutate(action.id); }}><Icon icon="solar:trash-bin-trash-linear" />Sil</Button></div></CardContent></Card>)}</div>
      </section>

      <section className="space-y-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-lg font-semibold">Aksiyon geçmişi</h2><p className="mt-1 text-sm text-muted-foreground">Dış sisteme gönderilen ve callback bekleyen işlemler 10 saniyede bir yenilenir.</p></div><Button size="sm" variant="outline" disabled={executions.isFetching} onClick={() => executions.refetch()}><Icon icon="solar:refresh-linear" className={executions.isFetching ? 'animate-spin' : ''} />Yenile</Button></div>
        {executions.isPending && <div className="h-56 animate-pulse rounded-2xl bg-muted" />}
        {executions.isError && <Card><CardContent><p className="text-sm text-error">{apiErrorMessage(executions.error)}</p></CardContent></Card>}
        {executions.data?.content.length === 0 && <Card className="border-dashed"><CardContent className="py-9 text-center"><Icon icon="solar:history-linear" width={28} className="mx-auto text-muted-foreground" /><p className="mt-3 font-medium">Henüz aksiyon çalışmadı</p></CardContent></Card>}
        {Boolean(executions.data?.content.length) && <Card className="gap-0 overflow-hidden p-0 shadow-sm"><CardContent><Table><TableHeader><TableRow><TableHead className="pl-5">Aksiyon</TableHead><TableHead>Kullanıcı / istek</TableHead><TableHead>Durum</TableHead><TableHead>Deneme</TableHead><TableHead>Başlangıç</TableHead><TableHead>Sonuç</TableHead></TableRow></TableHeader><TableBody>{executions.data?.content.map((execution) => { const meta = statusMeta[execution.status]; return <TableRow key={execution.id}><TableCell className="pl-5"><p className="font-medium">{execution.actionName}</p><p className="mt-1 max-w-40 truncate font-mono text-[11px] text-muted-foreground">{execution.externalRequestId || execution.id}</p></TableCell><TableCell><p className="font-mono text-xs">{execution.customerWaId}</p><p className="mt-1 max-w-64 truncate text-xs text-muted-foreground">{execution.requestText}</p></TableCell><TableCell><Badge variant={meta.variant} className="gap-1"><Icon icon={meta.icon} />{meta.label}</Badge>{execution.lastError && <p className="mt-1 max-w-56 truncate text-[11px] text-error" title={execution.lastError}>{execution.lastError}</p>}</TableCell><TableCell>{execution.attempts}</TableCell><TableCell className="text-xs text-muted-foreground">{formatDate(execution.createdAt)}</TableCell><TableCell className="text-xs text-muted-foreground">{formatDate(execution.completedAt)}</TableCell></TableRow>; })}</TableBody></Table><div className="flex items-center justify-between border-t border-border p-4"><p className="text-xs text-muted-foreground">Toplam {executions.data?.totalElements.toLocaleString('tr-TR')} işlem · Sayfa {(executions.data?.page || 0) + 1}/{Math.max(1, Math.ceil((executions.data?.totalElements || 0) / EXECUTION_PAGE_SIZE))}</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={executionPage === 0 || executions.isFetching} onClick={() => setExecutionPage((value) => value - 1)}><Icon icon="solar:alt-arrow-left-linear" />Önceki</Button><Button size="sm" variant="outline" disabled={(executionPage + 1) * EXECUTION_PAGE_SIZE >= (executions.data?.totalElements || 0) || executions.isFetching} onClick={() => setExecutionPage((value) => value + 1)}>Sonraki<Icon icon="solar:alt-arrow-right-linear" /></Button></div></div></CardContent></Card>}
      </section>
    </>}

    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0"><DialogHeader className="border-b border-border px-6 py-5"><DialogTitle>{editing ? 'Aksiyonu düzenle' : 'Yeni dış sistem aksiyonu'}</DialogTitle><DialogDescription className="font-normal text-muted-foreground">Komutu, dış sistem endpoint'ini ve kullanıcıya gönderilecek durum mesajlarını belirleyin.</DialogDescription></DialogHeader><div className="grid gap-5 px-6 py-2 md:grid-cols-2"><div><Label htmlFor="action-name">Aksiyon adı</Label><Input id="action-name" className="mt-2" maxLength={200} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Aylık rapor" /></div><div><Label htmlFor="action-command">WhatsApp komutu</Label><Input id="action-command" className="mt-2 font-mono" maxLength={100} value={form.command} onChange={(event) => setForm({ ...form, command: event.target.value })} placeholder="/rapor" /></div><div><Label>Eşleşme şekli</Label><Select value={form.matchType} onValueChange={(value: ActionMatchType) => setForm({ ...form, matchType: value })}><SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="EXACT">Tam komut</SelectItem><SelectItem value="STARTS_WITH">Komut + parametre</SelectItem></SelectContent></Select><p className="mt-1.5 text-xs text-muted-foreground">Komut + parametre seçilirse `/rapor eylül` içindeki “eylül” dış sisteme arguments olarak gider.</p></div><div><Label htmlFor="action-priority">Öncelik</Label><Input id="action-priority" type="number" min={1} max={9999} className="mt-2" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} /></div><div className="md:col-span-2"><Label htmlFor="action-endpoint">Dış sistem endpoint'i</Label><Input id="action-endpoint" type="url" className="mt-2" maxLength={1000} value={form.endpointUrl} onChange={(event) => setForm({ ...form, endpointUrl: event.target.value })} placeholder="https://rapor.example.com/api/whatsapi/actions" /><p className="mt-1.5 text-xs text-muted-foreground">Production ortamında HTTPS zorunludur. Endpoint isteği hızlıca 2xx ile kabul edip işi kendi kuyruğunda hazırlamalıdır.</p></div><div className="md:col-span-2"><div className="flex items-center justify-between"><Label htmlFor="action-secret">Paylaşılan HMAC secret</Label><Button type="button" size="sm" variant="ghostprimary" onClick={() => setForm({ ...form, sharedSecret: generateSecret() })}>Yenisini üret</Button></div><div className="mt-2 flex gap-2"><Input id="action-secret" type="password" className="font-mono" value={form.sharedSecret} onChange={(event) => { setForm({ ...form, sharedSecret: event.target.value }); setCopied(false); }} placeholder={editing ? 'Değiştirmemek için boş bırakın' : 'En az 32 karakter'} /><Button type="button" variant="outline" disabled={!form.sharedSecret} onClick={copySecret}><Icon icon={copied ? 'solar:check-circle-linear' : 'solar:copy-linear'} />{copied ? 'Kopyalandı' : 'Kopyala'}</Button></div><p className="mt-1.5 text-xs text-warning">Bu değer kaydedildikten sonra tekrar gösterilmez. Şimdi dış projenizin secret ayarına da ekleyin.</p></div><div><Label htmlFor="action-timeout">Zaman aşımı (dakika)</Label><Input id="action-timeout" type="number" min={1} max={10080} className="mt-2" value={form.timeoutMinutes} onChange={(event) => setForm({ ...form, timeoutMinutes: event.target.value })} /></div><div className="flex items-center justify-between rounded-xl border border-border p-4"><div><p className="text-sm font-medium">Aksiyon aktif</p><p className="mt-1 text-xs text-muted-foreground">Komutu hemen dinlemeye başlar.</p></div><Switch checked={form.enabled} onCheckedChange={(enabled) => setForm({ ...form, enabled })} /></div><div className="md:col-span-2"><Label htmlFor="action-ack">İstek alındı mesajı</Label><Textarea id="action-ack" className="min-h-20" maxLength={4096} value={form.acknowledgementMessage} onChange={(event) => setForm({ ...form, acknowledgementMessage: event.target.value })} /></div><div className="md:col-span-2"><Label htmlFor="action-pending">Tekrar istek gelirse</Label><Textarea id="action-pending" className="min-h-20" maxLength={4096} value={form.pendingMessage} onChange={(event) => setForm({ ...form, pendingMessage: event.target.value })} /></div><div className="md:col-span-2"><Label htmlFor="action-failure">Hata veya zaman aşımı mesajı</Label><Textarea id="action-failure" className="min-h-20" maxLength={4096} value={form.failureMessage} onChange={(event) => setForm({ ...form, failureMessage: event.target.value })} /></div>{formError && <div className="rounded-lg bg-lighterror p-3 text-sm text-error md:col-span-2">{formError}</div>}</div><DialogFooter className="border-t border-border px-6 py-4"><Button variant="ghost" onClick={() => setDialogOpen(false)}>İptal</Button><Button disabled={save.isPending} onClick={submit}>{save.isPending ? 'Kaydediliyor…' : editing ? 'Değişiklikleri kaydet' : 'Aksiyonu oluştur'}</Button></DialogFooter></DialogContent></Dialog>

    <Dialog open={protocolOpen} onOpenChange={setProtocolOpen}><DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>External Action Protocol v1.0</DialogTitle><DialogDescription className="font-normal text-muted-foreground">Dış projenizin uygulaması gereken kısa entegrasyon sözleşmesi.</DialogDescription></DialogHeader><div className="space-y-5 text-sm"><div className="grid gap-3 sm:grid-cols-3">{[['1', 'İsteği doğrula', 'HMAC-SHA256 imzasını ham body üzerinden kontrol et.'], ['2', 'İşi kuyruğa al', 'Aynı eventId için tek iş oluştur ve hızlıca 2xx dön.'], ['3', 'Callback gönder', 'Sonuç hazır olduğunda verilen callback URL’ine imzalı POST yap.']].map(([number, title, description]) => <div key={number} className="rounded-xl border border-border p-4"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{number}</span><p className="mt-3 font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div>)}</div><div><p className="font-semibold">İmza formülü</p><pre className="mt-2 overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs text-gray-100">HMAC_SHA256(secret, timestamp + &quot;.&quot; + rawRequestBody){'\n'}X-WhatsAPI-Signature: sha256=&lt;hex&gt;</pre></div><div><p className="font-semibold">Tamamlanan metin callback'i</p><pre className="mt-2 overflow-x-auto rounded-xl bg-gray-950 p-4 text-xs leading-5 text-gray-100">{`{
  "protocolVersion": "1.0",
  "status": "COMPLETED",
  "externalRequestId": "report-184",
  "result": {
    "type": "TEXT",
    "text": "Raporunuz hazır: https://..."
  }
}`}</pre></div><div className="rounded-xl bg-lightwarning p-4 text-warning"><p className="font-semibold">Önemli</p><p className="mt-1 text-xs leading-5">JSON parse edilmeden önce ham body saklanmalıdır. Callback imzasında aynı secret, güncel Unix timestamp ve callback'in ham body içeriği kullanılır. Metin dışında IMAGE ve DOCUMENT sonuçları da desteklenir.</p></div><p className="text-xs text-muted-foreground">Backend deposundaki <code>docs/ACTION_INTEGRATION_PROTOCOL.md</code> dosyasında Node.js ve Laravel doğrulama örnekleri, tüm payload alanları ve production kontrol listesi bulunur.</p></div><DialogFooter><Button onClick={() => setProtocolOpen(false)}>Anladım</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
