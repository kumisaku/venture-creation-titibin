import type { OrderStatus } from './types';

// Thousands separators are added by hand: Hermes' Intl support for id-ID differs per platform.
export const plain = (n: number) => String(Math.round(n)).replace(/B(?=(d{3})+(?!d))/g, '.');
export const rupiah = (n: number) => `Rp ${plain(n)}`;
/** Digits only, for reading a money input back into a number. */
export const parseMoney = (s: string) => Number(s.replace(/D/g, '')) || 0;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_LONG = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// Server timestamps are UTC "YYYY-MM-DD HH:MM:SS"; dates are "YYYY-MM-DD".
const parse = (s: string) => new Date(s.length === 10 ? `${s}T00:00:00` : `${s.replace(' ', 'T')}Z`);

export const longDate = (s: string) => {
  const d = parse(s);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
};

export const shortDateTime = (s: string) => {
  const d = parse(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} • ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
};

export const clock = (s: string) => {
  const d = parse(s);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export const daysUntil = (s: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parse(s).getTime() - today.getTime()) / 86400000);
};

export const departLabel = (depart: string, ret: string) => {
  const d = daysUntil(depart);
  if (d > 0) return d === 1 ? 'Berangkat besok' : `Berangkat dlm ${d} hari`;
  if (d === 0) return 'Hari ini';
  return daysUntil(ret) >= 0 ? 'Sedang di lokasi' : 'Selesai';
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

/** Local calendar date as "yyyy-mm-dd" (what the API and the date picker use). */
export const toIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const todayIso = () => toIso(new Date());

export const tripTitle = (destination: string, country: string) =>
  destination === country ? country : `${destination}, ${country}`;

export type StatusTone = 'pending' | 'accepted' | 'rejected' | 'done';

export const STATUS_META: Record<OrderStatus, { label: string; tone: StatusTone }> = {
  pending: { label: 'Pending', tone: 'pending' },
  negotiation: { label: 'Negosiasi', tone: 'pending' },
  accepted: { label: 'Diterima', tone: 'accepted' },
  bought: { label: 'Diterima', tone: 'accepted' },
  arrived: { label: 'Diterima', tone: 'accepted' },
  on_the_way: { label: 'Diterima', tone: 'accepted' },
  completed: { label: 'Selesai', tone: 'done' },
  rejected: { label: 'Ditolak', tone: 'rejected' },
  cancelled: { label: 'Dibatalkan', tone: 'rejected' },
};

// Progress shown on order cards and the tracking timeline (4 steps).
export const progressStep = (status: OrderStatus) =>
  ({ accepted: 1, bought: 2, arrived: 3, on_the_way: 3, completed: 4 } as Partial<Record<OrderStatus, number>>)[status] ?? 0;

export const progressLabel = (status: OrderStatus, location: string) =>
  ({
    accepted: `Sedang dibelikan di ${location}`,
    bought: 'Dalam perjalanan pulang',
    arrived: 'Tiba & lolos bea cukai',
    on_the_way: 'Menuju titik serah terima',
    completed: 'Pesanan selesai',
  } as Partial<Record<OrderStatus, string>>)[status] ?? '';

export const PAYMENT_LABEL: Record<string, string> = { qris: 'QRIS', va: 'BCA/Mandiri VA', binuspay: 'Binus Pay' };
