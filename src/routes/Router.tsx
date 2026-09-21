import { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import ProtectedRoute from 'src/features/auth/ui/ProtectedRoute';
import ModulePage from 'src/shared/ui/ModulePage';
import Loadable from '../layouts/full/shared/loadable/Loadable';

const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));
const DashboardPage = Loadable(lazy(() => import('../features/dashboard/pages/DashboardPage')));
const AccountsPage = Loadable(lazy(() => import('../features/accounts/pages/AccountsPage')));
const InboxPage = Loadable(lazy(() => import('../features/inbox/pages/InboxPage')));
const AutomationsPage = Loadable(lazy(() => import('../features/automations/pages/AutomationsPage')));
const ActionsPage = Loadable(lazy(() => import('../features/actions/pages/ActionsPage')));
const MediaLibraryPage = Loadable(lazy(() => import('../features/media/pages/MediaLibraryPage')));
const ContactsPage = Loadable(lazy(() => import('../features/contacts/pages/ContactsPage')));
const ProfilePage = Loadable(lazy(() => import('../features/profile/pages/ProfilePage')));
const Login = Loadable(lazy(() => import('../views/authentication/auth2/Login')));
const Register = Loadable(lazy(() => import('../views/authentication/auth2/Register')));
const VerifyEmail = Loadable(lazy(() => import('../views/authentication/VerifyEmail')));
const ForgotPassword = Loadable(lazy(() => import('../views/authentication/ForgotPassword')));
const ResetPassword = Loadable(lazy(() => import('../views/authentication/ResetPassword')));
const NotFound = Loadable(lazy(() => import('../views/authentication/NotFound')));

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <FullLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'whatsapp-accounts', element: <AccountsPage /> },
          { path: 'inbox', element: <InboxPage /> },
          { path: 'automations', element: <AutomationsPage /> },
          { path: 'actions', element: <ActionsPage /> },
          { path: 'media-library', element: <MediaLibraryPage /> },
          { path: 'contacts', element: <ContactsPage /> },
          { path: 'templates', element: <ModulePage eyebrow="İçerik" title="Mesaj şablonları" description="Meta hesabınızdaki onaylı şablonları senkronize edin ve kampanyalarda kullanın." icon="solar:document-text-linear" capabilities={['Meta şablon senkronizasyonu', 'Dil ve durum filtreleri', 'Değişken önizleme', 'Kampanya seçimi']} /> },
          { path: 'campaigns', element: <ModulePage eyebrow="Toplu gönderim" title="Kampanyalar" description="Kişi gruplarına kontrollü ve izlenebilir WhatsApp kampanyaları gönderin." icon="solar:rocket-linear" capabilities={['Kampanya oluşturma', 'Alıcı ve kota doğrulaması', 'Kuyruk ilerleme takibi', 'İptal ve sonuç raporu']} /> },
          { path: 'analytics', element: <ModulePage eyebrow="Raporlama" title="Analitik" description="Mesaj hacmi, teslimat, okunma, otomasyon ve kampanya performansını inceleyin." icon="solar:chart-2-linear" capabilities={['Tarih aralığı karşılaştırması', 'Mesaj hacmi grafikleri', 'Teslimat ve hata oranları', 'En iyi otomasyon kuralları']} /> },
          { path: 'billing', element: <ModulePage eyebrow="Abonelik" title="Paket ve kullanım" description="Aktif paketinizi, limitlerinizi ve dönem kullanımınızı görüntüleyin." icon="solar:wallet-money-linear" capabilities={['Paket detayları', 'Mesaj kullanım kotası', 'Hesap ve kişi limitleri', 'Dönem bilgileri']} /> },
          { path: 'settings/profile', element: <ProfilePage /> },
        ],
      },
    ],
  },
  {
    path: '/auth',
    element: <BlankLayout />,
    children: [
      { index: true, element: <Navigate to="login" replace /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'verify-email', element: <VerifyEmail /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);

export default router;
