import { useLang } from '../i18n';
const STEPS = ['Pesanan dibuat', 'Pembayaran diterima', 'Sedang diproses', 'Selesai'];

// Home visit: tahapnya mengikuti status kunjungan yang diubah dokter
const VISIT_STEPS = ['Pesanan dibuat', 'Pembayaran diterima', 'Dokter melihat pesanan Anda', 'Dokter sedang dalam perjalanan', 'Pesanan selesai'];
// done = tahap yang sudah lewat (hijau). active = tahap yang SEDANG berlangsung (emas).
// pending: menunggu dokter (belum ada yang berlangsung) | on_the_way: dokter sedang di jalan
const VISIT_DONE = { awaiting_payment: 1, pending: 2, accepted: 3, on_the_way: 3, completed: 5 };
const VISIT_ACTIVE = { awaiting_payment: 1, on_the_way: 3 };

/**
 * Timeline status pesanan.
 * - Home visit (kirim visitStatus): dibuat -> dibayar -> dokter melihat -> dokter di jalan -> selesai
 * - Lainnya: dibuat -> dibayar -> diproses -> selesai
 * Tahap "done" = hijau, tahap "active" = sedang berlangsung (emas).
 */
function Timeline({ status, kind, visitStatus }) {
  const { t } = useLang();
  if (status === 'cancelled' || visitStatus === 'cancelled') {
    return (
      <ul className="tl">
        <li className="done"><i />{t('Pesanan dibuat')}</li>
        <li className="cancel"><i />{t('Dibatalkan')}</li>
      </ul>
    );
  }

  let steps = STEPS;
  let doneCount;
  let activeIndex;
  if (kind === 'home_visit') {
    const vs = status === 'awaiting_payment' ? 'awaiting_payment' : visitStatus || 'pending';
    steps = VISIT_STEPS;
    doneCount = VISIT_DONE[vs] ?? 2;
    activeIndex = VISIT_ACTIVE[vs] ?? -1;
  } else {
    // Pengajuan ambulans gak ada tahap bayar
    if (kind === 'ambulance') steps = ['Pengajuan dibuat', 'Sedang diproses', 'Selesai'];
    doneCount = { awaiting_payment: 1, processing: steps.length - 2, completed: steps.length }[status] ?? 1;
    activeIndex = doneCount;
  }

  return (
    <ul className="tl">
      {steps.map((s, i) => (
        <li key={s} className={i < doneCount ? 'done' : i === activeIndex ? 'active' : ''}><i />{t(s)}</li>
      ))}
    </ul>
  );
}

export default Timeline;
