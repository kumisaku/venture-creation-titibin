import type { IconName } from '@/components/ui';

export const CAMPUSES = ['Anggrek', 'Syahdan', 'Kijang', 'Alam Sutera', 'Bekasi', 'Senayan', 'Bandung', 'Malang', 'Semarang'];

export const HANDOVER_POINTS = [
  'Kampus Anggrek - BINUS Food Court Lt. 1',
  'Kampus Anggrek - Food Court Lt. 2',
  'Kampus Syahdan - Lobi Utama',
  'Kampus Kijang - Lobi',
  'Kampus Alam Sutera - Kantin',
  'Kampus Bekasi - Lobi Utama',
];

export const CATEGORIES: { key: string; label: string; icon: IconName }[] = [
  { key: 'snack', label: 'Snack & Makanan', icon: 'fast-food-outline' },
  { key: 'skincare', label: 'Skincare & Cosmetik', icon: 'leaf-outline' },
  { key: 'anime', label: 'Anime & Merch', icon: 'game-controller-outline' },
  { key: 'fashion', label: 'Fashion & Sepatu', icon: 'shirt-outline' },
  { key: 'gadget', label: 'Gadget', icon: 'phone-portrait-outline' },
  { key: 'vitamin', label: 'Vitamin & Obat', icon: 'medkit-outline' },
];

/** Jastip is local: trips and events only run in these regions (keep in sync with REGIONS in backend/src/server.js). */
export const REGIONS = ['Jakarta', 'Tangerang', 'Bekasi', 'Bandung', 'Semarang', 'Malang'];

export const JASTIP_FEE_RATE = 0.2;
export const APP_FEE_RATE = 0.1;
