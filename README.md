# WhatsAPI Frontend

WhatsAPI Spring Boot backend'i için React tabanlı yönetim panelidir. Proje TailwindAdmin'ın MIT lisanslı tasarım altyapısını kullanır; demo içerikler ürün rotalarından ayrılmış, auth ve ilk operasyon ekranları gerçek backend API'lerine bağlanmıştır.

## Teknoloji

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- React Router 7
- TanStack Query
- React Hook Form + Zod
- Cookie tabanlı oturum ve CSRF koruması

## Yerel geliştirme

Gereksinimler: Node.js 20+ ve çalışan `whatsapi_backend`.

```bash
npm install
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılır. Geliştirme sunucusu `/api` isteklerini varsayılan olarak `http://localhost:8080` adresindeki Spring Boot uygulamasına yönlendirir.

Backend farklı bir origin'de çalışıyorsa `.env.example` dosyasını `.env.local` olarak kopyalayıp aşağıdaki değeri düzenleyin:

```env
VITE_API_BASE_URL=https://api.example.com
```

## Kalite komutları

```bash
npm run typecheck
npm run lint
npm run build
```

Backend çalışırken OpenAPI tiplerini üretmek için:

```bash
npm run api:generate
```

## Dizin yapısı

```text
src/
  features/       Ürün modülleri: auth, dashboard, accounts, profile
  shared/api/     HTTP, CSRF ve ortak hata yönetimi
  shared/ui/      Modüller arası ortak arayüz parçaları
  layouts/        Korumalı panel ve boş auth layout'ları
  routes/         Uygulama rota ağacı
  components/     TailwindAdmin ve temel UI bileşenleri
```

Auth ekranları, gerçek analytics dashboard'u, Meta Cloud API hesap yönetimi ve gelen kutusu çalışır durumdadır. Gelen kutusu hesap/konuşma seçimi, son mesaj geçmişi, yeni numarayla konuşma başlatma, metin gönderimi ve mesaj durumu yenilemesini destekler. Otomasyon, kişi, şablon, kampanya, detaylı analitik ve abonelik ekranları backend sözleşmeleri korunarak modül modül geliştirilmeye hazır rota iskeletlerine sahiptir.

## Container

```bash
docker build -t whatsapi-frontend .
docker run --rm -p 8081:80 whatsapi-frontend
```

## Lisans

TailwindAdmin kaynaklarının lisans metni [LICENSE.md](./LICENSE.md) dosyasında korunmaktadır.
