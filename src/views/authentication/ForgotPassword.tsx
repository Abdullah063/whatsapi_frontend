import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { requestPasswordReset } from 'src/features/auth/api/auth-api';
import FullLogo from 'src/layouts/full/shared/logo/FullLogo';
import { apiErrorMessage } from 'src/shared/api/error-message';

const schema = z.object({ email: z.string().trim().email('Geçerli bir e-posta adresi girin.') });
type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setSubmitError(null);
    try {
      await requestPasswordReset(email);
      navigate(`/auth/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      setSubmitError(apiErrorMessage(error));
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-lightprimary px-4 dark:bg-dark">
      <CardBox className="w-full border-none md:w-[450px]">
        <div className="mx-auto mb-6"><FullLogo /></div>
        <h1 className="text-center text-2xl font-semibold">Parolanızı sıfırlayın</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Hesabınıza ait e-posta adresine altı haneli bir kod göndereceğiz.
        </p>
        {submitError && <div className="mt-5 rounded-md bg-lighterror p-3 text-sm text-error">{submitError}</div>}
        <form className="mt-6" onSubmit={onSubmit} noValidate>
          <Label htmlFor="email">E-posta</Label>
          <Input id="email" type="email" autoComplete="email" className="mt-2" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
          <Button className="mt-5 w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Gönderiliyor…' : 'Sıfırlama kodu gönder'}
          </Button>
        </form>
        <Button asChild variant="ghost" className="mt-3 w-full"><Link to="/auth/login">Giriş ekranına dön</Link></Button>
      </CardBox>
    </div>
  );
}
