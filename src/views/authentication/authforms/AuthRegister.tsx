import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { register as registerUser } from 'src/features/auth/api/auth-api';
import { apiErrorMessage } from 'src/shared/api/error-message';
import { z } from 'zod';

const registerSchema = z.object({
  fullName: z.string().trim().max(200).optional(),
  username: z.string().trim().min(3, 'Kullanıcı adı en az 3 karakter olmalıdır.').max(100),
  email: z.string().trim().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(10, 'Parola en az 10 karakter olmalıdır.').max(72),
});

type RegisterForm = z.infer<typeof registerSchema>;

const AuthRegister = () => {
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const result = await registerUser(values);
      const query = new URLSearchParams({ userId: result.userId, email: result.email });
      navigate(`/auth/verify-email?${query.toString()}`);
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
            <Label htmlFor="fullName" className="font-semibold">Ad soyad</Label>
          </div>
          <Input id="fullName" type="text" autoComplete="name" {...register('fullName')} />
          {errors.fullName && <p className="mt-1 text-xs text-error">{errors.fullName.message}</p>}
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="username" className="font-semibold">Kullanıcı adı</Label>
          </div>
          <Input id="username" type="text" autoComplete="username" {...register('username')} />
          {errors.username && <p className="mt-1 text-xs text-error">{errors.username.message}</p>}
        </div>
        <div className="mb-4">
          <div className="mb-2 block">
            <Label htmlFor="email" className="font-semibold">E-posta</Label>
          </div>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-error">{errors.email.message}</p>}
        </div>
        <div className="mb-6">
          <div className="mb-2 block">
            <Label htmlFor="password" className="font-semibold">Parola</Label>
          </div>
          <Input id="password" type="password" autoComplete="new-password" {...register('password')} />
          {errors.password && <p className="mt-1 text-xs text-error">{errors.password.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Hesap oluşturuluyor…' : 'Hesap oluştur'}
        </Button>
      </form>
  );
};

export default AuthRegister
