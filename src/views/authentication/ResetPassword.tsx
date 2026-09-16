import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router';
import { z } from 'zod';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { resetPassword } from 'src/features/auth/api/auth-api';
import FullLogo from 'src/layouts/full/shared/logo/FullLogo';
import { apiErrorMessage } from 'src/shared/api/error-message';

const schema = z.object({
  email: z.string().trim().email('Geçerli bir e-posta adresi girin.'),
  code: z.string().regex(/^\d{6}$/, 'Kod altı haneli olmalıdır.'),
  newPassword: z.string().min(10, 'Parola en az 10 karakter olmalıdır.').max(72),
});
type FormValues = z.infer<typeof schema>;

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [complete, setComplete] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: params.get('email') || '' },
  });

  const onSubmit = handleSubmit(async ({ email, code, newPassword }) => {
    setSubmitError(null);
    try {
      await resetPassword(email, code, newPassword);
      setComplete(true);
    } catch (error) {
      setSubmitError(apiErrorMessage(error));
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-lightprimary px-4 dark:bg-dark">
      <CardBox className="w-full border-none md:w-[450px]">
        <div className="mx-auto mb-6"><FullLogo /></div>
        <h1 className="text-center text-2xl font-semibold">Yeni parola belirleyin</h1>
        {complete ? (
          <div className="mt-6">
            <div className="rounded-md bg-lightsuccess p-4 text-sm text-success">Parolanız güncellendi. Artık giriş yapabilirsiniz.</div>
            <Button asChild className="mt-5 w-full"><Link to="/auth/login">Giriş yap</Link></Button>
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={onSubmit} noValidate>
            {submitError && <div className="rounded-md bg-lighterror p-3 text-sm text-error">{submitError}</div>}
            <div><Label htmlFor="email">E-posta</Label><Input id="email" type="email" className="mt-2" {...register('email')} />{errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}</div>
            <div><Label htmlFor="code">Sıfırlama kodu</Label><Input id="code" inputMode="numeric" autoComplete="one-time-code" className="mt-2" {...register('code')} />{errors.code && <p className="mt-1 text-xs text-error">{errors.code.message}</p>}</div>
            <div><Label htmlFor="newPassword">Yeni parola</Label><Input id="newPassword" type="password" autoComplete="new-password" className="mt-2" {...register('newPassword')} />{errors.newPassword && <p className="mt-1 text-xs text-error">{errors.newPassword.message}</p>}</div>
            <Button className="w-full" disabled={isSubmitting}>{isSubmitting ? 'Güncelleniyor…' : 'Parolayı güncelle'}</Button>
          </form>
        )}
      </CardBox>
    </div>
  );
}
