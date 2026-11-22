import { useNavigate } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useLang } from '../i18n';

function NotFound() {
  const { t } = useLang();
  const navigate = useNavigate();
  return (
    <div className="wrap">
      <div className="card center-msg">
        <span className="em"><Compass size={48} /></span>
        <h1 className="title">{t('Halaman tidak ditemukan')}</h1>
        <p className="muted">{t('Alamat yang kamu buka tidak tersedia.')}</p>
        <button className="btn" onClick={() => navigate('/home')}>{t('Ke Beranda')}</button>
      </div>
    </div>
  );
}

export default NotFound;
