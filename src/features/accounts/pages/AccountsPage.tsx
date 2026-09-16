import { Icon } from '@iconify/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from 'src/components/ui/button';
import { Card, CardContent } from 'src/components/ui/card';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { apiErrorMessage } from 'src/shared/api/error-message';
import { connectAccount, disconnectAccount, listAccounts } from '../api/accounts-api';

const schema = z.object({
  displayName: z.string().max(200).optional(),
  phoneNumberId: z.string().min(1, 'Telefon numarası ID zorunludur.').max(100),
  businessAccountId: z.string().min(1, 'Business Account ID zorunludur.').max(100),
  accessToken: z.string().min(1, 'Access token zorunludur.'),
  webhookVerifyToken: z.string().min(20, 'Webhook doğrulama tokenı en az 20 karakter olmalıdır.').max(200),
});
type FormValues = z.infer<typeof schema>;

export default function AccountsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const accounts = useQuery({ queryKey: ['whatsapp', 'accounts'], queryFn: listAccounts });
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
  const connect = useMutation({
    mutationFn: connectAccount,
    onSuccess: async () => {
      form.reset();
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ['whatsapp', 'accounts'] });
      await queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
    onError: (error) => setSubmitError(apiErrorMessage(error)),
  });
  const disconnect = useMutation({
    mutationFn: disconnectAccount,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whatsapp', 'accounts'] }),
  });

  const onSubmit = form.handleSubmit((values) => {
    setSubmitError(null);
    connect.mutate({ provider: 'META_CLOUD', ...values });
  });

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div><p className="text-sm font-medium text-primary">Entegrasyonlar</p><h1 className="mt-1 text-2xl font-semibold md:text-3xl">WhatsApp hesapları</h1><p className="mt-2 text-sm text-muted-foreground">Meta Cloud API hesaplarınızı güvenli biçimde bağlayın ve yönetin.</p></div>
        <Button onClick={() => setShowForm((value) => !value)}><Icon icon={showForm ? 'solar:close-circle-linear' : 'solar:add-circle-linear'} />{showForm ? 'Formu kapat' : 'Hesap bağla'}</Button>
      </div>

      {showForm && (
        <Card><CardContent><form onSubmit={onSubmit} className="grid gap-5 md:grid-cols-2" noValidate>
          <div><Label htmlFor="displayName">Görünen ad</Label><Input id="displayName" className="mt-2" placeholder="Destek hattı" {...form.register('displayName')} /></div>
          <div><Label htmlFor="phoneNumberId">Telefon numarası ID</Label><Input id="phoneNumberId" className="mt-2" {...form.register('phoneNumberId')} />{form.formState.errors.phoneNumberId && <p className="mt-1 text-xs text-error">{form.formState.errors.phoneNumberId.message}</p>}</div>
          <div><Label htmlFor="businessAccountId">Business Account ID</Label><Input id="businessAccountId" className="mt-2" {...form.register('businessAccountId')} />{form.formState.errors.businessAccountId && <p className="mt-1 text-xs text-error">{form.formState.errors.businessAccountId.message}</p>}</div>
          <div><Label htmlFor="webhookVerifyToken">Webhook doğrulama tokenı</Label><Input id="webhookVerifyToken" className="mt-2" autoComplete="off" {...form.register('webhookVerifyToken')} />{form.formState.errors.webhookVerifyToken && <p className="mt-1 text-xs text-error">{form.formState.errors.webhookVerifyToken.message}</p>}</div>
          <div className="md:col-span-2"><Label htmlFor="accessToken">Meta access token</Label><Input id="accessToken" type="password" className="mt-2" autoComplete="off" {...form.register('accessToken')} />{form.formState.errors.accessToken && <p className="mt-1 text-xs text-error">{form.formState.errors.accessToken.message}</p>}<p className="mt-2 text-xs text-muted-foreground">Token tarayıcıda saklanmaz; doğrudan backend’e güvenli oturum üzerinden gönderilir.</p></div>
          {submitError && <div className="rounded-md bg-lighterror p-3 text-sm text-error md:col-span-2">{submitError}</div>}
          <div className="flex justify-end md:col-span-2"><Button disabled={connect.isPending}>{connect.isPending ? 'Doğrulanıyor…' : 'Hesabı doğrula ve bağla'}</Button></div>
        </form></CardContent></Card>
      )}

      {accounts.isPending && <div className="h-36 animate-pulse rounded-xl bg-muted" />}
      {accounts.isError && <Card><CardContent><p className="text-sm text-error">{apiErrorMessage(accounts.error)}</p><Button className="mt-4" variant="outline" onClick={() => accounts.refetch()}>Tekrar dene</Button></CardContent></Card>}
      {accounts.data?.length === 0 && <Card className="border-dashed"><CardContent className="py-8 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lightprimary text-primary"><Icon icon="solar:smartphone-linear" width={28} /></div><h2 className="mt-4 text-lg font-semibold">Henüz hesap bağlı değil</h2><p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Mesaj almaya ve göndermeye başlamak için ilk Meta Cloud API hesabınızı bağlayın.</p></CardContent></Card>}
      <div className="grid gap-5 lg:grid-cols-2">
        {accounts.data?.map((account) => <Card key={account.id}><CardContent><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lightsuccess text-success"><Icon icon="logos:whatsapp-icon" width={24} /></div><div><h2 className="font-semibold">{account.displayName || 'WhatsApp hesabı'}</h2><p className="mt-1 text-xs text-muted-foreground">{account.externalPhoneNumberId}</p></div></div><span className={`rounded-full px-3 py-1 text-xs font-medium ${account.status === 'ACTIVE' ? 'bg-lightsuccess text-success' : 'bg-lighterror text-error'}`}>{account.status === 'ACTIVE' ? 'Aktif' : 'Kontrol gerekli'}</span></div><div className="mt-5 border-t border-border pt-4 text-sm"><p className="text-muted-foreground">Business Account ID</p><p className="mt-1 font-mono text-xs">{account.externalBusinessAccountId}</p></div><Button variant="outlineerror" className="mt-5" disabled={disconnect.isPending} onClick={() => { if (window.confirm('Bu WhatsApp hesabının bağlantısı kaldırılsın mı?')) disconnect.mutate(account.id); }}>Bağlantıyı kaldır</Button></CardContent></Card>)}
      </div>
    </div>
  );
}
