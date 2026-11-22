import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import StateMessage from '../components/StateMessage';
import { formatDateShort, relativeDay } from '../utils/format';
import { BellOff } from 'lucide-react';
import { useLang } from '../i18n';

function Notifications() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error, setData } = useFetch('/notifications');
  const [selectedId, setSelectedId] = useState(null);
  const items = data?.items || [];
  const n = items.find((x) => x.id === selectedId) || items[0];

  // Tandai dibaca pas dibuka
  useEffect(() => {
    if (!n || n.is_read) return;
    api.patch(`/notifications/${n.id}/read`).catch(() => {});
    setData((d) => ({
      ...d,
      unread: Math.max(0, d.unread - 1),
      items: d.items.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)),
    }));
  }, [n, setData]);

  const avatar = (x, size) =>
    x.sender_name ? <Avatar name={x.sender_name} size={size} /> : <Avatar name="Z Q" size={size} bg="#7fe0d2" />;

  return (
    <div className="wrap">
      <h1 className="title">{t('Notifikasi')}</h1>
      <p className="sub">{t('Lihat notifikasi pemberitahuan yang anda dapat.')}</p>

      <StateMessage loading={loading} error={error} empty={!loading && !items.length} emptyIcon={<BellOff size={40} />} emptyText={t('Belum ada notifikasi.')} />

      {n && (
        <div className="consult" style={{ '--cols': '380px 1fr' }}>
          <div className="nlist">
            {items.map((x) => (
              <button key={x.id} className={`nitem ${n.id === x.id ? 'on' : ''}`} onClick={() => setSelectedId(x.id)}>
                {avatar(x, 42)}
                <div style={{ minWidth: 0 }}>
                  <div className="small muted">{relativeDay(x.created_at)}</div>
                  <b>{t(x.title)}</b>{!x.is_read && <span className="chip red" style={{ marginLeft: 6, padding: '1px 8px' }}>{t('Baru')}</span>}
                  <div className="small muted" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t(x.body)}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="card">
            <div className="row" style={{ marginBottom: 16 }}>
              {avatar(n, 64)}
              <div>
                <h2 style={{ fontSize: 22 }}>{t(n.title)}</h2>
                <div className="small muted">{formatDateShort(n.created_at)}</div>
              </div>
            </div>
            <div style={{ background: 'var(--soft)', border: '1px solid var(--brand)', borderRadius: 16, padding: 22, fontSize: 17 }}>
              {t(n.body)}
            </div>
            {n.type === 'consultation' && n.reference_id && (
              <button className="btn" style={{ marginTop: 18 }} onClick={() => navigate(`/consultations/${n.reference_id}`)}>{t('Lanjutkan sesi')}</button>
            )}
            {['home_visit', 'order'].includes(n.type) && n.reference_id && (
              <button className="btn" style={{ marginTop: 18 }} onClick={() => navigate(
                // Dokter: reference_id = id kunjungan -> halaman detail kunjungan dokter. Pasien: id pesanan.
                user.role === 'doctor' && n.type === 'home_visit' ? `/doctor/visits/${n.reference_id}` : `/orders/${n.reference_id}`
              )}>{t('Lihat pesanan')}</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;
