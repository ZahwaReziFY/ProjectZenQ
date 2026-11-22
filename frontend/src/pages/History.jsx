import { useNavigate } from 'react-router-dom';
import { ClipboardList, House, MapPin, MessagesSquare } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import StatusChip from '../components/StatusChip';
import StateMessage from '../components/StateMessage';
import { formatDateTime } from '../utils/format';
import { useLang } from '../i18n';

/** Riwayat pasien: booking dokter (konsultasi online & home visit). */
function History() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { data: orders, loading, error } = useFetch(`/orders?category=${encodeURIComponent('Booking Dokter')}`);

  return (
    <div className="wrap">
      <h1 className="title">{t('Riwayat Saya')}</h1>
      <p className="sub">{t('Konsultasi online dan home visit yang pernah kamu pesan.')}</p>

      <StateMessage loading={loading && !orders} error={error} empty={orders && !orders.length}
        emptyIcon={<ClipboardList size={40} />} emptyText={t('Belum ada riwayat booking dokter.')} />

      <div className="grid" style={{ gap: 14 }}>
        {orders?.map((o) => (
          <div key={o.id} className="card hist">
            <div className="em">{o.kind === 'home_visit' ? <House size={24} /> : <MessagesSquare size={24} />}</div>
            <div className="info">
              <b style={{ fontSize: 17 }}>{t(o.title)}</b>
              <div className="small muted">{formatDateTime(o.created_at)}</div>
              <div className="small muted row" style={{ gap: 5 }}><MapPin size={14} /> {o.place}</div>
            </div>
            <StatusChip status={o.status} />
            <button className="btn sm" onClick={() => navigate(`/orders/${o.id}`)}>{t('Lihat Detail')}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;
