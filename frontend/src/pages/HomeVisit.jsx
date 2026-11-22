import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { rp } from '../utils/format';
import { useLang } from '../i18n';

const today = () => new Date().toISOString().slice(0, 10);

function HomeVisit() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const { data: doctors } = useFetch('/doctors?home_visit=true');

  const [form, setForm] = useState({
    doctor_id: params.get('doctor') || '',
    date: today(),
    time: '20:00',
    address: user?.address || '',
    complaint: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Default pilih dokter pertama yang sedang ONLINE kalo belum dipilih
  useEffect(() => {
    const firstOnline = doctors?.find((d) => d.is_online);
    if (!form.doctor_id && firstOnline) setForm((f) => ({ ...f, doctor_id: String(firstOnline.id) }));
  }, [doctors, form.doctor_id]);

  // Dokter offline gak bisa dipesan (backend juga menolak)
  const selected = doctors?.find((d) => String(d.id) === String(form.doctor_id));
  const selectedOffline = Boolean(selected && !selected.is_online);
  const noneOnline = Boolean(doctors && !doctors.some((d) => d.is_online));

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async () => {
    setError('');
    if (!form.address.trim()) {
      setError(t('Isi alamat kunjungan terlebih dahulu.'));
      return;
    }
    setBusy(true);
    try {
      const res = await api.post('/orders', {
        kind: 'home_visit',
        doctor_id: Number(form.doctor_id),
        scheduled_at: new Date(`${form.date}T${form.time}`).toISOString(),
        address: form.address,
        complaint: form.complaint,
      });
      navigate(`/checkout/${res.data.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="wrap">
      <h1 className="title">{t('Panggil Dokter (Home Visit)')}</h1>
      <p className="sub">{t('Pesan dokter ke rumah. Pilih jadwal dan spesialisasi, lalu lanjut ke pembayaran.')}</p>
      <div className="split">
        <div className="card">
          <div className="field">
            <label>{t('Pilih Dokter')}</label>
            <select value={form.doctor_id} onChange={update('doctor_id')}>
              {!form.doctor_id && <option value="">{t('Pilih dokter')}</option>}
              {doctors?.map((d) => (
                <option key={d.id} value={d.id} disabled={!d.is_online}>
                  {d.name} – {t(d.specialization)} ({rp(d.home_visit_fee)}){d.is_online ? '' : t(' · offline')}
                </option>
              ))}
            </select>
            {selectedOffline && <div className="small" style={{ color: 'var(--red)', marginTop: 6 }}>{selected.name}{' '}{t('sedang offline. Pilih dokter lain yang online.')}</div>}
            {noneOnline && <div className="small" style={{ color: 'var(--red)', marginTop: 6 }}>{t('Belum ada dokter home visit yang online saat ini. Coba lagi nanti.')}</div>}
          </div>
          <div className="grid g2">
            <div className="field"><label>{t('Tanggal')}</label><input type="date" min={today()} value={form.date} onChange={update('date')} /></div>
            <div className="field"><label>{t('Jam')}</label><input type="time" value={form.time} onChange={update('time')} /></div>
          </div>
          <div className="field"><label>{t('Alamat kunjungan')}</label><input placeholder={t('Alamat lengkap')} value={form.address} onChange={update('address')} /></div>
          <div className="field"><label>{t('Keluhan')}</label><textarea placeholder={t('Ceritakan keluhan Anda...')} value={form.complaint} onChange={update('complaint')} /></div>
          <button className="btn block" onClick={submit} disabled={busy || !form.doctor_id || selectedOffline}>
            {busy ? t('Memproses…') : t('Lanjut ke Pembayaran')}
          </button>
          {error && <div className="toast err">{error}</div>}
        </div>

        <div className="card" style={{ background: 'var(--soft)' }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>{t('Cara kerja')}</h2>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
            <li>{t('Pilih dokter dan jadwal kunjungan')}</li>
            <li>{t('Bayar via transfer bank atau QR')}</li>
            <li>{t('Dokter berangkat, status dipantau di halaman Riwayat')}</li>
            <li>{t('Pemeriksaan di rumah dan hasil masuk ke riwayat')}</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default HomeVisit;
