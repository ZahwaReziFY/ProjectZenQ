import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import StateMessage from '../components/StateMessage';
import { formatDateTime, VISIT_STATUS } from '../utils/format';
import { House, MapPin, MessagesSquare } from 'lucide-react';
import { useLang } from '../i18n';

const CONSULT_CHIP = { ongoing: ['green', 'Berlangsung'], completed: ['', 'Selesai'], cancelled: ['red', 'Dibatalkan'] };

/** Dashboard dokter: konsultasi masuk + pesanan home visit. */
function DoctorDashboard() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: consultations, loading, error } = useFetch('/consultations');
  const { data: visits } = useFetch('/home-visits');

  const { data: me, setData: setMe } = useFetch('/doctors/me');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const online = Boolean(me?.is_online);

  // Ganti status online/offline. Offline = pasien tidak bisa memesan (dicek juga di backend).
  const toggleOnline = async () => {
    if (!me || saving) return;
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await api.patch('/doctors/me/status', { is_online: !online });
      setMe({ ...me, is_online: res.data.is_online });
      setStatusMsg({ ok: true, text: res.message });
    } catch (err) {
      setStatusMsg({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wrap">
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div>
          <h1 className="title">{t('Halo,')}{' '}{user.name}</h1>
          <p className="sub">{t('Konsultasi dan kunjungan pasien hari ini.')}</p>
        </div>
        <div className={`status-card ${online ? 'on' : ''}`}>
          <span className="status-dot" aria-hidden="true" />
          <div style={{ minWidth: 0 }}>
            <b>{me ? (online ? t('Online') : t('Offline')) : t('Memuat…')}</b>
            <div className="small muted">{online ? t('Pasien bisa memesan Anda') : t('Pasien tidak bisa memesan Anda')}</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={online}
            aria-label={t('Status online')}
            className={`switch ${online ? 'on' : ''}`}
            onClick={toggleOnline}
            disabled={!me || saving}
          >
            <span />
          </button>
        </div>
      </div>
      {statusMsg && <div className={`toast ${statusMsg.ok ? '' : 'err'}`} style={{ marginTop: 0, marginBottom: 8 }}>{statusMsg.text}</div>}

      <div className="sec" style={{ marginTop: 0 }}><h2>{t('Konsultasi')}</h2></div>
      <StateMessage loading={loading} error={error} empty={consultations && !consultations.length} emptyIcon={<MessagesSquare size={40} />} emptyText={t('Belum ada konsultasi.')} />
      <div className="grid" style={{ gap: 14 }}>
        {consultations?.map((c) => {
          const [cls, label] = CONSULT_CHIP[c.status] || ['', c.status];
          return (
            <div key={c.id} className="card hist">
              <div className="em"><MessagesSquare size={24} /></div>
              <div className="info">
                <b style={{ fontSize: 17 }}>{c.patient_name}</b>
                <div className="small muted">{formatDateTime(c.created_at)}</div>
                {c.complaint && <div className="small muted">{t('Keluhan:')}{' '}{c.complaint}</div>}
              </div>
              <span className={`chip ${cls}`}>{t(label)}</span>
              <button className="btn sm" onClick={() => navigate(`/consultations/${c.id}`)}>{t('Buka Chat')}</button>
            </div>
          );
        })}
      </div>

      <div className="sec"><h2>{t('Home Visit')}</h2></div>
      <StateMessage empty={visits && !visits.length} emptyIcon={<House size={40} />} emptyText={t('Belum ada pesanan home visit.')} />
      <div className="grid" style={{ gap: 14 }}>
        {visits?.map((v) => (
          <div key={v.id} className="card hist">
            <div className="em"><House size={24} /></div>
            <div className="info">
              <b style={{ fontSize: 17 }}>{v.patient_name}</b>
              <div className="small muted">{formatDateTime(v.scheduled_at)}</div>
              <div className="small muted row" style={{ gap: 5 }}><MapPin size={14} /> {v.address}</div>
            </div>
            <span className={`chip ${v.status === 'completed' ? 'green' : v.status === 'cancelled' ? 'red' : v.status === 'pending' ? '' : 'orange'}`}>{VISIT_STATUS[v.status]}</span>
            <button className="btn sm" onClick={() => navigate(`/doctor/visits/${v.id}`)}>{t('Lihat Pesanan')}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DoctorDashboard;
