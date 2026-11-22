import { rp } from '../utils/format';
import { useLang } from '../i18n';

// Kartu "Ringkasan Pesanan" / "Rincian Biaya" (dipake di Checkout & Detail Riwayat)
function OrderSummary({ order, title = 'Ringkasan Pesanan', showTitle = true }) {
  const { t } = useLang();
  const items = order.items || [];
  return (
    <div className="card">
      <h3 style={{ marginBottom: 12 }}>{t(title)}</h3>
      {showTitle && <div className="small muted" style={{ marginBottom: 8 }}>{t(order.title)}</div>}
      {items.length ? (
        <>
          {items.map((l, i) => (
            <div className="sumrow" key={i}><span className="muted">{l.label}</span><span>{rp(l.amount)}</span></div>
          ))}
          <div className="sumrow total"><span>{t('Total')}</span><span>{rp(order.total)}</span></div>
        </>
      ) : (
        <p className="muted">{t('Tidak ada biaya.')}</p>
      )}
    </div>
  );
}

export default OrderSummary;
