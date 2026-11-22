import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Eye, House, MapPinned, Navigation, Phone, XCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import Avatar from '../components/Avatar';
import OrderSummary from '../components/OrderSummary';
import StateMessage from '../components/StateMessage';
import Timeline from '../components/Timeline';
import { formatDateTime, methodLabel, VISIT_STATUS } from '../utils/format';
import { useLang } from '../i18n';

// Langkah berikutnya yang bisa dipilih dokter (status sekarang -> tombol)
const NEXT = {
  pending: { to: 'accepted', label: 'Saya sudah melihat pesanan', Icon: Eye, note: 'Pasien akan diberi tahu bahwa Anda sudah melihat pesanannya.' },
  accepted: { to: 'on_the_way', label: 'Berangkat sekarang', Icon: Navigation, note: 'Pasien akan melihat status "Dokter sedang dalam perjalanan".' },
  on_the_way: { to: 'completed', label: 'Tandai kunjungan selesai', Icon: CheckCircle2, note: 'Pesanan pasien akan berstatus selesai.' },
};

/**
 * Detail pesanan Home Visit untuk DOKTER (/doctor/visits/:id).
 * Tampilannya sama dengan Detail Riwayat milik pasien, bedanya dokter bisa
 * memajukan status: lihat pesanan -> berangkat -> selesai (atau membatalkan).
 */
function DoctorVisit() {
  const { t } = useLang();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: v, setData, loading, error } = useFetch(`/home-visits/${id}`);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const setStatus = async (status, confirmText) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true);
    setMessage(null);
    try {
      await api.patch(`/home-visits/${id}/status`, { status });
      const res = await api.get(`/home-visits/${id}`);
      setData(res.data);
      setMessage({ ok: true, text: t('Status diperbarui: {status}.', { status: VISIT_STATUS[status] }) });
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  };

  if (loading || error) return <div className="wrap"><StateMessage loading={loading} error={error} /></div>;

  const o = v.order;
  const next = NEXT[v.status];
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    v.latitude && v.longitude ? `${v.latitude},${v.longitude}` : v.address
  )}`;
  const chip = { completed: 'green', cancelled: 'red', on_the_way: 'orange', accepted: 'orange' }[v.status] || '';

  return (
    <div className="wrap">
      <button className="btn ghost sm" style={{ marginBottom: 18 }} onClick={() => navigate(user.role === 'admin' ? '/admin/orders' : '/doctor')}>
        <ArrowLeft size={16} />{' '}{t('Kembali ke Dashboard')}
      </button>

      <div className="row" style={{ marginBottom: 22, flexWrap: 'wrap' }}>
        <div className="hist"><div className="em"><House size={26} /></div></div>
        <div style={{ flex: 1 }}>
          <h1 className="title" style={{ margin: 0 }}>{t('Home Visit')}{' '}{v.patient_name}</h1>
          {o && <div className="muted small">{t('ID transaksi')}{' '}{o.code}</div>}
        </div>
        <span className={`chip ${chip}`} style={{ fontSize: 14, padding: '6px 16px' }}>{VISIT_STATUS[v.status]}</span>
      </div>

      <div className="split" style={{ '--cols': '1.3fr 1fr' }}>
        <div className="grid" style={{ gap: 20 }}>
          <div className="card">
            <h3 style={{ marginBottom: 14 }}>{t('Informasi Kunjungan')}</h3>
            <div className="row" style={{ marginBottom: 14 }}>
              <Avatar name={v.patient_name} src={v.patient_avatar} size={52} />
              <div>
                <b>{v.patient_name}</b>
                {v.patient_phone && <div className="small muted row" style={{ gap: 5 }}><Phone size={13} /> {v.patient_phone}</div>}
              </div>
            </div>
            <div className="kv">
              <span>{t('Jadwal kunjungan')}</span><b>{formatDateTime(v.scheduled_at)}</b>
              <span>{t('Alamat')}</span><span>{v.address}</span>
              <span>{t('Keluhan')}</span><span>{v.complaint || '-'}</span>
              {o && <><span>{t('Metode bayar')}</span><span>{methodLabel(o)}</span></>}
              {o && <><span>{t('Dipesan')}</span><span>{formatDateTime(o.created_at)}</span></>}
            </div>
            <a className="btn ghost sm" href={mapsUrl} target="_blank" rel="noreferrer"><MapPinned size={15} />{' '}{t('Buka alamat di Google Maps')}</a>
          </div>
          {o && <OrderSummary order={o} title={t('Rincian Biaya')} showTitle={false} />}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>{t('Status Pesanan')}</h3>
          <Timeline status={o?.status || 'processing'} kind="home_visit" visitStatus={v.status} />

          {next && (
            <div className="visit-action">
              <button className="btn block" disabled={busy} onClick={() => setStatus(next.to)}>
                <next.Icon size={17} /> {busy ? t('Menyimpan…') : t(next.label)}
              </button>
              <div className="small muted" style={{ marginTop: 8 }}>{t(next.note)}</div>
            </div>
          )}
          {['pending', 'accepted'].includes(v.status) && (
            <button className="btn ghost sm" style={{ marginTop: 12, color: 'var(--red)' }} disabled={busy}
              onClick={() => setStatus('cancelled', t('Batalkan kunjungan ini? Pasien akan diberi tahu.'))}>
              <XCircle size={15} />{' '}{t('Batalkan kunjungan')}
            </button>
          )}
          {v.status === 'completed' && <div className="toast">{t('Kunjungan sudah selesai. Terima kasih, Dok.')}</div>}
          {message && <div className={`toast ${message.ok ? '' : 'err'}`}>{message.text}</div>}
        </div>
      </div>
    </div>
  );
}

export default DoctorVisit;
