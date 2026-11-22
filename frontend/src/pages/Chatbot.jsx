import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Avatar from '../components/Avatar';
import { SendHorizontal } from 'lucide-react';
import { useLang } from '../i18n';

const ACTION_BY_LEVEL = {
  emergency: { to: '/emergency', label: 'Buka Layanan Darurat', style: { background: 'var(--red)', color: '#fff' } },
  consult: { to: '/doctors', label: 'Konsultasi ke Dokter' },
  self_care: { to: '/education', label: 'Baca Tips Kesehatan' },
};

/**
 * Chatbot AI triase awal (sesuai rancangan proyek). Pake gaya chat yang sama dengan
 * halaman konsultasi. TODO: input suara (Web Speech API) sesuai scope "voice/text".
 */
function Chatbot() {
  const { t } = useLang();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { from: 'them', text: 'Halo! Aku ZenQ AI. Ceritakan keluhanmu, nanti aku bantu arahkan ke layanan yang tepat.' },
  ]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const msgsRef = useRef(null);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, sending]);

  const send = async (e) => {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    setMessages((m) => [...m, { from: 'me', text: msg }]);
    setText('');
    setSending(true);
    try {
      const res = await api.post('/chatbot/message', { message: msg });
      setMessages((m) => [...m, { from: 'them', text: res.data.reply, level: res.data.triage_level, spec: res.data.suggested_specialization }]);
    } catch (err) {
      setMessages((m) => [...m, { from: 'them', text: t('Maaf, terjadi kesalahan: {error}', { error: err.message }) }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="wrap">
      <h1 className="title">{t('Tanya ZenQ AI')}</h1>
      <p className="sub">{t('Cek gejala awal. AI hanya pendamping, bukan pengganti diagnosis dokter.')}</p>
      <div className="consult">
        <div className="card" style={{ textAlign: 'center', alignSelf: 'start' }}>
          <Avatar name="Z Q" size={110} bg="#7fe0d2" style={{ margin: '0 auto' }} />
          <h2 style={{ fontSize: 20, marginTop: 12 }}>{t('ZenQ AI')}</h2>
          <div className="muted small">{t('Asisten triase awal')}</div>
          <div style={{ margin: '14px 0' }}><span className="chip green">{t('Online')}</span></div>
          <div className="small muted">{t('Kalau ada tanda bahaya (sesak napas, nyeri dada, pingsan), langsung ke menu Darurat.')}</div>
        </div>
        <div className="card chat">
          <div className="msgs" ref={msgsRef}>
            {messages.map((m, i) => (
              <div key={i} className={`m ${m.from}`}>
                {i === 0 ? t(m.text) : m.text}
                {m.level && ACTION_BY_LEVEL[m.level] && (
                  <div style={{ marginTop: 10 }}>
                    <button className="btn sm ghost" style={ACTION_BY_LEVEL[m.level].style} onClick={() => navigate(m.level === 'consult' && m.spec ? `/doctors?q=${encodeURIComponent(m.spec)}` : ACTION_BY_LEVEL[m.level].to)}>
                      {m.level === 'consult' && m.spec ? t('Cari {spec}', { spec: t(m.spec) }) : t(ACTION_BY_LEVEL[m.level].label)}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {sending && <div className="m them">{t('ZenQ AI sedang mengetik…')}</div>}
          </div>
          <form className="composer" onSubmit={send}>
            <input placeholder={t('Contoh: saya demam sejak kemarin...')} value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} />
            <button className="btn" disabled={sending}><SendHorizontal size={16} />{' '}{t('Kirim')}</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Chatbot;