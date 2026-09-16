import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { useAuth } from 'src/features/auth/model/auth-context';
import { apiErrorMessage } from 'src/shared/api/error-message';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(1, 'Parola zorunludur.').max(72),
});

type LoginForm = z.infer<typeof loginSchema>;

const AuthLogin = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await signIn(values);
      const destination = (location.state as { from?: string } | null)?.from || '/';
      navigate(destination, { replace: true });
    } catch (error) {
      setSubmitError(apiErrorMessage(error));
    }
  });

  return (
      <form className="mt-6" onSubmit={onSubmit} noValidate>
        {submitError && (
          <div className="mb-4 rounded-md bg-lighterror px-4 py-3 text-sm text-error" role="alert">
            {submitError}
          </div>
        )}
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="email">E-posta</Label>
          </div>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="password">Parola</Label>
          </div>
          <Input id="password" type="password" autoComplete="current-password" {...register('password')} />
          {errors.password && <p className="mt-1 text-xs text-error">{errors.password.message}</p>}
        </div>
        <div className="flex justify-end my-5">
          <Link to="/auth/forgot-password" className="text-primary text-sm font-medium">
            Parolamı unuttum
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Giriş yapılıyor…' : 'Giriş yap'}
        </Button>
      </form>
  );
};

export default AuthLogin;
