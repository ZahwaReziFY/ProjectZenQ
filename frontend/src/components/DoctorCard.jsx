import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import { rp } from '../utils/format';
import { MapPin, Star } from 'lucide-react';
import { useLang } from '../i18n';

// Kartu dokter (dipake di Beranda & Rekomendasi Dokter)
function DoctorCard({ doctor: d }) {
  const { t } = useLang();
  const navigate = useNavigate();
  return (
    <div className="card docc">
      <Avatar name={d.name} size={64} src={d.avatar_url} />
      <div className="meta">
        <b>{d.name}</b>{' '}
        {d.is_online
          ? <span className="chip green" style={{ marginLeft: 4 }}>{t('Online')}</span>
          : <span className="chip">{t('Offline')}</span>}
        <div className="small muted">{t(d.specialization)} · {d.experience_years}{' '}{t('tahun')}</div>
        <div className="small muted row" style={{ gap: 5 }}><MapPin size={14} /> {d.hospital}</div>
        <div style={{ margin: '4px 0 10px' }}>
          <span className="price">{rp(d.consultation_fee)}</span>
          {d.original_fee > d.consultation_fee && <span className="old">{rp(d.original_fee)}</span>}
          <span className="small" style={{ marginLeft: 8, color: 'var(--gold)', fontWeight: 700 }}><Star size={13} fill="currentColor" style={{ verticalAlign: '-2px' }} /> {d.rating}</span>
        </div>
        <button className="btn dark sm" onClick={() => navigate(`/doctors/${d.id}`)}>{t('Lihat Profil')}</button>
      </div>
    </div>
  );
}

export default DoctorCard;
