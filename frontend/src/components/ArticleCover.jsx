import { Apple, BookOpen, HeartPulse, Leaf, Lightbulb, Moon, ShieldCheck, Siren } from 'lucide-react';

/**
 * Sampul artikel edukasi.
 * - Kalau admin sudah pasang foto (cover_url) -> tampil fotonya
 * - Kalau belum -> sampul otomatis: warna + ikon sesuai kategori
 */
const STYLE_BY_CATEGORY = {
  'Tahukah Kamu?': [Lightbulb, 'linear-gradient(140deg,#C9A15E,#8A6326)'],
  'Gaya Hidup': [Leaf, 'linear-gradient(140deg,#3FA37A,#11664A)'],
  Tidur: [Moon, 'linear-gradient(140deg,#4D5FB0,#232F6E)'],
  'Penyakit Kronis': [HeartPulse, 'linear-gradient(140deg,#D2626B,#8E2733)'],
  Pencegahan: [ShieldCheck, 'linear-gradient(140deg,#3E9FE0,#0B4A7E)'],
  Gizi: [Apple, 'linear-gradient(140deg,#E09A3E,#A5571A)'],
  Kegawatdaruratan: [Siren, 'linear-gradient(140deg,#E05A4E,#9E2219)'],
};
const DEFAULT_STYLE = [BookOpen, 'linear-gradient(140deg,#3E9FE0,#072F52)'];

function ArticleCover({ article, className = '', iconSize = 44 }) {
  if (article?.cover_url) {
    return <div className={`acover ${className}`} style={{ backgroundImage: `url(${article.cover_url})` }} role="img" aria-label={article.title} />;
  }
  const [Icon, bg] = STYLE_BY_CATEGORY[article?.category] || DEFAULT_STYLE;
  return (
    <div className={`acover auto ${className}`} style={{ background: bg }} aria-hidden="true">
      <Icon size={iconSize} strokeWidth={1.5} />
    </div>
  );
}

export const ARTICLE_CATEGORIES = [...Object.keys(STYLE_BY_CATEGORY), 'Umum'];

export default ArticleCover;
