import { Navigate, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import HealthBadge from '../components/HealthBadge';
import { useAuth } from '../context/AuthContext';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { Siren } from 'lucide-react';
import { useLang } from '../i18n';
import LangSwitch from '../components/LangSwitch';

function Welcome() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { status } = useHealthCheck();

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : user.role === 'doctor' ? '/doctor' : '/home'} replace />;

  return (
    <div className="full">
      <div className="left">
        <Logo size={110} />
        <h1 style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-.03em' }}>ZenQ</h1>
        <p style={{ fontSize: 20, margin: 0 }}>{t('With ZenQ, We Care')}</p>
        <p style={{ maxWidth: 420, opacity: 0.9, margin: 0 }}>
          {t('Layanan kesehatan publik digital: konsultasi dokter, home visit, layanan darurat, scan obat, dan edukasi kesehatan dalam satu platform web.')}
        </p>
      </div>
      <div className="right" style={{ position: 'relative' }}>
        <LangSwitch className="corner" />
        <div className="formbox" style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 32, marginBottom: 10 }}>{t('Selamat Datang di ZenQ')}</h2>
          <p className="muted" style={{ marginBottom: 28 }}>
            {t('Akses layanan kesehatan lebih mudah, cepat, dan terjangkau dari laptop maupun HP Anda.')}
          </p>
          <button className="btn block" onClick={() => navigate('/auth')}>{t('LANJUTKAN')}</button>
          <button className="btn ghost block" style={{ marginTop: 12 }} onClick={() => navigate('/emergency')}>
            <Siren size={16} style={{ verticalAlign: '-3px' }} />{' '}{t('Butuh bantuan darurat?')}
          </button>
          {import.meta.env.DEV && <div style={{ marginTop: 24 }}><HealthBadge status={status} /></div>}
        </div>
      </div>
    </div>
  );
}

export default Welcome;
