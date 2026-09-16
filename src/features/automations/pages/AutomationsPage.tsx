import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { Card, CardContent } from 'src/components/ui/card';
import { Checkbox } from 'src/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from 'src/components/ui/dialog';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select';
import { Switch } from 'src/components/ui/switch';
import { Textarea } from 'src/components/ui/textarea';
import { listAccounts } from 'src/features/accounts/api/accounts-api';
import { type MediaAsset, listMediaAssets } from 'src/features/media/api/media-assets-api';
import { apiErrorMessage } from 'src/shared/api/error-message';
import {
  type AutomationActivityState,
  type AutoReplyRule,
  type DayOfWeek,
  type MatchType,
  type ResponseType,
  type SaveAutoReplyRuleInput,
  createAutoReplyRule,
  deleteAutoReplyRule,
  getAutomationActivity,
  listAutoReplyRules,
  previewAutoReply,
  ruleToInput,
  updateAutoReplyRule,
} from '../api/auto-replies-api';

const dayOptions: { value: DayOfWeek; short: string }[] = [
  { value: 'MONDAY', short: 'Pzt' },
  { value: 'TUESDAY', short: 'Sal' },
  { value: 'WEDNESDAY', short: 'Çar' },
  { value: 'THURSDAY', short: 'Per' },
  { value: 'FRIDAY', short: 'Cum' },
  { value: 'SATURDAY', short: 'Cmt' },
  { value: 'SUNDAY', short: 'Paz' },
];

const matchLabels: Record<MatchType, string> = {
  EXACT: 'Tam eşleşme',
  STARTS_WITH: 'Şununla başlar',
  CONTAINS: 'İçerir',
  ALL: 'Tüm mesajlar',
};

const activityStateMeta: Record<AutomationActivityState, { label: string; icon: string; className: string }> = {
  QUEUED: { label: 'Sırada', icon: 'solar:clock-circle-linear', className: 'bg-lightwarning text-warning' },
  PROCESSING: { label: 'İşleniyor', icon: 'solar:refresh-circle-linear', className: 'bg-lightinfo text-info' },
  RETRY: { label: 'Yeniden denenecek', icon: 'solar:restart-linear', className: 'bg-lightwarning text-warning' },
  COMPLETED: { label: 'Tamamlandı', icon: 'solar:check-circle-linear', className: 'bg-lightsuccess text-success' },
  DEAD: { label: 'Başarısız', icon: 'solar:danger-circle-linear', className: 'bg-lighterror text-error' },
  CANCELLED: { label: 'İnsan devraldı', icon: 'solar:user-hand-up-linear', className: 'bg-lightwarning text-warning' },
  FALLBACK: { label: 'Yedek cevap', icon: 'solar:shield-warning-linear', className: 'bg-lightsecondary text-secondary' },
};

const defaultAiPrompt = 'Sen bir WhatsApp müşteri destek asistanısın. Kullanıcının dilinde, kısa, net ve yardımsever cevap ver. Bilmediğin bilgileri uydurma; gerekirse bir yetkiliye yönlendir. Yalnızca müşteriye gönderilecek cevabı üret.';

interface RuleFormState {
  name: string;
  keywords: string;
  matchType: MatchType;
  responseType: ResponseType;
  replyText: string;
  aiSystemPrompt: string;
  mediaAssetId: string;
  priority: string;
  enabled: boolean;
  scheduleEnabled: boolean;
  scheduleStart: string;
  scheduleEnd: string;
  scheduleDays: DayOfWeek[];
  allowedPhones: string;
  cooldownSeconds: string;
  dailyLimit: string;
}

const emptyForm: RuleFormState = {
  name: '',
  keywords: '',
  matchType: 'CONTAINS',
  responseType: 'STATIC_TEXT',
  replyText: '',
  aiSystemPrompt: defaultAiPrompt,
  mediaAssetId: '',
  priority: '100',
  enabled: true,
  scheduleEnabled: false,
  scheduleStart: '09:00',
  scheduleEnd: '18:00',
  scheduleDays: dayOptions.map((day) => day.value),
  allowedPhones: '',
  cooldownSeconds: '60',
  dailyLimit: '10',
};

const numberFormatter = new Intl.NumberFormat('tr-TR');

const responseTypeMeta: Record<ResponseType, { label: string; icon: string; tone: string; badge: 'lightPrimary' | 'lightSecondary' | 'lightWarning' }> = {
  STATIC_TEXT: { label: 'Sabit cevap', icon: 'solar:chat-round-line-linear', tone: 'bg-lightprimary text-primary', badge: 'lightPrimary' },
  AI: { label: 'Groq AI', icon: 'solar:magic-stick-3-linear', tone: 'bg-lightsecondary text-secondary', badge: 'lightSecondary' },
  MEDIA: { label: 'Galeri medyası', icon: 'solar:gallery-wide-linear', tone: 'bg-lightwarning text-warning', badge: 'lightWarning' },
};

function MediaAssetPreview({ asset, compact = false }: { asset: MediaAsset; compact?: boolean }) {
  if (asset.mediaType === 'IMAGE') {
    return <img src={asset.publicUrl} alt={asset.name} className={`${compact ? 'h-16 w-20' : 'h-28 w-full'} rounded-lg bg-background object-contain`} />;
  }
  return <div className={`${compact ? 'h-16 w-20' : 'h-28 w-full'} flex shrink-0 flex-col items-center justify-center rounded-lg bg-lighterror text-error`}><Icon icon="solar:file-text-bold" width={compact ? 24 : 34} /><span className="mt-1 text-[10px] font-semibold">PDF</span></div>;
}

function toForm(rule: AutoReplyRule): RuleFormState {
  return {
    name: rule.name,
    keywords: rule.keywords.join(', '),
    matchType: rule.matchType,
    responseType: rule.responseType,
    replyText: rule.replyText,
    aiSystemPrompt: rule.aiSystemPrompt || defaultAiPrompt,
    mediaAssetId: rule.mediaAssetId || '',
    priority: String(rule.priority),
    enabled: rule.enabled,
    scheduleEnabled: Boolean(rule.scheduleStart && rule.scheduleEnd),
    scheduleStart: rule.scheduleStart?.slice(0, 5) || '09:00',
    scheduleEnd: rule.scheduleEnd?.slice(0, 5) || '18:00',
    scheduleDays: rule.scheduleDays,
    allowedPhones: rule.allowedPhones.join(', '),
    cooldownSeconds: String(rule.cooldownSeconds),
    dailyLimit: String(rule.dailyLimit),
  };
}

function splitValues(value: string): string[] {
  return [...new Set(value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean))];
}

function toInput(form: RuleFormState): SaveAutoReplyRuleInput {
  return {
    name: form.name.trim(),
    keywords: splitValues(form.keywords),
    matchType: form.matchType,
    responseType: form.responseType,
    replyText: form.replyText.trim(),
    aiSystemPrompt: form.responseType === 'AI' ? form.aiSystemPrompt.trim() : null,
    mediaAssetId: form.responseType === 'MEDIA' ? form.mediaAssetId || null : null,
    priority: Number(form.priority),
    enabled: form.enabled,
    scheduleStart: form.scheduleEnabled ? form.scheduleStart : null,
    scheduleEnd: form.scheduleEnabled ? form.scheduleEnd : null,
    scheduleDays: form.scheduleEnabled ? form.scheduleDays : [],
    scheduleZone: 'Europe/Istanbul',
    allowedPhones: splitValues(form.allowedPhones),
    cooldownSeconds: Number(form.cooldownSeconds),
    dailyLimit: Number(form.dailyLimit),
  };
}

function formatDate(value: string | null): string {
  if (!value) return 'Henüz çalışmadı';
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function AutomationsPage() {
  const queryClient = useQueryClient();
  const accounts = useQuery({ queryKey: ['whatsapp', 'accounts'], queryFn: listAccounts });
  const [accountId, setAccountId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [form, setForm] = useState<RuleFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [previewMessage, setPreviewMessage] = useState('Deneme');
  const [previewPhone, setPreviewPhone] = useState('905516769163');

  useEffect(() => {
    if (!accountId && accounts.data?.length) setAccountId(accounts.data[0].id);
  }, [accountId, accounts.data]);

  const rules = useQuery({
    queryKey: ['auto-replies', accountId],
    queryFn: () => listAutoReplyRules(accountId),
    enabled: Boolean(accountId),
  });
  const activity = useQuery({
    queryKey: ['auto-replies', accountId, 'activity'],
    queryFn: () => getAutomationActivity(accountId),
    enabled: Boolean(accountId),
    refetchInterval: 10_000,
  });
  const mediaAssets = useQuery({
    queryKey: ['media-assets', accountId],
    queryFn: () => listMediaAssets(accountId),
    enabled: Boolean(accountId),
  });

  const refreshRules = () => queryClient.invalidateQueries({ queryKey: ['auto-replies', accountId] });
  const save = useMutation({
    mutationFn: (input: SaveAutoReplyRuleInput) => editingRule
      ? updateAutoReplyRule(accountId, editingRule.id, input)
      : createAutoReplyRule(accountId, input),
    onSuccess: async () => {
      setDialogOpen(false);
      setEditingRule(null);
      setForm(emptyForm);
      await refreshRules();
      await queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (error) => setFormError(apiErrorMessage(error)),
  });
  const toggle = useMutation({
    mutationFn: ({ rule, enabled }: { rule: AutoReplyRule; enabled: boolean }) =>
      updateAutoReplyRule(accountId, rule.id, { ...ruleToInput(rule), enabled }),
    onSuccess: refreshRules,
  });
  const remove = useMutation({
    mutationFn: (ruleId: string) => deleteAutoReplyRule(accountId, ruleId),
    onSuccess: async () => {
      await refreshRules();
      await queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
  const preview = useMutation({
    mutationFn: () => previewAutoReply(accountId, previewMessage.trim(), previewPhone.trim()),
  });

  const summary = useMemo(() => {
    const list = rules.data || [];
    return {
      active: list.filter((rule) => rule.enabled).length,
      totalRuns: list.reduce((sum, rule) => sum + rule.triggerCount, 0),
      scheduled: list.filter((rule) => rule.scheduleStart).length,
    };
  }, [rules.data]);
  const mediaById = useMemo(
    () => new Map((mediaAssets.data || []).map((asset) => [asset.id, asset])),
    [mediaAssets.data],
  );
  const previewAsset = preview.data?.rule?.mediaAssetId
    ? mediaById.get(preview.data.rule.mediaAssetId)
    : undefined;

  const openCreate = () => {
    setEditingRule(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    setForm(toForm(rule));
    setFormError(null);
    setDialogOpen(true);
  };

  const submit = () => {
    const input = toInput(form);
    if (!input.name || (input.matchType !== 'ALL' && input.keywords.length === 0)
      || (input.responseType !== 'MEDIA' && !input.replyText)) {
      setFormError('Kural adı, eşleşme koşulu ve cevap metni zorunludur.');
      return;
    }
    if (input.responseType === 'AI' && !input.aiSystemPrompt) {
      setFormError('AI kuralları için system prompt zorunludur.');
      return;
    }
    if (input.responseType === 'MEDIA' && !input.mediaAssetId) {
      setFormError('Medya cevapları için galeriden bir dosya seçmelisiniz.');
      return;
    }
    if (input.scheduleStart && input.scheduleDays.length === 0) {
      setFormError('Zamanlama açıksa en az bir gün seçmelisiniz.');
      return;
    }
    setFormError(null);
    save.mutate(input);
  };

  if (accounts.isPending) return <div className="h-80 animate-pulse rounded-2xl bg-muted" />;
  if (accounts.isError) return <Card><CardContent><h1 className="text-xl font-semibold">Otomasyonlar yüklenemedi</h1><p className="mt-2 text-sm text-error">{apiErrorMessage(accounts.error)}</p></CardContent></Card>;

  if (!accounts.data?.length) {
    return <Card className="mx-auto max-w-2xl border-dashed"><CardContent className="py-10 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-lightwarning text-warning"><Icon icon="solar:bolt-linear" width={28} /></div><h1 className="mt-5 text-xl font-semibold">Önce bir WhatsApp hesabı bağlayın</h1><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Otomasyon kuralları, mesajları karşılayacak WhatsApp hesabına bağlı çalışır.</p><Button asChild className="mt-6"><Link to="/whatsapp-accounts">WhatsApp hesaplarına git</Link></Button></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="relative px-5 py-6 sm:px-7">
          <div className="absolute inset-y-0 right-0 hidden w-72 bg-[radial-gradient(circle_at_center,rgba(93,135,255,0.13),transparent_68%)] lg:block" />
          <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
            <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20"><Icon icon="solar:bolt-bold" width={25} /></div><div><p className="text-sm font-medium text-primary">Mesaj akışları</p><h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Otomatik cevaplar</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Gelen mesajı eşleştir, doğru cevabı üret ve WhatsApp üzerinden otomatik gönder.</p></div></div>
            <div className="flex flex-col gap-3 sm:flex-row"><Select value={accountId} onValueChange={setAccountId}><SelectTrigger className="h-10 min-w-56 bg-background"><SelectValue placeholder="WhatsApp hesabı seç" /></SelectTrigger><SelectContent>{accounts.data.map((account) => <SelectItem key={account.id} value={account.id}>{account.displayName || account.externalPhoneNumberId}</SelectItem>)}</SelectContent></Select><Button onClick={openCreate}><Icon icon="solar:add-circle-linear" />Yeni kural</Button></div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Aktif kural', value: summary.active, icon: 'solar:check-circle-linear', tone: 'bg-lightsuccess text-success' },
          { label: 'Toplam çalışma', value: summary.totalRuns, icon: 'solar:history-linear', tone: 'bg-lightprimary text-primary' },
          { label: 'Zamanlanmış', value: summary.scheduled, icon: 'solar:clock-circle-linear', tone: 'bg-lightwarning text-warning' },
        ].map((item) => <Card key={item.label} className="gap-0 p-5 shadow-sm"><CardContent className="flex items-center gap-4"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}><Icon icon={item.icon} width={22} /></div><div><p className="text-2xl font-semibold">{numberFormatter.format(item.value)}</p><p className="text-sm text-muted-foreground">{item.label}</p></div></CardContent></Card>)}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-4">
          <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Kurallar</h2><p className="mt-1 text-sm text-muted-foreground">Düşük öncelik numarası önce çalışır; ilk eşleşmede cevap gönderilir.</p></div><Badge variant="gray">{rules.data?.length || 0} kural</Badge></div>
          {rules.isPending && <div className="space-y-3">{[1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-xl bg-muted" />)}</div>}
          {rules.isError && <Card><CardContent><p className="text-sm text-error">{apiErrorMessage(rules.error)}</p><Button variant="outline" className="mt-4" onClick={() => rules.refetch()}>Tekrar dene</Button></CardContent></Card>}
          {rules.data?.length === 0 && <Card className="border-dashed"><CardContent className="py-10 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-lightprimary text-primary"><Icon icon="solar:magic-stick-3-linear" width={24} /></div><h3 className="mt-4 font-semibold">İlk otomasyonunu oluştur</h3><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Bir anahtar kelime belirle; eşleşen mesajlara saniyeler içinde otomatik cevap ver.</p><Button className="mt-5" onClick={openCreate}>Kural oluştur</Button></CardContent></Card>}
          {rules.data?.map((rule) => {
            const responseMeta = responseTypeMeta[rule.responseType];
            const ruleAsset = rule.mediaAssetId ? mediaById.get(rule.mediaAssetId) : undefined;
            return <Card key={rule.id} className={`gap-0 overflow-hidden p-0 shadow-sm transition-colors ${rule.enabled ? 'border-border' : 'border-dashed opacity-75'}`}>
              <CardContent>
                <div className="flex flex-col gap-5 p-5 sm:p-6">
                  <div className="flex items-start gap-4"><div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${rule.enabled ? responseMeta.tone : 'bg-muted text-muted-foreground'}`}><Icon icon={responseMeta.icon} width={21} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{rule.name}</h3><Badge variant={rule.enabled ? 'lightSuccess' : 'gray'}>{rule.enabled ? 'Aktif' : 'Pasif'}</Badge><Badge variant={responseMeta.badge}>{responseMeta.label}</Badge><Badge variant="lightPrimary">Öncelik {rule.priority}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{matchLabels[rule.matchType]}</span>{rule.keywords.map((keyword) => <span key={keyword} className="rounded-full border border-border px-2.5 py-1 text-xs font-medium">“{keyword}”</span>)}</div></div><Switch aria-label={`${rule.name} durumunu değiştir`} checked={rule.enabled} disabled={toggle.isPending} onCheckedChange={(enabled) => toggle.mutate({ rule, enabled })} /></div>
                  <div className="rounded-xl border border-border/80 bg-muted/35 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{rule.responseType === 'AI' ? 'AI hata durumunda gönderilecek cevap' : rule.responseType === 'MEDIA' ? 'Gönderilecek medya' : 'Gönderilecek cevap'}</p>
                    {rule.responseType === 'MEDIA' && ruleAsset && <div className="mt-3 flex items-center gap-3"><MediaAssetPreview asset={ruleAsset} compact /><div className="min-w-0"><p className="truncate text-sm font-semibold">{ruleAsset.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{ruleAsset.originalFilename}</p></div></div>}
                    {rule.responseType === 'MEDIA' && !ruleAsset && <p className="mt-2 text-sm text-error">Galeri dosyası bulunamadı.</p>}
                    {rule.replyText && <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{rule.replyText}</p>}
                    {rule.responseType === 'AI' && <p className="mt-3 flex items-center gap-1.5 text-xs text-secondary"><Icon icon="solar:cpu-bolt-linear" />Konuşma geçmişi kullanılarak Groq ile dinamik cevap üretilir.</p>}
                  </div>
                  <div className="flex flex-col gap-4 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center"><span className="flex items-center gap-1.5"><Icon icon="solar:graph-up-linear" />{numberFormatter.format(rule.triggerCount)} kez çalıştı</span><span className="flex items-center gap-1.5"><Icon icon="solar:clock-circle-linear" />{rule.scheduleStart ? `${rule.scheduleStart.slice(0, 5)}–${rule.scheduleEnd?.slice(0, 5)}` : 'Her zaman aktif'}</span><span className="flex items-center gap-1.5"><Icon icon="solar:calendar-linear" />{formatDate(rule.lastTriggeredAt)}</span><div className="flex gap-2 sm:ml-auto"><Button size="sm" variant="ghostprimary" onClick={() => openEdit(rule)}><Icon icon="solar:pen-linear" />Düzenle</Button><Button size="sm" variant="ghosterror" disabled={remove.isPending} onClick={() => { if (window.confirm(`“${rule.name}” kuralı silinsin mi?`)) remove.mutate(rule.id); }}><Icon icon="solar:trash-bin-trash-linear" />Sil</Button></div></div>
                </div>
              </CardContent>
            </Card>
          })}
        </section>

        <aside className="space-y-4">
          <Card className="sticky top-5 gap-0 p-0 shadow-sm"><CardContent><div className="border-b border-border p-5"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lightsecondary text-secondary"><Icon icon="solar:test-tube-linear" width={21} /></div><div><h2 className="font-semibold">Canlı önizleme</h2><p className="text-xs text-muted-foreground">Mesaj göndermeden eşleşmeyi test et</p></div></div></div><div className="space-y-4 p-5"><div><Label htmlFor="preview-message">Müşteri mesajı</Label><Textarea id="preview-message" rows={3} value={previewMessage} onChange={(event) => setPreviewMessage(event.target.value)} placeholder="Örn. Fiyat listesi" /></div><div><Label htmlFor="preview-phone">Müşteri telefonu</Label><Input id="preview-phone" className="mt-2" value={previewPhone} onChange={(event) => setPreviewPhone(event.target.value)} placeholder="905551234567" /></div><Button className="w-full" variant="secondary" disabled={!previewMessage.trim() || !previewPhone.trim() || preview.isPending} onClick={() => preview.mutate()}>{preview.isPending ? 'Test ediliyor…' : 'Kuralları test et'}</Button>{preview.isError && <div className="rounded-lg bg-lighterror p-3 text-sm text-error">{apiErrorMessage(preview.error)}</div>}{preview.data && <div className={`rounded-xl border p-4 ${preview.data.matched ? 'border-success/30 bg-lightsuccess' : 'border-warning/30 bg-lightwarning'}`}><div className="flex items-center gap-2 text-sm font-semibold"><Icon icon={preview.data.matched ? 'solar:check-circle-bold' : 'solar:danger-triangle-bold'} />{preview.data.matched ? preview.data.rule?.name : 'Eşleşen kural yok'}</div>{preview.data.rule?.responseType === 'AI' && <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-secondary"><Icon icon="solar:magic-stick-3-linear" />Groq tarafından üretildi</p>}{preview.data.rule?.responseType === 'MEDIA' && previewAsset && <div className="mt-3"><MediaAssetPreview asset={previewAsset} /><p className="mt-2 truncate text-xs font-medium">{previewAsset.name}</p></div>}{preview.data.renderedReply && <p className="mt-2 whitespace-pre-wrap text-sm leading-6">{preview.data.renderedReply}</p>}</div>}</div></CardContent></Card>
        </aside>
      </div>

      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div><h2 className="text-lg font-semibold">Çalışma geçmişi</h2><p className="mt-1 text-sm text-muted-foreground">Otomatik cevapların üretim ve WhatsApp kuyruğu durumlarını canlı izleyin.</p></div>
          <Button variant="outline" size="sm" disabled={activity.isFetching} onClick={() => activity.refetch()}><Icon icon="solar:refresh-linear" className={activity.isFetching ? 'animate-spin' : ''} />Yenile</Button>
        </div>

        {activity.data && <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'AI sırasında', value: activity.data.queue.queued, tone: 'text-warning' },
            { label: 'İşleniyor', value: activity.data.queue.processing, tone: 'text-info' },
            { label: 'Tekrar deneme', value: activity.data.queue.retrying, tone: 'text-warning' },
            { label: 'AI tamamlanan', value: activity.data.queue.completed, tone: 'text-success' },
            { label: 'AI başarısız', value: activity.data.queue.dead, tone: 'text-error' },
          ].map((item) => <Card key={item.label} className="gap-0 p-4 shadow-sm"><CardContent><p className={`text-2xl font-semibold ${item.tone}`}>{numberFormatter.format(item.value)}</p><p className="mt-1 text-xs text-muted-foreground">{item.label}</p></CardContent></Card>)}
        </div>}

        {activity.isPending && <div className="h-44 animate-pulse rounded-2xl bg-muted" />}
        {activity.isError && <Card><CardContent className="flex items-center justify-between gap-4"><p className="text-sm text-error">{apiErrorMessage(activity.error)}</p><Button variant="outline" size="sm" onClick={() => activity.refetch()}>Tekrar dene</Button></CardContent></Card>}
        {activity.data?.items.length === 0 && <Card className="border-dashed"><CardContent className="py-8 text-center"><Icon icon="solar:history-linear" width={26} className="mx-auto text-muted-foreground" /><p className="mt-3 text-sm font-medium">Henüz çalışan otomasyon yok</p><p className="mt-1 text-xs text-muted-foreground">Bir kural eşleştiğinde ayrıntıları burada göreceksiniz.</p></CardContent></Card>}
        {Boolean(activity.data?.items.length) && <Card className="gap-0 overflow-hidden p-0 shadow-sm"><CardContent className="divide-y divide-border">
          {activity.data?.items.map((item) => {
            const state = activityStateMeta[item.state];
            return <div key={item.id} className="p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{item.ruleName}</h3><span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${state.className}`}><Icon icon={state.icon} />{state.label}</span><Badge variant={responseTypeMeta[item.responseType].badge}>{responseTypeMeta[item.responseType].label}</Badge></div><p className="mt-1.5 text-xs text-muted-foreground">{item.customerWaId} · {formatDate(item.occurredAt)}{item.attempts > 0 ? ` · ${item.attempts} deneme` : ''}</p></div>
                {item.outboundStatus && <Badge variant={item.outboundStatus === 'FAILED' ? 'lightError' : item.outboundStatus === 'READ' || item.outboundStatus === 'DELIVERED' ? 'lightSuccess' : 'gray'}>WhatsApp: {item.outboundStatus}</Badge>}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2"><div className="rounded-xl bg-muted/50 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Gelen mesaj</p><p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-sm">{item.inboundText || 'Metin içermiyor'}</p></div><div className="rounded-xl bg-muted/50 p-3"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Otomatik cevap</p><p className="mt-1.5 line-clamp-3 whitespace-pre-wrap text-sm">{item.outboundText || (item.state === 'DEAD' ? 'Cevap üretilemedi' : item.state === 'CANCELLED' ? 'İnsan devraldığı için gönderilmedi' : 'Henüz oluşturuluyor…')}</p></div></div>
              {item.lastError && item.state !== 'CANCELLED' && <div className="mt-3 rounded-lg bg-lighterror px-3 py-2 text-xs text-error"><span className="font-semibold">Son hata:</span> {item.lastError}</div>}
            </div>;
          })}
        </CardContent></Card>}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto p-0">
          <DialogHeader className="border-b border-border px-6 py-5"><DialogTitle>{editingRule ? 'Kuralı düzenle' : 'Yeni otomatik cevap'}</DialogTitle><DialogDescription className="font-normal text-muted-foreground">Mesajın ne zaman eşleşeceğini ve gönderilecek cevabı belirleyin.</DialogDescription></DialogHeader>
          <div className="grid gap-6 px-6 py-2 md:grid-cols-2">
            <div className="md:col-span-2"><Label htmlFor="rule-name">Kural adı</Label><Input id="rule-name" className="mt-2" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Karşılama mesajı" /></div>
            <div className="md:col-span-2"><Label>Cevap türü</Label><div className="mt-2 grid gap-3 sm:grid-cols-3"><button type="button" onClick={() => setForm({ ...form, responseType: 'STATIC_TEXT' })} className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${form.responseType === 'STATIC_TEXT' ? 'border-primary bg-lightprimary' : 'border-border hover:border-primary/50'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${form.responseType === 'STATIC_TEXT' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}><Icon icon="solar:chat-round-line-linear" width={19} /></span><span><span className="block text-sm font-semibold">Sabit cevap</span><span className="mt-1 block text-xs text-muted-foreground">Hazır metni gönderir.</span></span></button><button type="button" onClick={() => setForm({ ...form, responseType: 'AI', matchType: form.matchType, priority: form.priority === '100' ? '9000' : form.priority })} className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${form.responseType === 'AI' ? 'border-secondary bg-lightsecondary' : 'border-border hover:border-secondary/50'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${form.responseType === 'AI' ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground'}`}><Icon icon="solar:magic-stick-3-linear" width={19} /></span><span><span className="block text-sm font-semibold">Groq AI</span><span className="mt-1 block text-xs text-muted-foreground">Dinamik cevap üretir.</span></span></button><button type="button" onClick={() => setForm({ ...form, responseType: 'MEDIA' })} className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${form.responseType === 'MEDIA' ? 'border-warning bg-lightwarning' : 'border-border hover:border-warning/50'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${form.responseType === 'MEDIA' ? 'bg-warning text-white' : 'bg-muted text-muted-foreground'}`}><Icon icon="solar:gallery-wide-linear" width={19} /></span><span><span className="block text-sm font-semibold">Galeri medyası</span><span className="mt-1 block text-xs text-muted-foreground">Görsel veya PDF gönderir.</span></span></button></div></div>
            <div><Label>Eşleşme şekli</Label><Select value={form.matchType} onValueChange={(value: MatchType) => setForm({ ...form, matchType: value })}><SelectTrigger className="mt-2 w-full"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(matchLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
            <div><Label htmlFor="rule-priority">Öncelik</Label><Input id="rule-priority" type="number" min={1} max={9999} className="mt-2" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })} /><p className="mt-1.5 text-xs text-muted-foreground">Küçük sayı önce değerlendirilir.</p></div>
            {form.matchType !== 'ALL' && <div className="md:col-span-2"><Label htmlFor="rule-keywords">Anahtar kelimeler</Label><Input id="rule-keywords" className="mt-2" value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} placeholder="merhaba, selam, iyi günler" /><p className="mt-1.5 text-xs text-muted-foreground">Birden fazla değeri virgülle ayırın.</p></div>}
            {form.responseType === 'AI' && <div className="md:col-span-2"><div className="flex items-center justify-between"><Label htmlFor="ai-system-prompt">AI system prompt</Label><span className="text-xs text-muted-foreground">{form.aiSystemPrompt.length}/8000</span></div><Textarea id="ai-system-prompt" className="min-h-36" maxLength={8000} value={form.aiSystemPrompt} onChange={(event) => setForm({ ...form, aiSystemPrompt: event.target.value })} /><p className="mt-1.5 text-xs text-muted-foreground">Asistanın rolünü, üslubunu ve cevap sınırlarını belirler. API anahtarını buraya yazmayın.</p></div>}
            {form.responseType === 'MEDIA' && <div className="md:col-span-2"><div className="flex items-center justify-between gap-3"><div><Label>Galeriden dosya seç</Label><p className="mt-1 text-xs text-muted-foreground">Aynı dosyayı farklı otomasyonlarda tekrar kullanabilirsiniz.</p></div><Button asChild size="sm" variant="outline"><Link to="/media-library"><Icon icon="solar:gallery-add-linear" />Galeriyi yönet</Link></Button></div>{mediaAssets.isPending && <div className="mt-3 h-24 animate-pulse rounded-xl bg-muted" />}{mediaAssets.data?.length === 0 && <div className="mt-3 rounded-xl border border-dashed border-warning/40 bg-lightwarning p-4 text-sm text-warning">Galeride dosya yok. Önce medya galerisine bir görsel veya PDF yükleyin.</div>}<div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{mediaAssets.data?.map((asset) => { const selected = form.mediaAssetId === asset.id; return <button key={asset.id} type="button" onClick={() => setForm({ ...form, mediaAssetId: asset.id })} className={`overflow-hidden rounded-xl border p-2 text-left transition-all ${selected ? 'border-warning bg-lightwarning ring-2 ring-warning/20' : 'border-border hover:border-warning/50'}`}><MediaAssetPreview asset={asset} /><span className="mt-2 block truncate px-1 text-xs font-semibold">{asset.name}</span><span className="block truncate px-1 pb-1 text-[11px] text-muted-foreground">{asset.originalFilename}</span></button>; })}</div></div>}
            <div className="md:col-span-2"><div className="flex items-center justify-between"><Label htmlFor="rule-reply">{form.responseType === 'AI' ? 'AI çalışmazsa gönderilecek cevap' : form.responseType === 'MEDIA' ? 'Medya açıklaması (isteğe bağlı)' : 'Cevap metni'}</Label><span className="text-xs text-muted-foreground">{form.replyText.length}/{form.responseType === 'MEDIA' ? 1024 : 4096}</span></div><Textarea id="rule-reply" className="min-h-28" maxLength={form.responseType === 'MEDIA' ? 1024 : 4096} value={form.replyText} onChange={(event) => setForm({ ...form, replyText: event.target.value })} placeholder={form.responseType === 'AI' ? 'Şu anda otomatik yanıt oluşturamıyorum. Ekibimiz kısa süre içinde yardımcı olacak.' : form.responseType === 'MEDIA' ? 'Güncel fiyat listemiz ektedir.' : 'Merhaba, size nasıl yardımcı olabiliriz?'} />{form.responseType !== 'AI' && <div className="mt-2 flex flex-wrap gap-1.5">{['{telefon}', '{mesaj}', '{tarih}', '{saat}', '{gun}'].map((token) => <button key={token} type="button" className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground hover:text-primary" onClick={() => setForm({ ...form, replyText: `${form.replyText}${form.replyText ? ' ' : ''}${token}` })}>{token}</button>)}</div>}</div>
            <div><Label htmlFor="rule-cooldown">Bekleme süresi (saniye)</Label><Input id="rule-cooldown" type="number" min={0} max={86400} className="mt-2" value={form.cooldownSeconds} onChange={(event) => setForm({ ...form, cooldownSeconds: event.target.value })} /></div>
            <div><Label htmlFor="rule-limit">Kişi başına günlük limit</Label><Input id="rule-limit" type="number" min={1} max={10000} className="mt-2" value={form.dailyLimit} onChange={(event) => setForm({ ...form, dailyLimit: event.target.value })} /></div>
            <div className="md:col-span-2"><Label htmlFor="rule-phones">Yalnızca bu telefonlar <span className="font-normal text-muted-foreground">(isteğe bağlı)</span></Label><Input id="rule-phones" className="mt-2" value={form.allowedPhones} onChange={(event) => setForm({ ...form, allowedPhones: event.target.value })} placeholder="905551234567, 905559876543" /></div>
            <div className="md:col-span-2 rounded-xl border border-border p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-medium">Çalışma saatleri</p><p className="mt-1 text-xs text-muted-foreground">Kapalıysa kural günün her saati çalışır.</p></div><Switch checked={form.scheduleEnabled} onCheckedChange={(scheduleEnabled) => setForm({ ...form, scheduleEnabled })} /></div>{form.scheduleEnabled && <div className="mt-5 space-y-4"><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="schedule-start">Başlangıç</Label><Input id="schedule-start" type="time" className="mt-2" value={form.scheduleStart} onChange={(event) => setForm({ ...form, scheduleStart: event.target.value })} /></div><div><Label htmlFor="schedule-end">Bitiş</Label><Input id="schedule-end" type="time" className="mt-2" value={form.scheduleEnd} onChange={(event) => setForm({ ...form, scheduleEnd: event.target.value })} /></div></div><div className="flex flex-wrap gap-2">{dayOptions.map((day) => { const selected = form.scheduleDays.includes(day.value); return <label key={day.value} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${selected ? 'border-primary bg-lightprimary text-primary' : 'border-border'}`}><Checkbox checked={selected} onCheckedChange={(checked) => setForm({ ...form, scheduleDays: checked ? [...form.scheduleDays, day.value] : form.scheduleDays.filter((value) => value !== day.value) })} />{day.short}</label>; })}</div></div>}</div>
            <div className="flex items-center justify-between rounded-xl border border-border p-4 md:col-span-2"><div><p className="text-sm font-medium">Kural aktif</p><p className="mt-1 text-xs text-muted-foreground">Kaydedildiği anda gelen mesajları değerlendirmeye başlar.</p></div><Switch checked={form.enabled} onCheckedChange={(enabled) => setForm({ ...form, enabled })} /></div>
            {formError && <div className="rounded-lg bg-lighterror p-3 text-sm text-error md:col-span-2">{formError}</div>}
          </div>
          <DialogFooter className="border-t border-border px-6 py-4"><Button variant="ghost" onClick={() => setDialogOpen(false)}>İptal</Button><Button disabled={save.isPending} onClick={submit}>{save.isPending ? 'Kaydediliyor…' : editingRule ? 'Değişiklikleri kaydet' : 'Kuralı oluştur'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
