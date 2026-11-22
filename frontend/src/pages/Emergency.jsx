import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { useGeolocation } from '../hooks/useGeolocation';
import FacilityMap from '../components/FacilityMap';
import { FACILITY_LABEL } from '../utils/format';
import { Ambulance, ChevronRight, Hospital, Navigation, Phone, Siren } from 'lucide-react';
import { useLang } from '../i18n';

// Titik default kalo izin lokasi ditolak (Bantul, DIY)
const DEFAULT_CENTER = { lat: -7.888, lng: 110.329 };

/** Halaman darurat - sengaja bisa diakses TANPA login. */
function Emergency() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { coords, status: geoStatus, error: geoError, locate } = useGeolocation();
  const { data: contacts } = useFetch('/emergency/contacts');
  const [result, setResult] = useState({ source: '', items: [] });
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [request, setRequest] = useState(null);

  useEffect(() => {
    locate();
  }, [locate]);

  const center = useMemo(() => coords || DEFAULT_CENTER, [coords]);
  const ready = geoStatus === 'ok' || geoStatus === 'error';

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    api.get(`/emergency/nearby?lat=${center.lat}&lng=${center.lng}&radius_km=10`)
      .then((res) => setResult(res.data))
      .catch(() => setResult({ source: '', items: [] }))
      .finally(() => setLoading(false));
  }, [center, ready]);

  const onSelect = useCallback((f) => setSelectedId(f.id), []);
  const directions = (f) => `https://www.google.com/maps/dir/?api=1&destination=${f.latitude},${f.longitude}`;

  const requestAmbulance = async () => {
    if (!user) {
      navigate('/auth', { state: { from: '/emergency' } });
      return;
    }
    try {
      const res = await api.post('/emergency/ambulance-request', { place: user.address || `${center.lat}, ${center.lng}` });
      setRequest({ ok: true, text: res.message, id: res.data.id });
    } catch (err) {
      setRequest({ ok: false, text: err.message });
    }
  };

  const facilities = result.items || [];
  const selected = facilities.find((f) => f.id === selectedId);

  return (
    <div className="wrap">
      <h1 className="title" style={{ color: 'var(--brand-d)' }}>{t('Gawat Darurat')}</h1>
      <p className="sub">{t('Temukan rumah sakit terdekat dan hubungi ambulans dengan cepat.')}</p>

      {geoError && <div className="toast err" style={{ marginTop: 0, marginBottom: 16 }}>{geoError}{' '}{t('Menampilkan area Bantul.')}</div>}

      <div className="split" style={{ '--cols': '1.4fr 1fr' }}>
        <div className="map">
          <FacilityMap center={center} facilities={facilities} selectedId={selectedId} onSelect={onSelect} />
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 12 }}>{t('Rumah sakit terdekat')}</h3>
          {(!ready || loading) && <p className="muted small">{t('Mencari fasilitas kesehatan…')}</p>}
          {ready && !loading && !facilities.length && <p className="muted small">{t('Tidak ada data faskes di sekitar lokasi ini.')}</p>}
          {facilities.slice(0, 6).map((f) => (
            <button key={f.id} className={`listbtn ${selectedId === f.id ? 'on' : ''}`} onClick={() => setSelectedId(f.id)}>
              <span className="lic"><Hospital size={19} /></span><span><b>{f.name}</b><br /><span className="small muted">{FACILITY_LABEL[f.type]} · {f.distance_km}{' '}{t('km')}</span></span>
              <span className="go"><ChevronRight size={18} /></span>
            </button>
          ))}
          {selected && (
            <div className="row" style={{ marginBottom: 10, flexWrap: 'wrap' }}>
              <a className="btn sm" href={directions(selected)} target="_blank" rel="noreferrer"><Navigation size={15} />{' '}{t('Rute ke')}{' '}{selected.name}</a>
              {selected.phone && <a className="btn ghost sm" href={`tel:${selected.phone}`}><Phone size={15} /> {selected.phone}</a>}
            </div>
          )}

          <h3 style={{ margin: '20px 0 12px' }}>{t('Kontak Ambulans')}</h3>
          {/* Kontak cuma ditampilkan (tanpa tombol hubungi) */}
          {contacts?.map((c) => (
            <div key={c.id} className="contact">
              <span className="lic"><Ambulance size={20} /></span>
              <div>
                <div className="small muted">{c.name}</div>
                <div className="num">{c.phone}</div>
              </div>
            </div>
          ))}

          {/* Pengajuan ambulans cuma untuk pasien (dokter & admin gak perlu) */}
          {(!user || user.role === 'patient') && (
            <button className="btn dark block" style={{ background: 'var(--red)', marginTop: 6 }} onClick={requestAmbulance}>
              <Siren size={18} />{' '}{t('Ajukan Panggil Ambulans')}
            </button>
          )}
          {request && (
            <div className={`toast ${request.ok ? '' : 'err'}`}>
              {request.text}
              {request.id && <> <button className="link" onClick={() => navigate(`/orders/${request.id}`)}>{t('Lihat status')}</button></>}
            </div>
          )}

          <p className="small muted" style={{ marginBottom: 0 }}>
            {result.source === 'openstreetmap' ? t('Data faskes dari © OpenStreetMap contributors. ') : t('Data faskes demo. ')}
            {t('Pengajuan ambulans adalah simulasi; integrasi resmi SatuSehat/119 di luar lingkup proyek.')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Emergency;
