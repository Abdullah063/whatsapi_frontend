import { type FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { resendVerification, verifyEmail } from 'src/features/auth/api/auth-api';
import FullLogo from 'src/layouts/full/shared/logo/FullLogo';
import { apiErrorMessage } from 'src/shared/api/error-message';

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const userId = params.get('userId') || '';
  const email = params.get('email') || '';
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!userId) {
      setError('Doğrulama bağlantısında kullanıcı bilgisi bulunamadı.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await verifyEmail(userId, code);
      setMessage('E-posta doğrulandı. Yönetici onayından sonra giriş yapabilirsiniz.');
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setError(null);
    try {
      await resendVerification(userId);
      setMessage('Yeni doğrulama kodu gönderildi.');
    } catch (requestError) {
      setError(apiErrorMessage(requestError));
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-lightprimary px-4 dark:bg-dark">
      <CardBox className="w-full border-none md:w-[450px]">
        <div className="mx-auto mb-6"><FullLogo /></div>
        <h1 className="text-center text-2xl font-semibold">E-posta doğrulama</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {email ? `${email} adresine` : 'E-posta adresinize'} gönderilen 6 haneli kodu girin.
        </p>
        {message && <div className="mt-5 rounded-md bg-lightsuccess p-3 text-sm text-success">{message}</div>}
        {error && <div className="mt-5 rounded-md bg-lighterror p-3 text-sm text-error">{error}</div>}
        {!message?.startsWith('E-posta doğrulandı') && (
          <form onSubmit={submit} className="mt-6">
            <Label htmlFor="code">Doğrulama kodu</Label>
            <Input
              id="code"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              className="mt-2 text-center tracking-[0.5em]"
            />
            <Button className="mt-5 w-full" type="submit" disabled={submitting || code.length !== 6}>
              {submitting ? 'Doğrulanıyor…' : 'E-postayı doğrula'}
            </Button>
          </form>
        )}
        <div className="mt-5 flex justify-between gap-3">
          <Button type="button" variant="outline" onClick={resend} disabled={!userId}>Kodu tekrar gönder</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/auth/login')}>Giriş ekranı</Button>
        </div>
      </CardBox>
    </div>
  );
}
