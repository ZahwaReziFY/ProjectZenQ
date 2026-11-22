import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, ScanLine, Stethoscope } from 'lucide-react';
import homeVisitPhoto from '../assets/banner-home-visit.jpg';
import { useLang } from '../i18n';

/**
 * Banner iklan di Beranda (geser otomatis tiap 6 detik, berhenti saat disorot mouse).
 * Mau ganti / nambah iklan? Cukup ubah array SLIDES di bawah.
 *   - photo: gambar di kanan (taruh file-nya di src/assets lalu import)
 *   - icons: kalau gak ada foto, tampil ikon besar di lingkaran
 */
const SLIDES = [
  {
    title: 'Kesehatan optimal, nyaman di rumah',
    text: 'Layanan home visit ZenQ: dokter dan perawat datang ke rumah sesuai jadwal Anda.',
    cta: ['Panggil Dokter', '/home-visit'],
    cta2: ['Konsultasi Online', '/doctors'],
    photo: homeVisitPhoto,
  },
  {
    title: 'Konsultasi dokter tanpa antre',
    text: 'Chat, telepon, atau video call dengan dokter pilihan Anda, langsung dari ZenQ.',
    cta: ['Pilih Dokter', '/doctors'],
    icons: [Stethoscope, MessageCircle],
  },
  {
    title: 'Kenali obat dari kemasannya',
    text: 'Foto kemasan obat, Gemini AI membaca nama obatnya lalu ZenQ menampilkan dosis dan efek samping.',
    cta: ['Scan Obat', '/scan'],
    icons: [ScanLine],
  },
];

const INTERVAL_MS = 6000;

function AdBanner() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (paused || reduce) return undefined;
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused]);

  const s = SLIDES[index];
  const [MainIcon, SubIcon] = s.icons || [];

  return (
    <section
      className="adbanner"
      aria-roledescription="carousel"
      aria-label={t('Promo layanan ZenQ')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="ad-copy" key={index}>
        <h1>{t(s.title)}</h1>
        <p>{t(s.text)}</p>
        <div className="row" style={{ flexWrap: 'wrap', gap: 10 }}>
          <button className="btn" onClick={() => navigate(s.cta[1])}>{t(s.cta[0])}</button>
          {s.cta2 && <button className="btn ad-ghost" onClick={() => navigate(s.cta2[1])}>{t(s.cta2[0])}</button>}
        </div>
      </div>

      <div className="ad-visual" aria-hidden="true">
        {s.photo ? (
          <img src={s.photo} alt="" />
        ) : (
          <div className="ad-orb">
            <MainIcon size={88} strokeWidth={1.5} />
            {SubIcon && <span className="ad-orb-sub"><SubIcon size={30} /></span>}
          </div>
        )}
      </div>

      <div className="ad-dots" role="tablist">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            role="tab"
            aria-selected={i === index}
            aria-label={`Promo ${i + 1}: ${t(slide.title)}`}
            className={i === index ? 'on' : ''}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}

export default AdBanner;
