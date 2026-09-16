import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { Button } from 'src/components/ui/button';
import { Card, CardContent } from 'src/components/ui/card';
import { apiErrorMessage } from 'src/shared/api/error-message';
import { getAnalyticsOverview } from '../api/analytics-api';

const number = new Intl.NumberFormat('tr-TR');

export default function DashboardPage() {
  const overview = useQuery({ queryKey: ['analytics', 'overview'], queryFn: getAnalyticsOverview });

  if (overview.isPending) {
    return <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-32 animate-pulse rounded-xl bg-muted" />)}</div>;
  }

  if (overview.isError) {
    return (
      <Card className="max-w-2xl">
        <CardContent>
          <h1 className="text-xl font-semibold">Dashboard yüklenemedi</h1>
          <p className="mt-2 text-sm text-muted-foreground">{apiErrorMessage(overview.error)}</p>
          <Button className="mt-5" onClick={() => overview.refetch()}>Tekrar dene</Button>
        </CardContent>
      </Card>
    );
  }

  const data = overview.data;
  const metrics = [
    { label: 'Bugünkü mesaj', value: data.messages.today, icon: 'solar:chat-round-dots-linear', color: 'text-primary', background: 'bg-lightprimary' },
    { label: 'Açık konuşma', value: data.conversations.open, icon: 'solar:inbox-linear', color: 'text-secondary', background: 'bg-lightsecondary' },
    { label: 'Aktif otomasyon', value: data.automation.activeRules, icon: 'solar:bolt-linear', color: 'text-warning', background: 'bg-lightwarning' },
    { label: 'Aktif WhatsApp hesabı', value: data.accounts.active, icon: 'solar:smartphone-linear', color: 'text-success', background: 'bg-lightsuccess' },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-primary">Operasyon merkezi</p>
          <h1 className="mt-1 text-2xl font-semibold md:text-3xl">Genel bakış</h1>
          <p className="mt-2 text-sm text-muted-foreground">Mesajlaşma, otomasyon ve hesap durumunuzun canlı özeti.</p>
        </div>
        <Button asChild><Link to="/inbox"><Icon icon="solar:chat-round-dots-linear" />Gelen kutusuna git</Link></Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="gap-0 border-border/80 p-5 shadow-sm">
            <CardContent className="flex items-center justify-between">
              <div><p className="text-sm text-muted-foreground">{metric.label}</p><p className="mt-2 text-3xl font-semibold">{number.format(metric.value)}</p></div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${metric.background} ${metric.color}`}><Icon icon={metric.icon} width={25} /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardContent>
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-lg font-semibold">Mesaj performansı</h2><p className="mt-1 text-sm text-muted-foreground">Tüm zamanlardaki teslimat sonuçları</p></div>
              <span className="rounded-full bg-lightsuccess px-3 py-1 text-xs font-medium text-success">%{data.messages.deliveryRate.toFixed(1)} teslim</span>
            </div>
            <div className="mt-7 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {[['Toplam', data.messages.total], ['Teslim edildi', data.messages.delivered], ['Okundu', data.messages.read], ['Başarısız', data.messages.failed]].map(([label, value]) => (
                <div key={String(label)}><p className="text-2xl font-semibold">{number.format(Number(value))}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <h2 className="text-lg font-semibold">Paket kullanımı</h2>
            {data.subscription ? (
              <>
                <p className="mt-1 text-sm text-muted-foreground">{data.subscription.planName}</p>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, data.subscription.messageLimit ? (data.subscription.messagesUsed / data.subscription.messageLimit) * 100 : 0)}%` }} /></div>
                <div className="mt-3 flex justify-between text-sm"><span>{number.format(data.subscription.messagesUsed)} kullanıldı</span><span className="text-muted-foreground">{number.format(data.subscription.messagesRemaining)} kaldı</span></div>
              </>
            ) : <p className="mt-4 text-sm text-muted-foreground">Henüz aktif paket bilgisi bulunmuyor.</p>}
            <Button asChild variant="outline" className="mt-6 w-full"><Link to="/billing">Paketi görüntüle</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
