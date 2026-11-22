import { LANGUAGES, useLang } from '../i18n';

/** Tombol kecil ganti bahasa: ID | EN (navbar, halaman login, halaman awal, ZenQ Pay) */
function LangSwitch({ className = '' }) {
  const { lang, setLang, t } = useLang();
  return (
    <div className={`langswitch ${className}`} role="group" aria-label={t('Bahasa')}>
      {LANGUAGES.map((l) => (
        <button key={l.code} type="button" className={lang === l.code ? 'on' : ''} aria-pressed={lang === l.code}
          title={l.label} onClick={() => setLang(l.code)}>
          {l.short}
        </button>
      ))}
    </div>
  );
}

export default LangSwitch;
