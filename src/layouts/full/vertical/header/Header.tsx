import { Icon } from '@iconify/react';
import { useEffect, useState } from 'react';
import { useTheme } from 'src/components/provider/theme-provider';
import { Button } from 'src/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from 'src/components/ui/sheet';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import FullLogo from '../../shared/logo/FullLogo';
import SidebarLayout from '../sidebar/Sidebar';
import Profile from './Profile';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsSticky(window.scrollY > 20);
    const onResize = () => { if (window.innerWidth >= 1280) setIsOpen(false); };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); };
  }, []);

  return (
    <>
      <header className={`sticky top-0 z-[2] border-b border-transparent transition ${isSticky ? 'border-border bg-background/90 shadow-sm backdrop-blur' : 'bg-background'}`}>
        <nav className="flex h-18 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="xl:hidden" onClick={() => setIsOpen(true)} aria-label="Menüyü aç"><Icon icon="tabler:menu-2" width={21} /></Button>
            <div className="xl:hidden"><FullLogo /></div>
            <div className="hidden xl:block"><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">WhatsApp operasyon paneli</p></div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Temayı değiştir"><Icon icon={theme === 'dark' ? 'solar:sun-2-linear' : 'solar:moon-linear'} width={20} /></Button>
            <Profile />
          </div>
        </nav>
      </header>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-[270px] p-0"><VisuallyHidden><SheetTitle>Ana menü</SheetTitle></VisuallyHidden><SidebarLayout onClose={() => setIsOpen(false)} /></SheetContent>
      </Sheet>
    </>
  );
}
