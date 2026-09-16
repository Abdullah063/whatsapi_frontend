import { Icon } from '@iconify/react';
import { useRef, useState } from 'react';
import { Button } from 'src/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from 'src/components/ui/dialog';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import { Textarea } from 'src/components/ui/textarea';
import type { MediaAsset } from 'src/features/media/api/media-assets-api';

interface MediaAttachmentDialogProps {
  assets: MediaAsset[];
  loading: boolean;
  sending: boolean;
  error?: string | null;
  onSendAsset: (asset: MediaAsset, caption: string) => Promise<boolean>;
  onUploadAndSend: (file: File, name: string, caption: string) => Promise<boolean>;
}

function formatSize(value: number): string {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} MB`;
}

export default function MediaAttachmentDialog({
  assets,
  loading,
  sending,
  error,
  onSendAsset,
  onUploadAndSend,
}: MediaAttachmentDialogProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('gallery');
  const [selectedId, setSelectedId] = useState<string>();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [caption, setCaption] = useState('');
  const [validationError, setValidationError] = useState<string>();

  const selected = assets.find((asset) => asset.id === selectedId);

  function reset() {
    setSelectedId(undefined);
    setFile(null);
    setName('');
    setCaption('');
    setValidationError(undefined);
    if (fileInput.current) fileInput.current.value = '';
  }

  async function submit() {
    setValidationError(undefined);
    let sent = false;
    if (tab === 'gallery') {
      if (!selected) {
        setValidationError('Göndermek için galeriden bir dosya seçin.');
        return;
      }
      sent = await onSendAsset(selected, caption.trim());
    } else {
      if (!file) {
        setValidationError('Göndermek için bir görsel veya PDF seçin.');
        return;
      }
      sent = await onUploadAndSend(file, name.trim(), caption.trim());
    }
    if (sent) {
      setOpen(false);
      reset();
    }
  }

  return <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) reset(); }}>
    <DialogTrigger asChild><Button type="button" size="icon" variant="outline" className="h-11 w-11 shrink-0" aria-label="Görsel veya belge ekle"><Icon icon="solar:paperclip-2-linear" width={20} /></Button></DialogTrigger>
    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
      <DialogHeader><DialogTitle>Görsel veya belge gönder</DialogTitle><DialogDescription className="font-normal text-muted-foreground">Galerideki bir dosyayı kullanın veya yeni dosyayı yükleyip doğrudan gönderin.</DialogDescription></DialogHeader>
      <Tabs value={tab} onValueChange={(value) => { setTab(value); setValidationError(undefined); }}>
        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="gallery">Galeriden seç</TabsTrigger><TabsTrigger value="upload">Yeni yükle</TabsTrigger></TabsList>
        <TabsContent value="gallery" className="mt-4">
          {loading ? <div className="flex h-36 items-center justify-center"><Icon icon="svg-spinners:ring-resize" className="text-primary" width={26} /></div> : null}
          {!loading && assets.length === 0 ? <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center"><Icon icon="solar:gallery-add-linear" className="mx-auto text-muted-foreground" width={28} /><p className="mt-3 text-sm font-medium">Galeride dosya yok</p><p className="mt-1 text-xs text-muted-foreground">Yeni yükle sekmesinden ilk dosyanızı ekleyebilirsiniz.</p></div> : null}
          <div className="grid max-h-72 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3">{assets.map((asset) => <button key={asset.id} type="button" onClick={() => setSelectedId(asset.id)} className={`overflow-hidden rounded-xl border text-left transition ${selectedId === asset.id ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}>
            {asset.mediaType === 'IMAGE' ? <img src={asset.publicUrl} alt={asset.name} className="h-24 w-full bg-muted object-cover" /> : <div className="flex h-24 items-center justify-center bg-lighterror text-error"><Icon icon="solar:file-text-bold" width={34} /></div>}
            <div className="p-2"><p className="truncate text-xs font-semibold">{asset.name}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{formatSize(asset.sizeBytes)}</p></div>
          </button>)}</div>
        </TabsContent>
        <TabsContent value="upload" className="mt-4 space-y-4">
          <div><Label htmlFor="message-media-file">Dosya</Label><Input ref={fileInput} id="message-media-file" type="file" className="mt-2" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} /><p className="mt-1 text-xs text-muted-foreground">PNG, JPEG, WebP veya PDF · En fazla 10 MB</p></div>
          <div><Label htmlFor="message-media-name">Galeri adı (isteğe bağlı)</Label><Input id="message-media-name" className="mt-2" value={name} maxLength={120} onChange={(event) => setName(event.target.value)} placeholder="Eylül fiyat listesi" /></div>
        </TabsContent>
      </Tabs>
      <div><Label htmlFor="message-media-caption">Açıklama (isteğe bağlı)</Label><Textarea id="message-media-caption" className="mt-2" value={caption} maxLength={1024} onChange={(event) => setCaption(event.target.value)} placeholder="Dosyayla birlikte gönderilecek mesaj" /></div>
      {validationError || error ? <p className="rounded-md bg-lighterror px-3 py-2 text-xs text-error">{validationError || error}</p> : null}
      <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Vazgeç</Button><Button type="button" disabled={sending || (tab === 'gallery' ? !selected : !file)} onClick={submit}><Icon icon={sending ? 'svg-spinners:ring-resize' : 'solar:plain-2-bold'} />{sending ? 'Gönderiliyor…' : 'Gönder'}</Button></div>
    </DialogContent>
  </Dialog>;
}
