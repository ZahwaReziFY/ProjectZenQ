import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Ambulance, ArrowLeft, House, MessagesSquare } from 'lucide-react';
import api from '../utils/api';
import { useFetch } from '../hooks/useFetch';
import StatusChip from '../components/StatusChip';
import OrderSummary from '../components/OrderSummary';
import Timeline from '../components/Timeline';
import StateMessage from '../components/StateMessage';
import { formatDateTime, methodLabel, VISIT_STATUS } from '../utils/format';
import { useLang } from '../i18n';

function OrderDetail() {
  const { t } = useLang();
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: o, setData, loading, error } = useFetch(`/orders/${id}`);
  const [actionError, setActionError] = useState('');

  // Home visit yang sedang berjalan: cek status terbaru tiap 15 detik (biar update dari dokter langsung kelihatan)
  const live = o?.kind === 'home_visit' && o?.status === 'processing';
  useEffect(() => {
    if (!live) return undefined;
    const t = setInterval(() => api.get(`/orders/${id}`).then((r) => setData(r.data)).catch(() => {}), 15000);
    return () => clearInterval(t);
  }, [live, id, setData]);

  const cancel = async () => {
    if (!window.confirm(t('Batalkan pesanan ini?'))) return;
    try {
      const res = await api.post(`/orders/${id}/cancel`);
      setData(res.data);
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading || error) return <div className="wrap"><StateMessage loading={loading} error={error} /></div>;

  return (
    <div className="wrap">
      <button className="btn ghost sm" style={{ marginBottom: 18 }} onClick={() => navigate('/history')}><ArrowLeft size={16} />{' '}{t('Kembali ke Riwayat')}</button>

      <div className="row" style={{ marginBottom: 22, flexWrap: 'wrap' }}>
        <div className="hist"><div className="em">{o.kind === 'home_visit' ? <House size={26} /> : o.kind === 'ambulance' ? <Ambulance size={26} /> : <MessagesSquare size={26} />}</div></div>
        <div style={{ flex: 1 }}>
          <h1 className="title" style={{ margin: 0 }}>{t(o.title)}</h1>
          <div className="muted small">{t('ID transaksi')}{' '}{o.code}</div>
        </div>
        <StatusChip status={o.status} style={{ fontSize: 14, padding: '6px 16px' }} />
      </div>

      <div className="split" style={{ '--cols': '1.3fr 1fr' }}>
        <div className="grid" style={{ gap: 20 }}>
          <div className="card">
            <h3 style={{ marginBottom: 12 }}>{t('Informasi Layanan')}</h3>
            <div className="kv">
              <span>{t('Tanggal')}</span><span>{formatDateTime(o.created_at)}</span>
              <span>{t('Lokasi / Tujuan')}</span><span>{o.place}</span>
              <span>{t('Kategori')}</span><span>{o.category}</span>
              <span>{t('Metode bayar')}</span><span>{methodLabel(o)}</span>
              {o.home_visit && <><span>{t('Status kunjungan')}</span><span>{VISIT_STATUS[o.home_visit.status] || '-'}</span></>}
            </div>
          </div>
          <OrderSummary order={o} title={t('Rincian Biaya')} showTitle={false} />
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>{t('Status Pesanan')}</h3>
          <Timeline status={o.status} kind={o.kind} visitStatus={o.home_visit?.status} />
          <div className="row" style={{ flexWrap: 'wrap', marginTop: 8 }}>
            {o.status === 'awaiting_payment' && (
              <button className="btn sm" onClick={() => navigate(`/checkout/${o.id}`)}>{t('Lanjut Bayar')}</button>
            )}
            {o.consultation && ['processing', 'completed'].includes(o.status) && (
              <button className="btn sm" onClick={() => navigate(`/consultations/${o.consultation.id}`)}>
                {o.status === 'processing' ? t('Buka Chat') : t('Lihat Chat')}
              </button>
            )}
            {o.status === 'completed' && (
              <button className="btn sm" onClick={() => navigate('/doctors')}>{t('Pesan Lagi')}</button>
            )}
            {(o.status === 'awaiting_payment' || (o.kind === 'ambulance' && o.status === 'processing')) && (
              <button className="btn ghost sm" onClick={cancel}>{t('Batalkan')}</button>
            )}
            <button className="btn ghost sm" onClick={() => navigate(`/help?order=${o.code}`)}>{t('Pusat Bantuan')}</button>
          </div>
          {actionError && <div className="toast err">{actionError}</div>}
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
