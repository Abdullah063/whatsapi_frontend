import { Link } from 'react-router';
import { Button } from 'src/components/ui/button';
import FullLogo from 'src/layouts/full/shared/logo/FullLogo';

export default function NotFound() {
  return <div className="flex min-h-screen items-center justify-center bg-lightprimary px-4 text-center dark:bg-dark"><div><div className="mx-auto mb-8 w-fit"><FullLogo /></div><p className="text-7xl font-bold text-primary">404</p><h1 className="mt-4 text-2xl font-semibold">Sayfa bulunamadı</h1><p className="mt-2 text-sm text-muted-foreground">Aradığınız sayfa taşınmış veya hiç oluşturulmamış olabilir.</p><Button asChild className="mt-6"><Link to="/">Dashboard’a dön</Link></Button></div></div>;
}
