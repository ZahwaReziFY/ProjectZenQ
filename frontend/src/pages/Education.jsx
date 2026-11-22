import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, BookOpen } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import ArticleCover from '../components/ArticleCover';
import StateMessage from '../components/StateMessage';
import { formatDateShort } from '../utils/format';
import { useLang } from '../i18n';

/**
 * Konten Edukasi = 2 sumber:
 *  1. ARTIKEL ZenQ (tabel articles) -> isi utama. Dikelola admin di menu Konten (tambah/ubah/hapus).
 *  2. BERITA kesehatan otomatis dari api-berita-indonesia -> pelengkap. Kalau API-nya mati,
 *     bagian ini otomatis disembunyikan dan halaman tetap terisi artikel.
 */
function Education() {
  const { t } = useLang();
  const navigate = useNavigate();
  const { data: articles, loading, error } = useFetch('/articles');
  const { data: news } = useFetch('/articles/news?limit=6');
  const [category, setCategory] = useState('Semua');

  const categories = useMemo(
    () => ['Semua', ...new Set((articles || []).filter((a) => !a.is_featured).map((a) => a.category).filter(Boolean))],
    [articles]
  );
  const featured = articles?.find((a) => a.is_featured);
  const list = (articles || []).filter((a) => a !== featured && (category === 'Semua' || a.category === category));
  const open = (a) => navigate(`/education/${a.slug}`);

  return (
    <div className="wrap">
      <h1 className="title">{t('Edukasi Kesehatan')}</h1>
      <p className="sub">{t('Artikel kesehatan pilihan dan berita terbaru, dirangkum agar mudah dipahami.')}</p>

      <StateMessage loading={loading} error={error} empty={articles && !articles.length}
        emptyIcon={<BookOpen size={44} />} emptyText={t('Belum ada artikel edukasi.')} />

      {featured && (
        <button className="newsfeat" style={{ textAlign: 'left', width: '100%', cursor: 'pointer', padding: 0 }} onClick={() => open(featured)}>
          <ArticleCover article={featured} className="pic" iconSize={84} />
          <div className="txt">
            <span className="chip orange">{t(featured.category || 'Tahukah Kamu?')}</span>
            <h2>{featured.title}</h2>
            {featured.summary && <p className="muted">{featured.summary}</p>}
            <div className="meta">
              <span>{t('Artikel ZenQ')}</span>
              <span className="go">{t('Baca artikel')}{' '}<ArrowRight size={16} /></span>
            </div>
          </div>
        </button>
      )}

      {categories.length > 2 && (
        <div className="chips" style={{ margin: '4px 0 18px' }}>
          {categories.map((c) => (
            <button key={c} className={category === c ? 'on' : ''} onClick={() => setCategory(c)}>{t(c)}</button>
          ))}
        </div>
      )}

      <div className="grid g3">
        {list.map((a) => (
          <button key={a.id} className="card news" style={{ textAlign: 'left', cursor: 'pointer', color: 'var(--text)' }} onClick={() => open(a)}>
            <ArticleCover article={a} className="thumb" />
            <span className="small" style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>{t(a.category)}</span>
            <b className="clamp3">{a.title}</b>
            {a.summary && <span className="small muted clamp3" style={{ marginTop: 6 }}>{a.summary}</span>}
          </button>
        ))}
      </div>

      {/* Berita otomatis dari API (disembunyikan kalau API sedang tidak bisa diakses) */}
      {news?.length > 0 && (
        <>
          <div className="sec">
            <div>
              <h2>{t('Berita Kesehatan Terbaru')}</h2>
              <div className="muted small">{t('Otomatis dari Suara.com dan Tribunnews')}</div>
            </div>
          </div>
          <div className="grid g3">
            {news.map((n) => (
              <a key={n.link} href={n.link} target="_blank" rel="noreferrer" className="card news">
                <div className="thumb" style={n.thumbnail ? { backgroundImage: `url(${n.thumbnail})` } : undefined} />
                <b className="clamp3">{n.title}</b>
                <span className="small muted row" style={{ marginTop: 'auto', paddingTop: 10, gap: 4 }}>
                  {n.source}{n.published_at && ` · ${formatDateShort(n.published_at)}`} <ArrowUpRight size={14} />
                </span>
              </a>
            ))}
          </div>
        </>
      )}

      <p className="small muted" style={{ marginTop: 26 }}>
        {t('Informasi di halaman ini bersifat edukasi umum dan bukan pengganti saran dokter.')}
      </p>
    </div>
  );
}

export default Education;
