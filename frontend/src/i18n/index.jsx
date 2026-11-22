import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en, { PATTERNS as EN_PATTERNS } from './en';

/**
 * BAHASA (i18n) ZenQ: Indonesia (default) & Inggris.
 *
 * Cara pakai di komponen:
 *   const { t, lang, setLang } = useLang();
 *   <h1>{t('Riwayat Saya')}</h1>
 *   t('Halo, {name}', { name: user.name })
 *
 * Kuncinya = teks bahasa Indonesia apa adanya. Terjemahan Inggris ada di i18n/en.js.
 * Kalau terjemahannya belum ada, teks Indonesia yang tampil (aplikasi tidak error).
 * Pilihan bahasa disimpan di browser (localStorage) jadi tetap sama saat dibuka lagi.
 */
const STORAGE_KEY = 'zenq_lang';
export const LANGUAGES = [
  { code: 'id', label: 'Bahasa Indonesia', short: 'ID' },
  { code: 'en', label: 'English', short: 'EN' },
];
const DICTS = { en };
const PATTERNS = { en: EN_PATTERNS };

let current = 'id';
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved && LANGUAGES.some((l) => l.code === saved)) current = saved;
} catch {
  // localStorage tidak tersedia -> pakai default
}

/** Bahasa aktif + locale untuk format tanggal/angka (dipakai juga di luar komponen, mis. utils/format.js) */
export const getLang = () => current;
export const getLocale = () => (current === 'en' ? 'en-GB' : 'id-ID');

/** Terjemahkan tanpa hook (untuk kode di luar komponen React) */
export function translate(key, vars) {
  if (key == null) return key;
  let text = key;
  if (current !== 'id' && typeof key === 'string') {
    const hit = DICTS[current]?.[key];
    if (hit) text = hit;
    else {
      // teks dinamis dari backend (berisi nama/angka) -> cocokkan pola
      const pattern = PATTERNS[current]?.find(([re]) => re.test(key));
      if (pattern) text = key.replace(pattern[0], pattern[1]);
    }
  }
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));
}

const LanguageContext = createContext({ lang: 'id', setLang: () => {}, t: translate });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(current);

  const setLang = useCallback((code) => {
    current = code;
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // abaikan
    }
    setLangState(code);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // t dibuat ulang tiap ganti bahasa -> semua komponen yang pakai useLang ikut render ulang
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const t = useCallback((key, vars) => translate(key, vars), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLang = () => useContext(LanguageContext);
