import { Icon } from '@iconify/react';
import { Card, CardContent } from 'src/components/ui/card';

interface ModulePageProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  capabilities: string[];
}

export default function ModulePage({ eyebrow, title, description, icon, capabilities }: ModulePageProps) {
  return (
    <div className="space-y-7">
      <div><p className="text-sm font-medium text-primary">{eyebrow}</p><h1 className="mt-1 text-2xl font-semibold md:text-3xl">{title}</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p></div>
      <Card className="border-dashed"><CardContent className="py-8"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lightprimary text-primary"><Icon icon={icon} width={28} /></div><h2 className="mt-5 text-lg font-semibold">Modül arayüzü sıradaki geliştirme adımında</h2><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Backend API’si hazır. Arayüz, gerçek API sözleşmesine göre geliştirilecek; geçici veya sahte veri kullanılmıyor.</p><div className="mt-6 grid gap-3 md:grid-cols-2">{capabilities.map((capability) => <div key={capability} className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm"><Icon icon="solar:check-circle-linear" className="text-success" width={20} />{capability}</div>)}</div></CardContent></Card>
    </div>
  );
}
