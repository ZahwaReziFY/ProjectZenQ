import { useState } from 'react';
import api from '../../utils/api';
import { useFetch } from '../../hooks/useFetch';
import StatusChip from '../../components/StatusChip';
import StateMessage from '../../components/StateMessage';
import { formatDateTime, ORDER_STATUS, rp } from '../../utils/format';
import { useLang } from '../../i18n';

function AdminOrders() {
  const { t } = useLang();
  const [status, setStatus] = useState('');
  const { data: orders, loading, error, refetch } = useFetch(`/admin/orders${status ? `?status=${status}` : ''}`);

  const setOrderStatus = async (id, next) => {
    await api.patch(`/admin/orders/${id}/status`, { status: next });
    refetch();
  };

  return (
    <div className="wrap">
      <h1 className="title">{t('Kelola Pesanan')}</h1>
      <p className="sub">{t('Semua konsultasi, home visit, pembelian, dan pengajuan.')}</p>
      <div className="chips" style={{ marginBottom: 22 }}>
        <button className={!status ? 'on' : ''} onClick={() => setStatus('')}>{t('Semua')}</button>
        {Object.entries(ORDER_STATUS).map(([k, v]) => (
          <button key={k} className={status === k ? 'on' : ''} onClick={() => setStatus(k)}>{v.label}</button>
        ))}
      </div>

      <StateMessage loading={loading && !orders} error={error} empty={orders && !orders.length} emptyIcon="📋" emptyText={t('Belum ada pesanan.')} />
      <div className="grid" style={{ gap: 14 }}>
        {orders?.map((o) => (
          <div key={o.id} className="card hist">
            <div className="em">{o.icon}</div>
            <div className="info">
              <b>{t(o.title)}</b>
              <div className="small muted">{o.code} · {o.customer_name} · {formatDateTime(o.created_at)}</div>
              <div className="small muted">{o.category} · {rp(o.total)}</div>
            </div>
            <StatusChip status={o.status} />
            {o.status === 'processing' && (
              <button className="btn sm" onClick={() => setOrderStatus(o.id, 'completed')}>{t('Tandai Selesai')}</button>
            )}
            {!['completed', 'cancelled'].includes(o.status) && (
              <button className="link" style={{ color: 'var(--red)' }} onClick={() => setOrderStatus(o.id, 'cancelled')}>{t('Batalkan')}</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminOrders;
