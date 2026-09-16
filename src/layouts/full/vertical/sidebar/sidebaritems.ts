import { uniqueId } from 'lodash';

export interface SidebarItem {
  heading?: string;
  id?: string;
  name?: string;
  icon?: string;
  url?: string;
  children?: SidebarItem[];
  disabled?: boolean;
}

// Kept as aliases for reusable template search components that are not mounted yet.
export type ChildItem = SidebarItem;
export type MenuItem = SidebarItem;

const SidebarContent: SidebarItem[] = [
  {
    heading: 'Genel',
    children: [
      { id: uniqueId(), name: 'Dashboard', icon: 'solar:widget-2-linear', url: '/' },
      { id: uniqueId(), name: 'Gelen kutusu', icon: 'solar:inbox-linear', url: '/inbox' },
    ],
  },
  {
    heading: 'WhatsApp',
    children: [
      { id: uniqueId(), name: 'Hesaplar', icon: 'solar:smartphone-linear', url: '/whatsapp-accounts' },
      { id: uniqueId(), name: 'Otomatik cevaplar', icon: 'solar:bolt-linear', url: '/automations' },
      { id: uniqueId(), name: 'Şablonlar', icon: 'solar:document-text-linear', url: '/templates' },
    ],
  },
  {
    heading: 'Büyüme',
    children: [
      { id: uniqueId(), name: 'Kişiler', icon: 'solar:users-group-rounded-linear', url: '/contacts' },
      { id: uniqueId(), name: 'Kampanyalar', icon: 'solar:rocket-linear', url: '/campaigns' },
      { id: uniqueId(), name: 'Analitik', icon: 'solar:chart-2-linear', url: '/analytics' },
    ],
  },
  {
    heading: 'Hesap',
    children: [
      { id: uniqueId(), name: 'Paket ve kullanım', icon: 'solar:wallet-money-linear', url: '/billing' },
      { id: uniqueId(), name: 'Profilim', icon: 'solar:user-circle-linear', url: '/settings/profile' },
    ],
  },
];

export default SidebarContent;
