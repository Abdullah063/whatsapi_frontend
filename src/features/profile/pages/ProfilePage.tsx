import { Icon } from '@iconify/react';
import { Card, CardContent } from 'src/components/ui/card';
import { useAuth } from 'src/features/auth/model/auth-context';

export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;
  const fields = [['Kullanıcı adı', user.username], ['E-posta', user.email], ['Rol', user.role === 'ADMIN' ? 'Yönetici' : 'Kullanıcı'], ['Durum', user.status]];
  return <div className="space-y-7"><div><p className="text-sm font-medium text-primary">Hesap</p><h1 className="mt-1 text-2xl font-semibold md:text-3xl">Profilim</h1><p className="mt-2 text-sm text-muted-foreground">Oturum açtığınız hesaba ait bilgiler.</p></div><Card><CardContent><div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-lightprimary text-2xl font-semibold text-primary">{(user.fullName || user.username).slice(0, 1).toLocaleUpperCase('tr-TR')}</div><div><h2 className="text-xl font-semibold">{user.fullName || user.username}</h2><p className="mt-1 text-sm text-muted-foreground">{user.email}</p></div></div><div className="mt-8 grid gap-4 border-t border-border pt-6 md:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="rounded-lg bg-muted/60 p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 flex items-center gap-2 text-sm font-medium"><Icon icon="solar:user-id-linear" className="text-primary" />{value}</p></div>)}</div></CardContent></Card></div>;
}
