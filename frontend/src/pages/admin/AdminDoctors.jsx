import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import api from '../../utils/api';
import { useFetch } from '../../hooks/useFetch';
import Avatar from '../../components/Avatar';
import StateMessage from '../../components/StateMessage';
import { rp } from '../../utils/format';
import { useLang } from '../../i18n';
import PasswordInput from '../../components/PasswordInput';

const EMPTY = {
  name: '', email: '', phone: '', password: '', specialization: '', hospital: '', practice_hours: '',
  experience_years: '', consultation_fee: '', original_fee: '', home_visit_fee: '', accepts_home_visit: true, bio: '',
};

// Data dokter dari API -> isi form edit
const toForm = (d) => ({
  ...EMPTY,
  id: d.id,
  name: d.name || '',
  email: d.email || '',
  phone: d.phone || '',
  specialization: d.specialization || '',
  hospital: d.hospital || '',
  practice_hours: d.practice_hours || '',
  experience_years: d.experience_years ?? '',
  consultation_fee: d.consultation_fee ?? '',
  original_fee: d.original_fee ?? '',
  home_visit_fee: d.home_visit_fee ?? '',
  accepts_home_visit: d.accepts_home_visit !== false,
  bio: d.bio || '',
});

/** Kelola Dokter (admin): tambah, ubah, hapus. */
function AdminDoctors() {
  const { t } = useLang();
  const { data: doctors, loading, error, refetch } = useFetch('/doctors');
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const editing = Boolean(form.id);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const startEdit = (d) => {
    setForm(toForm(d));
    setMessage(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cancelEdit = () => { setForm(EMPTY); setMessage(null); };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      if (editing) {
        const { id, password, ...rest } = form;
        await api.put(`/admin/doctors/${id}`, password ? { ...rest, password } : rest);
        setMessage({ ok: true, text: t('Data {name} diperbarui.', { name: form.name }) });
      } else {
        await api.post('/admin/doctors', form);
        setMessage({ ok: true, text: t('Dokter ditambahkan.') });
      }
      setForm(EMPTY);
      refetch();
    } catch (err) {
      setMessage({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d) => {
    if (!window.confirm(t('Hapus {name} beserta akunnya?', { name: d.name }))) return;
    await api.delete(`/admin/doctors/${d.id}`);
    if (form.id === d.id) setForm(EMPTY);
    refetch();
  };

  return (
    <div className="wrap">
      <h1 className="title">{t('Kelola Dokter')}</h1>
      <p className="sub">{t('Tambah, ubah, dan hapus data dokter.')}</p>

      <form className={`card ${editing ? 'editing' : ''}`} onSubmit={submit} style={{ marginBottom: 22 }}>
        <div className="row" style={{ justifyContent: 'space-between', marginBottom: 14 }}>
          <h3>{editing ? t('Ubah data: {name}', { name: form.name }) : t('Tambah dokter baru')}</h3>
          {editing && <button type="button" className="iconb" aria-label={t('Batal ubah')} onClick={cancelEdit}><X size={18} /></button>}
        </div>
        <div className="grid g3" style={{ gap: '0 18px' }}>
          <div className="field"><label>{t('Nama')}</label><input required value={form.name} onChange={update('name')} placeholder={t('dr. Nama Dokter')} /></div>
          <div className="field"><label>{t('Email (untuk login)')}</label><input type="email" required value={form.email} onChange={update('email')} /></div>
          <div className="field">
            <label>{editing ? t('Password baru (kosongkan jika tidak diganti)') : t('Password awal')}</label>
            <PasswordInput required={!editing} minLength={8} value={form.password} onChange={update('password')} />
          </div>
          <div className="field"><label>{t('No. HP')}</label><input value={form.phone} onChange={update('phone')} placeholder={t('08xxxxxxxxxx')} /></div>
          <div className="field"><label>{t('Spesialisasi')}</label><input required value={form.specialization} onChange={update('specialization')} placeholder={t('Dokter Umum')} /></div>
          <div className="field"><label>{t('Pengalaman (tahun)')}</label><input type="number" min="0" value={form.experience_years} onChange={update('experience_years')} /></div>
          <div className="field"><label>{t('Tempat praktik')}</label><input value={form.hospital} onChange={update('hospital')} /></div>
          <div className="field"><label>{t('Jam praktik')}</label><input placeholder="07.00 - 18.00" value={form.practice_hours} onChange={update('practice_hours')} /></div>
          <div className="field"><label>{t('Biaya konsultasi (Rp)')}</label><input type="number" min="0" value={form.consultation_fee} onChange={update('consultation_fee')} /></div>
          <div className="field"><label>{t('Harga coret (Rp)')}</label><input type="number" min="0" value={form.original_fee} onChange={update('original_fee')} /></div>
          <div className="field"><label>{t('Biaya home visit (Rp)')}</label><input type="number" min="0" value={form.home_visit_fee} onChange={update('home_visit_fee')} /></div>
        </div>
        <div className="field"><label>{t('Profil singkat')}</label><textarea rows={2} style={{ minHeight: 70 }} value={form.bio} onChange={update('bio')} placeholder={t('Pengalaman dan keahlian dokter')} /></div>
        <label className="row" style={{ gap: 8, color: 'var(--text)' }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={form.accepts_home_visit} onChange={update('accepts_home_visit')} />
          {t('Menerima home visit')}
        </label>
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn" disabled={saving}>
            {editing ? <Pencil size={16} /> : <Plus size={16} />} {saving ? t('Menyimpan…') : editing ? t('Simpan Perubahan') : t('Tambah Dokter')}
          </button>
          {editing && <button type="button" className="btn ghost" onClick={cancelEdit}>{t('Batal')}</button>}
        </div>
        {message && <div className={`toast ${message.ok ? '' : 'err'}`}>{message.text}</div>}
      </form>

      <StateMessage loading={loading} error={error} />
      {doctors && (
        <div className="card" style={{ overflowX: 'auto', padding: '8px 18px' }}>
          <table className="table">
            <thead><tr><th>{t('Dokter')}</th><th>{t('Spesialisasi')}</th><th>{t('Tempat')}</th><th>{t('Konsultasi')}</th><th>{t('Home visit')}</th><th style={{ textAlign: 'right' }}>{t('Aksi')}</th></tr></thead>
            <tbody>
              {doctors.map((d) => (
                <tr key={d.id} className={form.id === d.id ? 'row-on' : ''}>
                  <td>
                    <div className="row" style={{ gap: 10 }}>
                      <Avatar name={d.name} src={d.avatar_url} size={38} />
                      <div><b>{d.name}</b><div className="small muted">{d.email}</div></div>
                    </div>
                  </td>
                  <td>{t(d.specialization)}</td>
                  <td>{d.hospital || '-'}</td>
                  <td>{rp(d.consultation_fee)}</td>
                  <td>{d.accepts_home_visit ? rp(d.home_visit_fee) : t('Tidak')}</td>
                  <td>
                    <div className="row" style={{ gap: 6, justifyContent: 'flex-end' }}>
                      <button className="iconb" title={t('Ubah')} aria-label={t('Ubah {name}', { name: d.name })} onClick={() => startEdit(d)}><Pencil size={16} /></button>
                      <button className="iconb danger" title={t('Hapus')} aria-label={t('Hapus {name}', { name: d.name })} onClick={() => remove(d)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default AdminDoctors;
