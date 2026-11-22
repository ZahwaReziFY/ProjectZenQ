import { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import Avatar from './Avatar';
import Logo from './Logo';
import { Bell, LifeBuoy, LogOut, Siren, UserRound } from 'lucide-react';
import { useLang } from '../i18n';
import LangSwitch from './LangSwitch';

// Menu per role - nambah menu cukup nambah 1 baris di sini.
// Profil & Notifikasi gak di sini lagi: udah digabung jadi 1 ikon avatar di kanan (lihat ProfileMenu).
const MENUS = {
  guest: [['/home', 'Beranda'], ['/doctors', 'Dokter'], ['/education', 'Edukasi']],
  patient: [
    ['/home', 'Beranda'], ['/doctors', 'Dokter'], ['/home-visit', 'Home Visit'], ['/scan', 'Scan Obat'],
    ['/education', 'Edukasi'], ['/history', 'Riwayat'],
  ],
  doctor: [['/doctor', 'Dashboard']],
  admin: [
    ['/admin', 'Dashboard'], ['/admin/doctors', 'Dokter'], ['/admin/articles', 'Konten'],
    ['/admin/orders', 'Pesanan'],
  ],
};

// Halaman turunan yang nyalain menu induknya (misal profil dokter -> "Dokter")
// Beranda tiap role (tujuan klik logo)
export const HOME_BY_ROLE = { patient: '/home', doctor: '/doctor', admin: '/admin' };

const PARENT = [
  [/^\/doctor\/visits/, '/doctor'],
  [/^\/education\//, '/education'],
  [/^\/consultations/, '/doctors'],
  [/^\/orders/, '/history'],
];

/**
 * Ikon avatar di kanan navbar = gabungan menu Profil + Notifikasi.
 * - Titik merah berisi angka = jumlah notifikasi belum dibaca
 * - Diklik -> muncul dropdown: Profil, Notifikasi, Keluar
 */
function ProfileMenu({ user, unread }) {
  const { t } = useLang();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const hasNotif = user.role !== 'admin'; // admin gak punya halaman notifikasi

  // Tutup dropdown kalau klik di luar, atau pindah halaman
  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const active = pathname.startsWith('/profile') || pathname.startsWith('/notifications');

  return (
    <div className="pmenu" ref={ref}>
      <button
        className={`pmenu-btn${active ? ' on' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={t('Profil dan notifikasi')}
        title={t('Profil & Notifikasi')}
      >
        <Avatar name={user.name} src={user.avatar_url} size={38} />
        {hasNotif && unread > 0 && <span className="pmenu-dot">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <div className="pmenu-drop">
          <div className="pmenu-head">
            <b>{user.name}</b>
            <span className="small muted">{user.email}</span>
          </div>
          <button onClick={() => navigate('/profile')}><UserRound size={17} />{' '}{t('Profil')}</button>
          <button onClick={() => navigate('/help')}><LifeBuoy size={17} />{' '}{t('Pusat Bantuan')}</button>
          {hasNotif && (
            <button onClick={() => navigate('/notifications')}>
              <Bell size={17} />{' '}{t('Notifikasi')}
              {unread > 0 && <span className="badge">{unread}</span>}
            </button>
          )}
          <button
            className="danger"
            onClick={() => {
              logout();
              navigate('/auth');
            }}
          >
            <LogOut size={17} />{' '}{t('Keluar')}
          </button>
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const { t } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: notif } = useFetch(user ? `/notifications?_=${pathname}` : null);
  const menus = MENUS[user?.role || 'guest'];
  const parent = PARENT.find(([re]) => re.test(pathname))?.[1];

  return (
    <div className="nav">
      <div className="nav-in">
        <div className="brand" onClick={() => navigate(user ? HOME_BY_ROLE[user.role] || '/home' : '/')}>
          <Logo size={34} /> ZenQ
        </div>
        <div className="links">
          {menus.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/admin'}>
              {({ isActive }) => <button className={isActive || parent === to ? 'on' : ''}>{t(label)}</button>}
            </NavLink>
          ))}
        </div>
        <LangSwitch />
        {!user && <button className="btn sm" onClick={() => navigate('/auth')}>{t('Masuk')}</button>}
        <button className="sos" onClick={() => navigate('/emergency')}><Siren size={16} />{' '}{t('Darurat')}</button>
        {user && <ProfileMenu user={user} unread={notif?.unread || 0} />}
      </div>
    </div>
  );
}

export default Navbar;
