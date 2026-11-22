import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import ArticleCover from '../components/ArticleCover';
import ArticleBody from '../components/ArticleBody';
import StateMessage from '../components/StateMessage';
import { formatDateShort } from '../utils/format';
import { useLang } from '../i18n';

/** Halaman baca artikel edukasi (/education/:slug) */
function ArticleDetail() {
  const { t } = useLang();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: a, loading, error } = useFetch(`/articles/${slug}`);
  const { data: all } = useFetch('/articles');

  if (loading || error) return <div className="wrap"><StateMessage loading={loading} error={error} /></div>;

  const related = (all || []).filter((x) => x.id !== a.id && x.category === a.category).slice(0, 3);
  const more = related.length ? related : (all || []).filter((x) => x.id !== a.id).slice(0, 3);

  return (
    <div className="wrap">
      <button className="btn ghost sm" style={{ marginBottom: 18 }} onClick={() => navigate('/education')}>
        <ArrowLeft size={16} />{' '}{t('Kembali ke Edukasi')}
      </button>

      <article className="article">
        <span className="chip orange">{t(a.category)}</span>
        <h1>{a.title}</h1>
        {a.summary && <p className="lead">{a.summary}</p>}
        <div className="small muted">{t('Tim Konten ZenQ ·')}{' '}{formatDateShort(a.created_at)}</div>
        <ArticleCover article={a} className="hero-cover" iconSize={96} />
        <ArticleBody content={a.content} />

        <div className="article-cta">
          <div>
            <b>{t('Masih punya pertanyaan?')}</b>
            <div className="small muted">{t('Konsultasikan kondisimu dengan dokter. Artikel ini bukan pengganti pemeriksaan medis.')}</div>
          </div>
          {(!user || user.role === 'patient') && (
            <button className="btn" onClick={() => navigate('/doctors')}><Stethoscope size={17} />{' '}{t('Tanya Dokter')}</button>
          )}
        </div>
      </article>

      {more.length > 0 && (
        <>
          <div className="sec"><h2>{t('Baca juga')}</h2></div>
          <div className="grid g3">
            {more.map((x) => (
              <button key={x.id} className="card news" style={{ textAlign: 'left', cursor: 'pointer', color: 'var(--text)' }}
                onClick={() => navigate(`/education/${x.slug}`)}>
                <ArticleCover article={x} className="thumb" />
                <span className="small" style={{ color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>{t(x.category)}</span>
                <b className="clamp3">{x.title}</b>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ArticleDetail;
