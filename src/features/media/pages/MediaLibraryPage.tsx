import { Icon } from '@iconify/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'src/components/ui/button';
import { Card, CardContent } from 'src/components/ui/card';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select';
import { listAccounts } from 'src/features/accounts/api/accounts-api';
import { apiErrorMessage } from 'src/shared/api/error-message';
import { deleteMediaAsset, listMediaAssets, uploadMediaAsset } from '../api/media-assets-api';

const bytes = new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 });

function formatSize(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${bytes.format(value / 1024)} KB`;
  return `${bytes.format(value / 1024 / 1024)} MB`;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function MediaLibraryPage() {
  const queryClient = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const accounts = useQuery({ queryKey: ['whatsapp', 'accounts'], queryFn: listAccounts });
  const [accountId, setAccountId] = useState('');
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId && accounts.data?.length) setAccountId(accounts.data[0].id);
  }, [accountId, accounts.data]);

  const assets = useQuery({
    queryKey: ['media-assets', accountId],
    queryFn: () => listMediaAssets(accountId),
    enabled: Boolean(accountId),
  });
  const upload = useMutation({
    mutationFn: () => uploadMediaAsset(accountId, file!, name),
    onSuccess: async () => {
      setFile(null);
      setName('');
      setFormError(null);
      if (fileInput.current) fileInput.current.value = '';
      await queryClient.invalidateQueries({ queryKey: ['media-assets', accountId] });
    },
    onError: (error) => setFormError(apiErrorMessage(error)),
  });
  const remove = useMutation({
    mutationFn: (assetId: string) => deleteMediaAsset(accountId, assetId),
    onSuccess: () => {
      setFormError(null);
      return queryClient.invalidateQueries({ queryKey: ['media-assets', accountId] });
    },
    onError: (error) => setFormError(apiErrorMessage(error)),
  });

  const summary = useMemo(() => {
    const list = assets.data || [];
    return {
      total: list.length,
      images: list.filter((asset) => asset.mediaType === 'IMAGE').length,
      documents: list.filter((asset) => asset.mediaType === 'DOCUMENT').length,
      size: list.reduce((sum, asset) => sum + asset.sizeBytes, 0),
    };
  }, [assets.data]);

  const submit = () => {
    if (!file) {
      setFormError('Yüklenecek dosyayı seçin.');
      return;
    }
    setFormError(null);
    upload.mutate();
  };

  if (accounts.isPending) return <div className="h-80 animate-pulse rounded-2xl bg-muted" />;
  if (accounts.isError) return <Card><CardContent><p className="text-sm text-error">{apiErrorMessage(accounts.error)}</p></CardContent></Card>;

  return <div className="space-y-6">
    <section className="flex flex-col justify-between gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm lg:flex-row lg:items-center">
      <div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary text-white shadow-lg shadow-secondary/20"><Icon icon="solar:gallery-wide-linear" width={25} /></div><div><p className="text-sm font-medium text-secondary">İçerik arşivi</p><h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Medya galerisi</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Görsel ve PDF dosyalarını bir kez yükleyip otomatik cevaplarda tekrar kullanın.</p></div></div>
      {accounts.data?.length ? <Select value={accountId} onValueChange={setAccountId}><SelectTrigger className="h-10 min-w-56 bg-background"><SelectValue /></SelectTrigger><SelectContent>{accounts.data.map((account) => <SelectItem key={account.id} value={account.id}>{account.displayName || account.externalPhoneNumberId}</SelectItem>)}</SelectContent></Select> : null}
    </section>

    {!accounts.data?.length ? <Card className="border-dashed"><CardContent className="py-10 text-center"><Icon icon="solar:smartphone-linear" width={28} className="mx-auto text-muted-foreground" /><h2 className="mt-4 font-semibold">Önce WhatsApp hesabı bağlayın</h2></CardContent></Card> : <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Toplam dosya', value: String(summary.total), icon: 'solar:folder-with-files-linear', tone: 'bg-lightprimary text-primary' },
          { label: 'Görsel', value: String(summary.images), icon: 'solar:gallery-linear', tone: 'bg-lightsecondary text-secondary' },
          { label: 'PDF', value: String(summary.documents), icon: 'solar:file-text-linear', tone: 'bg-lightwarning text-warning' },
          { label: 'Kullanılan alan', value: formatSize(summary.size), icon: 'solar:database-linear', tone: 'bg-lightsuccess text-success' },
        ].map((item) => <Card key={item.label} className="gap-0 p-5 shadow-sm"><CardContent className="flex items-center gap-4"><div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}><Icon icon={item.icon} width={22} /></div><div><p className="text-xl font-semibold">{item.value}</p><p className="text-sm text-muted-foreground">{item.label}</p></div></CardContent></Card>)}
      </section>

      <Card className="gap-0 shadow-sm"><CardContent className="grid gap-5 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end"><div><Label htmlFor="media-name">Galeride görünen ad</Label><Input id="media-name" className="mt-2" value={name} onChange={(event) => setName(event.target.value)} placeholder="Eylül fiyat listesi" /></div><div><Label htmlFor="media-file">Dosya</Label><Input ref={fileInput} id="media-file" type="file" className="mt-2" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} /></div><Button disabled={!file || upload.isPending} onClick={submit}><Icon icon="solar:upload-linear" />{upload.isPending ? 'Yükleniyor…' : 'Galeriye yükle'}</Button>{formError && <div className="rounded-lg bg-lighterror p-3 text-sm text-error md:col-span-3">{formError}</div>}<p className="text-xs text-muted-foreground md:col-span-3">PNG, JPEG, WebP veya PDF · En fazla 10 MB</p></CardContent></Card>

      {assets.isPending && <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-64 animate-pulse rounded-2xl bg-muted" />)}</div>}
      {assets.isError && <Card><CardContent><p className="text-sm text-error">{apiErrorMessage(assets.error)}</p></CardContent></Card>}
      {assets.data?.length === 0 && <Card className="border-dashed"><CardContent className="py-10 text-center"><Icon icon="solar:gallery-add-linear" width={30} className="mx-auto text-muted-foreground" /><h2 className="mt-4 font-semibold">Galeri boş</h2><p className="mt-1 text-sm text-muted-foreground">İlk fiyat listesi veya kataloğunuzu yukarıdan yükleyin.</p></CardContent></Card>}
      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {assets.data?.map((asset) => <Card key={asset.id} className="gap-0 overflow-hidden p-0 shadow-sm"><CardContent>{asset.mediaType === 'IMAGE' ? <div className="flex h-52 items-center justify-center bg-muted/50"><img src={asset.publicUrl} alt={asset.name} className="h-full w-full object-contain" /></div> : <div className="flex h-52 flex-col items-center justify-center bg-lighterror text-error"><Icon icon="solar:file-text-bold" width={48} /><span className="mt-2 text-sm font-semibold">PDF belge</span></div>}<div className="p-5"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-semibold">{asset.name}</h2><p className="mt-1 truncate text-xs text-muted-foreground">{asset.originalFilename}</p></div><Button size="icon" variant="ghosterror" disabled={remove.isPending} aria-label="Medyayı sil" onClick={() => { if (window.confirm(`“${asset.name}” galeriden silinsin mi?`)) remove.mutate(asset.id); }}><Icon icon="solar:trash-bin-trash-linear" /></Button></div><div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground"><span>{formatSize(asset.sizeBytes)}</span><span>{formatDate(asset.createdAt)}</span></div></div></CardContent></Card>)}
      </section>
    </>}
  </div>;
}
