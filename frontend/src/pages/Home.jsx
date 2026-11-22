import { Navigate, useNavigate } from 'react-router-dom';
import { Ambulance, BookOpen, House, MapPin, ScanLine, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import AdBanner from '../components/AdBanner';
import DoctorCard from '../components/DoctorCard';
import StateMessage from '../components/StateMessage';
import { useLang } from '../i18n';

const SERVICES = [
  [Stethoscope, 'Konsultasi', 'Chat, telepon, atau video call dengan dokter', '/doctors'],
  [House, 'Home Visit', 'Dokter datang ke rumah sesuai jadwal', '/home-visit'],
  [ScanLine, 'Scan Obat', 'Kenali obat dari foto kemasannya', '/scan'],
  [BookOpen, 'Edukasi', 'Berita dan tips kesehatan terbaru', '/education'],
];

function Home() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: doctors, loading, error } = useFetch('/doctors?home_visit=true&limit=3');

  // Beranda ini khusus pasien/tamu. Dokter & admin punya dashboard sendiri.
  if (user?.role === 'doctor') return <Navigate to="/doctor" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;

  return (
    <div className="wrap">
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 24 }}>{t('Halo')}{user ? `, ${user.name.split(' ')[0]}` : ''}</h2>
        {user?.city && <span className="small muted row" style={{ gap: 5 }}><MapPin size={15} /> {user.city}</span>}
      </div>

      <AdBanner />

      <div className="sosbar">
        <div className="ic"><Ambulance size={24} /></div>
        <div style={{ flex: 1 }}>
          <b>{t('Keadaan darurat?')}</b>
          <div className="small muted">{t('Cari rumah sakit terdekat dan ajukan ambulans')}</div>
        </div>
        <button className="btn sm" style={{ background: 'var(--red)', boxShadow: 'none' }} onClick={() => navigate('/emergency')}>
          {t('Cari Sekarang')}
        </button>
      </div>

      <div className="sec"><h2>{t('Layanan Kesehatan')}</h2></div>
      <div className="grid services">
        {SERVICES.map(([Icon, label, desc, to]) => (
          <button key={to} className="tile" onClick={() => navigate(to)}>
            <span className="em"><Icon size={24} /></span>
            <span><b>{t(label)}</b><small>{t(desc)}</small></span>
          </button>
        ))}
      </div>

      <div className="sec">
        <div>
          <h2>{t('Tenaga Medis Siap Berkunjung')}</h2>
          <div className="muted small">{t('Dokter dan perawat terdekat yang siap datang ke rumah')}</div>
        </div>
        <button className="btn ghost sm" onClick={() => navigate('/doctors')}>{t('Lihat semua')}</button>
      </div>
      <StateMessage loading={loading} error={error} />
      <div className="grid g3">
        {doctors?.map((d) => <DoctorCard key={d.id} doctor={d} />)}
      </div>
    </div>
  );
}

export default Home;
