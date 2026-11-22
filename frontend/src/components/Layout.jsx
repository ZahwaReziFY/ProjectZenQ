import { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuth } from '../context/AuthContext';
import { Sparkles } from 'lucide-react';
import { useLang } from '../i18n';

/**
 * Kerangka halaman: Navbar (sticky) + isi halaman. Welcome & Auth gak pake Layout
 * (tampil full screen sesuai mockup).
 * Tombol "Tanya AI" melayang di semua halaman pasien -> chatbot triase (fitur di rancangan proyek).
 */
function Layout() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Navbar />
      <Outlet />
      {user?.role === 'patient' && pathname !== '/chatbot' && (
        <button className="fab" onClick={() => navigate('/chatbot')} title={t('Cek gejala awal dengan AI')}>
          <Sparkles size={18} />{' '}{t('Tanya AI')}
        </button>
      )}
    </>
  );
}

export default Layout;
