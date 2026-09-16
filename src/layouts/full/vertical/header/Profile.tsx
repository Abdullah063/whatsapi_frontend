import { Icon } from '@iconify/react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from 'src/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from 'src/components/ui/dropdown-menu';
import { useAuth } from 'src/features/auth/model/auth-context';

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const label = user?.fullName || user?.username || 'Kullanıcı';

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await signOut();
      navigate('/auth/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto gap-3 px-2 py-1.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lightprimary font-semibold text-primary">{label.slice(0, 1).toLocaleUpperCase('tr-TR')}</span>
          <span className="hidden text-left lg:block"><span className="block max-w-36 truncate text-sm font-medium">{label}</span><span className="block text-xs text-muted-foreground">{user?.role === 'ADMIN' ? 'Yönetici' : 'Kullanıcı'}</span></span>
          <Icon icon="solar:alt-arrow-down-linear" className="hidden text-muted-foreground lg:block" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 p-2">
        <div className="px-2 py-2"><p className="truncate text-sm font-medium">{label}</p><p className="mt-1 truncate text-xs text-muted-foreground">{user?.email}</p></div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/settings/profile" className="cursor-pointer"><Icon icon="solar:user-circle-linear" />Profilim</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/billing" className="cursor-pointer"><Icon icon="solar:wallet-money-linear" />Paket ve kullanım</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-error focus:text-error" disabled={loggingOut} onSelect={handleLogout}><Icon icon="solar:logout-2-linear" />{loggingOut ? 'Çıkış yapılıyor…' : 'Çıkış yap'}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
