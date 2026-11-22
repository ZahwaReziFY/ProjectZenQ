/** Helper format tampilan, biar gak diulang di tiap halaman. Ikut bahasa aktif (lihat i18n/index.jsx). */
import { getLocale, translate as t } from '../i18n';

// Objek label yang otomatis diterjemahkan saat dibaca: VISIT_STATUS.completed -> 'Selesai' / 'Completed'
const labels = (obj) => {
  const out = {};
  Object.entries(obj).forEach(([k, v]) => Object.defineProperty(out, k, { enumerable: true, get: () => t(v) }));
  return out;
};

// Rp50.000 (sesuai mockup, tanpa spasi)
export const rp = (n) => `Rp${(Number(n) || 0).toLocaleString('id-ID')}`;

// "Senin, 22 Juni 2025 · 20.00"
export const formatDateTime = (value) => {
  if (!value) return '-';
  return new Date(value)
    .toLocaleString(getLocale(), {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    .replace(' pukul', ' ·')
    .replace(' at ', ' · ');
};

// "22 Desember 2025 · 19.17"
export const formatDateShort = (value) =>
  value
    ? new Date(value)
      .toLocaleString(getLocale(), { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      .replace(' pukul', ' ·')
      .replace(' at ', ' · ')
    : '-';

// "Hari Ini" / "3 Hari yang lalu" / "Minggu lalu" (label grup notifikasi di mockup)
export const relativeDay = (value) => {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);
  if (days <= 0) return t('Hari Ini');
  if (days === 1) return t('Kemarin');
  if (days < 7) return t('{n} Hari yang lalu', { n: days });
  if (days < 14) return t('Minggu lalu');
  return formatDateShort(value);
};

// Inisial avatar: "dr. Basna Yanti" -> "BY"
export const initials = (name = '') =>
  name.replace(/^(dr|drg)\.\s*/i, '').split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

// Status order -> label + warna chip (sesuai mockup: Selesai hijau, Diproses oranye, Dibatalkan merah)
const orderStatus = (label, cls) => ({ get label() { return t(label); }, cls });
export const ORDER_STATUS = {
  awaiting_payment: orderStatus('Menunggu Pembayaran', ''),
  processing: orderStatus('Diproses', 'orange'),
  completed: orderStatus('Selesai', 'green'),
  cancelled: orderStatus('Dibatalkan', 'red'),
};

export const VISIT_STATUS = labels({
  awaiting_payment: 'Menunggu pembayaran',
  pending: 'Menunggu dokter melihat pesanan',
  accepted: 'Dokter sudah melihat pesanan',
  on_the_way: 'Dokter dalam perjalanan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
});

export const FACILITY_LABEL = labels({ hospital: 'Rumah Sakit', puskesmas: 'Puskesmas', clinic: 'Klinik' });

export const methodLabel = (order) => {
  if (order.payment_method === 'bank') return t('Transfer Bank {bank} (Virtual Account)', { bank: order.payment_bank });
  if (order.payment_method === 'qris') return t('QR Pembayaran (QRIS)');
  return '-';
};
