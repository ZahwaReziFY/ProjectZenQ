import { useMemo, useRef, useState } from 'react';
import api from '../utils/api';
import { compressImage } from '../utils/image';
import { readTextFromImage } from '../utils/ocr';
import { useCamera } from '../hooks/useCamera';
import { useFetch } from '../hooks/useFetch';
import { BadgeCheck, Camera, ExternalLink, Image as ImageIcon, RotateCcw, ScanLine, ShieldCheck, ShieldQuestion, Smartphone, Sparkles } from 'lucide-react';
import { useLang } from '../i18n';

// Badge verifikasi (status dari backend: data.verification)
const BPOM_BADGE = {
  verified: { text: 'Terverifikasi BPOM', ok: true },
  registered: { text: 'Terdaftar BPOM', ok: true },
  demo: { text: 'Terdaftar BPOM (data demo)', ok: true },
  unverified: { text: 'Belum terverifikasi BPOM', ok: false },
};
const HALAL_BADGE = {
  certified: { text: 'Terverifikasi Halal', ok: true },
  logo: { text: 'Logo Halal di kemasan', ok: true },
  not_certified: { text: 'Belum bersertifikat halal', ok: false },
  unknown: { text: 'Status halal belum diverifikasi', ok: false },
};
const BPOM_SOURCE = {
  api: 'Dikonfirmasi data BPOM',
  kemasan: 'Nomor terbaca di kemasan',
  database: 'Tercatat di database ZenQ',
};
const HALAL_SOURCE = {
  kemasan: 'Logo terdeteksi di foto kemasan',
};

function VerifyBadges({ v }) {
  const { t } = useLang();
  if (!v) return null;
  const b = BPOM_BADGE[v.bpom?.status] || BPOM_BADGE.unverified;
  const h = HALAL_BADGE[v.halal?.status] || HALAL_BADGE.unknown;
  const BIcon = b.ok ? ShieldCheck : ShieldQuestion;
  return (
    <div className="verify">
      <div className="verify-row">
        <span className={`vbadge ${b.ok ? 'ok' : ''}`}><BIcon size={16} />{t(b.text)}</span>
        <span className={`vbadge ${h.ok ? 'ok halal' : ''}`}><BadgeCheck size={16} />{t(h.text)}</span>
      </div>
      <div className="verify-meta small muted">
        {v.bpom?.nie && <span>{t('NIE')}: <b>{v.bpom.nie}</b>{BPOM_SOURCE[v.bpom.source] && ` · ${t(BPOM_SOURCE[v.bpom.source])}`}</span>}
        {v.halal?.cert && <span>{t('Sertifikat halal')}: <b>{v.halal.cert}</b></span>}
        {v.halal?.status === 'logo' && <span>{t(HALAL_SOURCE.kemasan)}</span>}
      </div>
      <div className="verify-links small">
        <a href="https://cekbpom.pom.go.id" target="_blank" rel="noreferrer">{t('Cek di BPOM')} <ExternalLink size={13} /></a>
        <a href="https://bpjph.halal.go.id" target="_blank" rel="noreferrer">{t('Cek sertifikat halal')} <ExternalLink size={13} /></a>
      </div>
    </div>
  );
}

const SOURCE_LABEL = {
  gemini: 'Dibaca dengan Gemini AI',
  tesseract: 'Dibaca dengan OCR cadangan (tesseract)',
};

/**
 * Alur scan:
 *  1. Foto (kamera / galeri) diperkecil (utils/image.js)
 *  2. Foto dikirim ke POST /medicines/scan  -> backend minta GEMINI membaca kemasan
 *  3. Kalau Gemini gagal (needs_client_ocr = true) -> tesseract.js di browser (utils/ocr.js)
 *     membaca foto, lalu teksnya dikirim lagi ke POST /medicines/scan
 *  4. Hasil: info obat dari database. Kalau tetap gagal, user bisa ketik nama obat manual.
 */
function MedicineScan() {
  const { t } = useLang();
  const cam = useCamera();
  const galleryRef = useRef(null);
  const nativeCamRef = useRef(null);

  const [photo, setPhoto] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | gemini | ocr | matching | done
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [manual, setManual] = useState('');
  const [error, setError] = useState('');

  // Daftar kata nama obat dari database, dipakai OCR cadangan buat tahu kapan boleh berhenti
  const { data: medicines } = useFetch('/medicines');
  const knownWords = useMemo(() => {
    const words = (medicines || []).flatMap((x) => [x.name, x.generic_name, ...(x.keywords || [])]);
    return [...new Set(words.join(' ').toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 5))];
  }, [medicines]);
  const isGood = (text) => knownWords.some((w) => text.toLowerCase().includes(w));

  const sendText = async (text) => {
    const body = new FormData();
    body.append('text', text || '-');
    return api.post('/medicines/scan', body);
  };

  // Jalur foto: Gemini dulu, tesseract kalau Gemini gagal
  const scanPhoto = async (dataUrl) => {
    setError('');
    setResult(null);
    try {
      setPhase('gemini');
      const body = new FormData();
      body.append('image', await compressImage(dataUrl), 'kemasan.jpg');
      const res = await api.post('/medicines/scan', body);

      if (!res.data.needs_client_ocr) {
        setResult({ ...res.data, message: res.message, fromPhoto: true, source: 'gemini' });
        return;
      }

      // Gemini gagal -> OCR cadangan di browser
      setPhase('ocr');
      setProgress(0);
      let text = '';
      try {
        text = await readTextFromImage(dataUrl, { onProgress: setProgress, isGood });
      } catch {
        setError(t('Gemini dan OCR cadangan sama-sama gagal membaca foto. Ketik nama obat di bawah.'));
        return;
      }
      setPhase('matching');
      const res2 = await sendText(text);
      setResult({
        ...res2.data,
        message: res2.message,
        fromPhoto: true,
        source: 'tesseract',
        gemini_error: res.data.ocr_error,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setPhase('done');
    }
  };

  // Jalur ketik manual
  const searchManual = async (e) => {
    e.preventDefault();
    if (!manual.trim()) return;
    setError('');
    setResult(null);
    setPhase('matching');
    try {
      const res = await sendText(manual.trim());
      setResult({ ...res.data, message: res.message });
    } catch (err) {
      setError(err.message);
    } finally {
      setPhase('done');
    }
  };

  const handlePhoto = (dataUrl) => {
    setPhoto(dataUrl);
    scanPhoto(dataUrl);
  };

  const onFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => handlePhoto(ev.target.result);
    reader.readAsDataURL(f);
  };

  const reset = () => {
    cam.close();
    setPhoto(null);
    setResult(null);
    setError('');
    setPhase('idle');
  };

  // ----- panel kiri -----
  let left;
  if (cam.active) {
    left = (
      <div className="drop">
        <video ref={cam.videoRef} autoPlay playsInline muted />
        <div className="row">
          <button className="btn" onClick={() => handlePhoto(cam.snap())}><Camera size={17} />{' '}{t('Ambil Foto')}</button>
          <button className="btn ghost" onClick={reset}>{t('Batal')}</button>
        </div>
      </div>
    );
  } else if (photo) {
    left = (
      <div className="drop">
        <img src={photo} alt={t('Foto kemasan obat')} />
        <div className="row"><button className="btn ghost" onClick={reset}><RotateCcw size={17} />{' '}{t('Scan Ulang')}</button></div>
      </div>
    );
  } else {
    left = (
      <div className="drop">
        <div className="tile" style={{ padding: 0, border: 0, background: 'none' }}><span className="em" style={{ width: 72, height: 72, borderRadius: 22 }}><ScanLine size={34} /></span></div>
        <b>{t('Pindai kemasan obat')}</b>
        <span className="muted small">{t('Pilih cara memasukkan gambar')}</span>
        <div className="row" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn" onClick={cam.open}><Camera size={17} />{' '}{t('Buka Kamera')}</button>
          <button className="btn ghost" onClick={() => galleryRef.current?.click()}><ImageIcon size={17} />{' '}{t('Pilih dari Galeri')}</button>
        </div>
        {cam.error && (
          <div className="toast err small" style={{ maxWidth: 420 }}>
            {cam.error}
            <br />
            <button className="btn sm" style={{ marginTop: 8 }} onClick={() => nativeCamRef.current?.click()}><Smartphone size={15} />{' '}{t('Kamera Bawaan Perangkat')}</button>
          </div>
        )}
      </div>
    );
  }

  // ----- panel kanan -----
  const m = result?.medicine;
  const d = result?.detected;
  const busy = ['gemini', 'ocr', 'matching'].includes(phase);
  let right;
  if (busy) {
    const busyText = {
      gemini: t('Gemini AI sedang membaca kemasan…'),
      ocr: t('Membaca dengan OCR cadangan… {progress}%', { progress }),
      matching: t('Mencocokkan data obat…'),
    }[phase];
    right = <p className="muted">⏳ {busyText}</p>;
  } else if (m) {
    // Cocok lewat zat aktif saja -> nama produk = merek yang terbaca, info dari obat sejenis
    const similar = m.matched_by === 'ingredients' && d?.product_name;
    right = (
      <>
        <VerifyBadges v={result.verification} />
        <div className="kv">
          <span>{t('Nama Produk')}</span><b>{similar ? `${d.product_name}${d.strength ? ` ${d.strength}` : ''}` : m.name}</b>
          {similar && <><span>{t('Info dari obat sejenis')}</span><span>{m.name} <span className="small muted">({t('zat aktif sama')})</span></span></>}
          {m.generic_name && <><span>{t('Zat aktif')}</span><span>{m.generic_name}</span></>}
          <span>{t('Kategori')}</span><span>{m.category}</span>
          <span>{t('Dosis dewasa')}</span><span>{m.dosage}</span>
          <span>{t('Efek samping')}</span><span>{m.side_effects}</span>
          <span>{t('Interaksi')}</span><span>{m.interactions}</span>
          <span>{t('Kontraindikasi')}</span><span>{m.contraindications}</span>
          {d?.manufacturer && <><span>{t('Produsen')}</span><span>{d.manufacturer}</span></>}
        </div>
        {result.bpom?.length > 0 && (
          <div className="bpom">
            <b>{t('Data BPOM:')}</b>
            {result.bpom.map((b) => <div key={b.bpom_number}>{b.name} · {b.bpom_number} · {b.bpom_status}</div>)}
          </div>
        )}
        {m.halal_source && !similar && result.verification?.halal?.status !== 'logo' && <p className="disclaimer">{t('Sumber status halal:')}{' '}{t(m.halal_source)}</p>}
        <p className="small muted">{t(result.disclaimer)}</p>
      </>
    );
  } else if (result) {
    right = (
      <>
        <p className="muted">{result.message}</p>
        {d?.is_medicine && d?.product_name && <VerifyBadges v={result.verification} />}
        {d?.product_name && (
          <div className="kv" style={{ marginBottom: 12 }}>
            <span>{t('Terbaca')}</span><b>{d.product_name}{d.strength && ` ${d.strength}`}</b>
            {d.active_ingredients.length > 0 && <><span>{t('Zat aktif')}</span><span>{d.active_ingredients.join(', ')}</span></>}
            {d.manufacturer && <><span>{t('Produsen')}</span><span>{d.manufacturer}</span></>}
            {result.ai_info?.category && <><span>{t('Kategori')}</span><span>{result.ai_info.category}</span></>}
            {result.ai_info?.usage && <><span>{t('Kegunaan')}</span><span>{result.ai_info.usage}</span></>}
            {result.ai_info?.dosage && <><span>{t('Aturan pakai')}</span><span>{result.ai_info.dosage}</span></>}
            {result.ai_info?.side_effects && <><span>{t('Efek samping')}</span><span>{result.ai_info.side_effects}</span></>}
            {result.ai_info?.warnings && <><span>{t('Peringatan')}</span><span>{result.ai_info.warnings}</span></>}
          </div>
        )}
        {result.ai_info && (
          <p className="disclaimer"><Sparkles size={14} style={{ verticalAlign: '-2px' }} />{' '}{t('Info umum dari Gemini AI, belum ditinjau tim ZenQ. Tanyakan ke apoteker sebelum memakai obat.')}</p>
        )}
        {result.fromPhoto && !result.ai_info && (
          <ul className="small muted" style={{ paddingLeft: 18, lineHeight: 1.8 }}>
            <li>{t('Foto kemasan dari depan, nama obat terlihat jelas')}</li>
            <li>{t('Pastikan tidak buram dan cukup cahaya')}</li>
            <li>{t('Atau ketik nama obat di kolom bawah')}</li>
          </ul>
        )}
      </>
    );
  } else {
    right = <p className="muted">{t('Belum ada gambar. Buka kamera atau pilih foto dari galeri untuk melihat informasi obat.')}</p>;
  }

  return (
    <div className="wrap">
      <h1 className="title">{t('Scan Obat')}</h1>
      <p className="sub">{t('Gunakan kamera atau unggah foto kemasan obat untuk melihat dosis, efek samping, dan interaksi.')}</p>
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={onFile} />
      <input ref={nativeCamRef} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />

      <div className="split">
        <div>{left}</div>
        <div className="card">
          <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 22 }}>{t('Deskripsi Produk')}</h2>
            {result?.source && <span className="chip">{t(SOURCE_LABEL[result.source])}</span>}
          </div>
          {right}
          {error && <div className="toast err">{error}</div>}
          {result?.fromPhoto && (
            <details style={{ marginTop: 14 }}>
              <summary className="small muted" style={{ cursor: 'pointer' }}>{t('Lihat teks yang terbaca dari foto')}</summary>
              <pre className="small" style={{ whiteSpace: 'pre-wrap', background: 'var(--soft)', padding: 12, borderRadius: 12, maxHeight: 160, overflow: 'auto' }}>
                {result.extracted_text?.trim() || t('(tidak ada teks terbaca)')}
              </pre>
              {result.gemini_error && <p className="small muted">{t('Gemini tidak dipakai karena:')}{' '}{result.gemini_error}</p>}
            </details>
          )}
          <form onSubmit={searchManual} className="row" style={{ marginTop: 18 }}>
            <input placeholder={t('Atau ketik nama obat, mis. paracetamol')} value={manual} onChange={(e) => setManual(e.target.value)} />
            <button className="btn" disabled={busy}>{t('Cari')}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default MedicineScan;
