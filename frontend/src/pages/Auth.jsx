import { useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n';
import LangSwitch from '../components/LangSwitch';
import PasswordInput from '../components/PasswordInput';

const HOME_BY_ROLE = { admin: '/admin', doctor: '/doctor', patient: '/home' };

/** Login & Daftar dalam 1 halaman (sesuai mockup). /auth?mode=daftar buat langsung ke form daftar. */
function Auth() {
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  const isLogin = params.get('mode') !== 'daftar';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const switchMode = () => {
    setError('');
    setParams(isLogin ? { mode: 'daftar' } : {});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!isLogin && form.password !== form.confirm) {
      setError(t('Konfirmasi kata sandi tidak sama.'));
      return;
    }
    setSubmitting(true);
    try {
      const user = isLogin
        ? await login(form.email, form.password)
        : await register({ name: form.name, email: form.email, password: form.password });
      navigate(location.state?.from || HOME_BY_ROLE[user.role] || '/home', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="full">
      <div className="left">
        <Logo size={90} />
        <h2 style={{ fontSize: 32 }}>{isLogin ? t('Selamat datang kembali') : t('Mulai bersama ZenQ')}</h2>
        <p style={{ maxWidth: 380, margin: 0, opacity: 0.92 }}>
          {t('Konsultasi dokter, panggil dokter ke rumah, dan temukan fasilitas kesehatan terdekat.')}
        </p>
      </div>
      <div className="right" style={{ position: 'relative' }}>
        <LangSwitch className="corner" />
        <form className="formbox" onSubmit={handleSubmit}>
          <h2 style={{ fontSize: 28, marginBottom: 22, color: 'var(--brand-d)' }}>
            {isLogin ? t('Selamat Datang') : t('Daftar Sekarang')}
          </h2>
          {!isLogin && (
            <div className="field">
              <label>{t('Nama Lengkap')}</label>
              <input required placeholder={t('Nama lengkap')} value={form.name} onChange={update('name')} />
            </div>
          )}
          <div className="field">
            <label>{t('Alamat Email')}</label>
            <input type="email" required placeholder={t('nama@email.com')} value={form.email} onChange={update('email')} />
          </div>
          <div className="field">
            <label>{t('Kata Sandi')}</label>
            <PasswordInput required minLength={isLogin ? undefined : 8} placeholder={t('Kata sandi')}
              value={form.password} onChange={update('password')} />
            {!isLogin && <div className="small muted" style={{ marginTop: 6 }}>{t('Minimal 8 karakter, mengandung huruf dan angka.')}</div>}
          </div>
          {isLogin ? (
            <div style={{ textAlign: 'right', margin: '-6px 0 16px' }}>
              <button type="button" className="link" style={{ fontWeight: 500 }}
                onClick={() => setInfo(t('Fitur reset kata sandi belum tersedia. Hubungi admin.'))}>
                {t('Lupa Kata Sandi?')}
              </button>
            </div>
          ) : (
            <div className="field">
              <label>{t('Konfirmasi Kata Sandi')}</label>
              <PasswordInput required placeholder={t('Konfirmasi kata sandi')} value={form.confirm} onChange={update('confirm')} />
            </div>
          )}

          {error && <div className="toast err" style={{ marginBottom: 12 }}>{error}</div>}

          <button className="btn block" style={{ marginTop: 6 }} disabled={submitting}>
            {submitting ? t('MEMPROSES…') : isLogin ? t('MASUK') : t('DAFTAR')}
          </button>

          {info && <div className="toast" style={{ background: 'var(--soft)', color: 'var(--text)', marginTop: 12 }}>{info}</div>}

          <p className="small muted" style={{ textAlign: 'center', marginTop: 18 }}>
            {isLogin ? t('Belum memiliki akun?') : t('Sudah memiliki akun?')}{' '}
            <button type="button" className="link" onClick={switchMode}>{isLogin ? t('Daftar') : t('Login')}</button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Auth;
