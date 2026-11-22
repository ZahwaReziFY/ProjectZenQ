import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import StateMessage from '../components/StateMessage';
import { rp } from '../utils/format';
import { ArrowLeft, Clock, MapPin } from 'lucide-react';
import { useLang } from '../i18n';

function DoctorProfile() {
  const { t } = useLang();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: d, loading, error } = useFetch(`/doctors/${id}`);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  const requireLogin = () => {
    if (user) return true;
    navigate('/auth', { state: { from: `/doctors/${id}` } });
    return false;
  };

  // Konsultasi -> bikin order -> halaman pembayaran
  const consult = async () => {
    if (!requireLogin()) return;
    setBusy(true);
    setActionError('');
    try {
      const res = await api.post('/orders', { kind: 'consultation', doctor_id: Number(id) });
      navigate(`/checkout/${res.data.id}`);
    } catch (err) {
      setActionError(err.message);
      setBusy(false);
    }
  };

  if (loading || error) return <div className="wrap"><StateMessage loading={loading} error={error} /></div>;
  const canBook = !user || user.role === 'patient';

  return (
    <div className="wrap">
      <button className="btn ghost sm" style={{ marginBottom: 18 }} onClick={() => navigate('/doctors')}><ArrowLeft size={16} />{' '}{t('Kembali')}</button>
      <div className="split">
        <div className="dphoto">
          {d.avatar_url ? (
            <img src={d.avatar_url} alt={d.name} style={{ width: '100%', objectFit: 'cover' }} />
          ) : (
            <svg viewBox="0 0 300 330" width="78%" aria-hidden="true">
              <circle cx="150" cy="105" r="58" fill="#F4C9A0" />
              <path d="M82 95c6-62 130-62 136 0v28c-30-26-106-26-136 0z" fill="#12253D" />
              <path d="M50 330c0-90 40-130 100-130s100 40 100 130z" fill="#fff" />
              <path d="M118 205l32 60 32-60" fill="none" stroke="#1F63C4" strokeWidth="10" />
              <rect x="195" y="236" width="70" height="52" rx="6" fill="#d6e6f5" stroke="#12253D" strokeWidth="3" />
            </svg>
          )}
        </div>

        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: 30 }}>{d.name}</h1>
              <div className="muted row" style={{ gap: 6, flexWrap: 'wrap' }}><MapPin size={16} /> {d.hospital}{d.practice_hours && <><Clock size={16} style={{ marginLeft: 8 }} /> {d.practice_hours}</>}</div>
            </div>
            <span className="chip">{t(d.specialization)}</span>
          </div>

          <div className="stats">
            <div className="stat"><b>{d.experience_years}+</b><span className="small muted">{t('Tahun Pengalaman')}</span></div>
            <div className="stat"><b>{d.rating}</b><span className="small muted">{t('Rating')}</span></div>
            <div className="stat"><b>{d.patients_count}+</b><span className="small muted">{t('Pasien')}</span></div>
          </div>

          <h2 style={{ fontSize: 20, marginBottom: 8 }}>{t('Tentang Saya')}</h2>
          <p className="muted">{d.bio}</p>

          <div className="price" style={{ fontSize: 22, margin: '16px 0' }}>
            {rp(d.consultation_fee)}{' '}
            {d.original_fee > d.consultation_fee && <span className="old">{rp(d.original_fee)}</span>}{' '}
            <span className="small muted" style={{ fontWeight: 400 }}>{t('/ sesi')}</span>
          </div>

          {canBook && (
            <>
              <div className="row">
                <button className="btn block" onClick={consult} disabled={busy || !d.is_online}>{busy ? t('Memproses…') : t('Konsultasi')}</button>
                {d.accepts_home_visit && (
                  <button className="btn ghost block" disabled={!d.is_online} onClick={() => navigate(`/home-visit?doctor=${d.id}`)}>{t('Home Visit')}</button>
                )}
              </div>
              {!d.is_online && (
                <div className="toast" style={{ background: 'var(--soft)', color: 'var(--text)' }}>
                  {d.name}{' '}{t('sedang offline, jadi belum bisa dipesan.')}{' '}
                  <button className="link" onClick={() => navigate('/doctors?sort=online')}>{t('Lihat dokter yang online')}</button>
                </div>
              )}
            </>
          )}
          {actionError && <div className="toast err">{actionError}</div>}

          {d.reviews?.length > 0 && (
            <>
              <h2 style={{ fontSize: 20, margin: '24px 0 8px' }}>{t('Ulasan Pasien')}</h2>
              {d.reviews.map((r) => (
                <div key={r.id} className="sumrow" style={{ flexDirection: 'column' }}>
                  <b className="small">{r.patient_name} · ⭐ {r.rating}</b>
                  <span className="small muted">{r.comment}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default DoctorProfile;
