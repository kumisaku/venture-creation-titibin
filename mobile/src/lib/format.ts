import type { OrderStatus } from './types';

export const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString('id-ID').replace(/,/g, '.')}`;
export const plain = (n: number) => Math.round(n).toLocaleString('id-ID').replace(/,/g, '.');

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

// "dd/mm/yyyy" typed by the user -> "yyyy-mm-dd" for the API.
export const toIsoDate = (s: string) => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const iso = `${m[3]}-${m[2]}-${m[1]}`;
  return Number.isNaN(new Date(iso).getTime()) ? null : iso;
};

export const maskDate = (s: string) => {
  const digits = s.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)].filter(Boolean).join('/');
};

export const tripTitle = (destination: string, country: string) =>
  destination === country ? country : `${destination}, ${country}`;

export type StatusTone = 'pending' | 'accepted' | 'rejected' | 'done';

export const STATUS_META: Record<OrderStatus, { label: string; tone: StatusTone }> = {
  pending: { label: 'Pending', tone: 'pending' },
  accepted: { label: 'Diterima', tone: 'accepted' },
  paid: { label: 'Diterima', tone: 'accepted' },
  bought: { label: 'Diterima', tone: 'accepted' },
  arrived: { label: 'Diterima', tone: 'accepted' },
  on_the_way: { label: 'Diterima', tone: 'accepted' },
  completed: { label: 'Selesai', tone: 'done' },
  rejected: { label: 'Ditolak', tone: 'rejected' },
  cancelled: { label: 'Dibatalkan', tone: 'rejected' },
};

// Progress shown on order cards and the tracking timeline (4 steps).
export const progressStep = (status: OrderStatus) =>
  ({ paid: 1, bought: 2, arrived: 3, on_the_way: 3, completed: 4 } as Partial<Record<OrderStatus, number>>)[status] ?? 0;

export const progressLabel = (status: OrderStatus, location: string) =>
  ({
    paid: `Sedang dibelikan di ${location}`,
    bought: 'Dalam perjalanan pulang',
    arrived: 'Tiba & lolos bea cukai',
    on_the_way: 'Menuju titik serah terima',
    completed: 'Pesanan selesai',
  } as Partial<Record<OrderStatus, string>>)[status] ?? '';

export const PAYMENT_LABEL: Record<string, string> = { qris: 'QRIS', va: 'BCA/Mandiri VA', binuspay: 'Binus Pay' };
