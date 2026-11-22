import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import { cropSquare, fileToDataUrl } from '../utils/image';
import { Camera, Check, ChevronRight, Globe, KeyRound, LifeBuoy, LogOut, ReceiptText, Trash2, UserRound } from 'lucide-react';
import { LANGUAGES, useLang } from '../i18n';
import PasswordInput from '../components/PasswordInput';

const CONDITIONS = ['hipertensi', 'diabetes', 'asma', 'jantung', 'kehamilan', 'lansia'];

function Profile() {
  const { t, lang, setLang } = useLang();
  const [langOpen, setLangOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState(null);
  const [pwBusy, setPwBusy] = useState(false);
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoRef = useRef(null);
  const [form, setForm] = useState({
    name: user.name || '',
    phone: user.phone || '',
    birth_date: user.birth_date ? user.birth_date.slice(0, 10) : '',
    gender: user.gender || '',
    address: user.address || '',
    city: user.city || '',
    health_conditions: user.health_conditions || [],
  });

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });
  const toggle = (c) => setForm((f) => ({
    ...f,
    health_conditions: f.health_conditions.includes(c) ? f.health_conditions.filter((x) => x !== c) : [...f.health_conditions, c],
  }));

  const save = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/users/me', form);
      setUser(res.data);
      setMessage(t('Profil tersimpan.'));
      setEditing(false);
    } catch (err) {
      setMessage(err.message);
    }
  };

  // Foto profil: dipotong persegi (bagian tengah) + dikecilkan ke 400x400 di browser, lalu disimpan
  const changePhoto = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setPhotoBusy(true);
    setMessage('');
    try {
      const avatar = await cropSquare(await fileToDataUrl(f), 400);
      const res = await api.put('/users/me/avatar', { avatar });
      setUser(res.data);
      setMessage(t('Foto profil diperbarui.'));
    } catch (err) {
      setMessage(err.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    if (!window.confirm(t('Hapus foto profil?'))) return;
    try {
      const res = await api.put('/users/me/avatar', { avatar: null });
      setUser(res.data);
      setMessage(t('Foto profil dihapus.'));
    } catch (err) {
      setMessage(err.message);
    }
  };

  // Ganti kata sandi: wajib isi kata sandi lama (dicek backend pakai bcrypt)
  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pw.next !== pw.confirm) {
      setPwMsg({ ok: false, text: t('Konfirmasi kata sandi tidak sama.') });
      return;
    }
    setPwBusy(true);
    try {
      const res = await api.put('/users/me/password', { current_password: pw.current, new_password: pw.next });
      setPwMsg({ ok: true, text: res.message });
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) {
      setPwMsg({ ok: false, text: err.message });
    } finally {
      setPwBusy(false);
    }
  };

  const signOut = () => {
    logout();
    navigate('/auth');
  };

  return (
    <div className="wrap">
      <h1 className="title">{t('Profil')}</h1>
      <p className="sub">{t('Kelola akun dan pengaturan Anda.')}</p>
      <div className="split" style={{ '--cols': '360px 1fr' }}>
        <div className="card" style={{ textAlign: 'center', alignSelf: 'start' }}>
          <div className="avatar-edit">
            <Avatar name={user.name} size={120} src={user.avatar_url} style={{ margin: '0 auto' }} />
            <button className="avatar-cam" onClick={() => photoRef.current?.click()} disabled={photoBusy}
              aria-label={t('Ganti foto profil')} title={t('Ganti foto profil')}>
              <Camera size={18} />
            </button>
            <input ref={photoRef} type="file" accept="image/*" hidden onChange={changePhoto} />
          </div>
          {photoBusy && <div className="small muted">{t('Mengunggah foto…')}</div>}
          {user.avatar_url && !photoBusy && (
            <button className="link small" style={{ color: 'var(--red)', marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={removePhoto}>
              <Trash2 size={13} />{' '}{t('Hapus foto')}
            </button>
          )}
          <h2 style={{ marginTop: 14 }}>{user.name}</h2>
          <div className="muted small" style={{ marginBottom: 16 }}>{user.email}</div>
          <button className="btn block" onClick={() => setEditing(!editing)}>{editing ? t('Tutup') : t('Edit Profil')}</button>
          {message && <div className="toast">{message}</div>}
        </div>

        <div className="card">
          {editing ? (
            <form onSubmit={save}>
              <h3 style={{ marginBottom: 12 }}>{t('Detail Profil')}</h3>
              <div className="field"><label>{t('Nama')}</label><input value={form.name} onChange={update('name')} /></div>
              <div className="grid g2">
                <div className="field"><label>{t('No. HP')}</label><input value={form.phone} onChange={update('phone')} /></div>
                <div className="field"><label>{t('Tanggal lahir')}</label><input type="date" value={form.birth_date} onChange={update('birth_date')} /></div>
                <div className="field">
                  <label>{t('Jenis kelamin')}</label>
                  <select value={form.gender} onChange={update('gender')}>
                    <option value="">-</option><option value="male">{t('Laki-laki')}</option><option value="female">{t('Perempuan')}</option>
                  </select>
                </div>
                <div className="field"><label>{t('Kota / Kabupaten')}</label><input placeholder={t('Bantul, Daerah Istimewa Yogyakarta')} value={form.city} onChange={update('city')} /></div>
              </div>
              <div className="field"><label>{t('Alamat')}</label><textarea value={form.address} onChange={update('address')} /></div>
              {user.role === 'patient' && (
                <div className="field">
                  <label>{t('Kondisi kesehatan (buat rekomendasi edukasi)')}</label>
                  <div className="chips">
                    {CONDITIONS.map((c) => (
                      <button type="button" key={c} className={form.health_conditions.includes(c) ? 'on' : ''} onClick={() => toggle(c)}>{t(c)}</button>
                    ))}
                  </div>
                </div>
              )}
              <button className="btn">{t('Simpan')}</button>
            </form>
          ) : (
            <>
              <h3 style={{ marginBottom: 12 }}>{t('Profil')}</h3>
              <button className="listbtn" onClick={() => setEditing(true)}><span className="lic"><UserRound size={18} /></span>{t('Detail Profil')}<span className="go"><ChevronRight size={18} /></span></button>
              {user.role === 'patient' && (
                <button className="listbtn" onClick={() => navigate('/history')}><span className="lic"><ReceiptText size={18} /></span>{t('Riwayat Transaksi')}<span className="go"><ChevronRight size={18} /></span></button>
              )}
              <h3 style={{ margin: '20px 0 12px' }}>{t('Pengaturan')}</h3>
              <button className="listbtn" onClick={() => setLangOpen(!langOpen)} aria-expanded={langOpen}>
                <span className="lic"><Globe size={18} /></span>{t('Bahasa')}
                <span className="go muted" style={{ fontWeight: 500 }}>{LANGUAGES.find((l) => l.code === lang)?.label}{' '}<ChevronRight size={18} /></span>
              </button>
              {langOpen && (
                <div className="subpanel">
                  {LANGUAGES.map((l) => (
                    <button key={l.code} className={`langopt ${lang === l.code ? 'on' : ''}`} onClick={() => setLang(l.code)}>
                      <span className="langcode">{l.short}</span>{l.label}
                      {lang === l.code && <Check size={18} style={{ marginLeft: 'auto' }} />}
                    </button>
                  ))}
                </div>
              )}

              <button className="listbtn" onClick={() => { setPwOpen(!pwOpen); setPwMsg(null); }} aria-expanded={pwOpen}>
                <span className="lic"><KeyRound size={18} /></span>{t('Ganti Kata Sandi')}<span className="go"><ChevronRight size={18} /></span>
              </button>
              {pwOpen && (
                <form className="subpanel" onSubmit={changePassword}>
                  <div className="field"><label>{t('Kata sandi lama')}</label><PasswordInput required autoComplete="current-password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
                  <div className="field"><label>{t('Kata sandi baru')}</label><PasswordInput required minLength={8} autoComplete="new-password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
                  <div className="field"><label>{t('Ulangi kata sandi baru')}</label><PasswordInput required autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
                  <div className="small muted" style={{ marginBottom: 12 }}>{t('Minimal 8 karakter, mengandung huruf dan angka.')}</div>
                  <button className="btn sm" disabled={pwBusy}>{pwBusy ? t('Menyimpan…') : t('Simpan Kata Sandi')}</button>
                  {pwMsg && <div className={`toast ${pwMsg.ok ? '' : 'err'}`}>{pwMsg.text}</div>}
                </form>
              )}

              <button className="listbtn" onClick={() => navigate('/help')}><span className="lic"><LifeBuoy size={18} /></span>{t('Pusat Bantuan')}<span className="go"><ChevronRight size={18} /></span></button>
              <button className="listbtn" style={{ color: 'var(--red)', background: 'transparent' }} onClick={signOut}><span className="lic" style={{ background: '#FCE7E7', color: 'var(--red)' }}><LogOut size={18} /></span>{t('Keluar')}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;
