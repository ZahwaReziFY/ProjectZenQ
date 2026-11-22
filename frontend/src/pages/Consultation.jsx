import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Camera, MapPin, Mic, MicOff, Phone, PhoneIncoming, PhoneOff, Plus, SendHorizontal,
  Video, VideoOff, Volume2, VolumeX,
} from 'lucide-react';
import api from '../utils/api';
import { compressImage } from '../utils/image';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { useCall } from '../hooks/useCall';
import Avatar from '../components/Avatar';
import StateMessage from '../components/StateMessage';
import { rp } from '../utils/format';
import { useLang } from '../i18n';

const POLL_MS = 5000; // cadangan; pesan baru biasanya langsung masuk lewat Socket.IO

// Gabung pesan baru tanpa dobel, urut sesuai id (urutan masuk ke database)
const mergeMessages = (prev, incoming) => {
  const fresh = incoming.filter((m) => !prev.some((p) => p.id === m.id));
  return fresh.length ? [...prev, ...fresh].sort((a, b) => a.id - b.id) : prev;
};

const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

// <video>/<audio> yang otomatis dipasangi stream
function Media({ stream, muted, kind = 'video', className }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream || null;
  }, [stream]);
  return kind === 'audio'
    ? <audio ref={ref} autoPlay muted={muted} />
    : <video ref={ref} className={className} autoPlay playsInline muted={muted} />;
}

/**
 * Ruang konsultasi (dipakai PASIEN dan DOKTER, tampilannya sama).
 * - Chat: real-time lewat Socket.IO (+ polling cadangan)
 * - Tombol "+": Kamera (kirim foto), Video Call, Telepon
 * - Video call & telepon: WebRTC beneran (lihat hooks/useCall.js + backend/socket.js)
 */
function Consultation() {
  const { t } = useLang();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: c, loading, error, refetch } = useFetch(`/consultations/${id}`);

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [expand, setExpand] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [now, setNow] = useState(Date.now());
  const lastIdRef = useRef(0);
  const msgsRef = useRef(null);
  const cameraRef = useRef(null);

  const call = useCall(Number(id), { onMessage: (m) => setMessages((prev) => mergeMessages(prev, [m])) });
  const inCall = ['outgoing', 'connecting', 'connected'].includes(call.status);

  // Polling cadangan (kalau socket putus, chat tetap jalan)
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await api.get(`/consultations/${id}/messages?after_id=${lastIdRef.current}`);
        if (active && res.data.length) {
          lastIdRef.current = res.data[res.data.length - 1].id;
          setMessages((prev) => mergeMessages(prev, res.data));
        }
      } catch {
        // dicoba lagi di putaran berikutnya
      }
    };
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [id]);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, inCall]);

  // Jam durasi panggilan
  useEffect(() => {
    if (call.status !== 'connected') return undefined;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [call.status]);

  const post = async (message, type = 'text') => {
    setSendError('');
    setSending(true);
    try {
      const res = await api.post(`/consultations/${id}/messages`, { message, type });
      // lastIdRef SENGAJA gak diubah: biar pesan lawan bicara yang masuk duluan gak ke-skip polling
      setMessages((prev) => mergeMessages(prev, [res.data]));
    } catch (err) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  };

  const send = (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t) return;
    setText('');
    post(t);
  };

  // Foto dari kamera -> dikecilkan (maks 1024 px) -> dikirim sebagai pesan gambar
  const onCamera = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    setExpand(false);
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const blob = await compressImage(ev.target.result, 1024, 0.78);
        const dataUrl = await new Promise((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result);
          r.readAsDataURL(blob);
        });
        post(dataUrl, 'image');
      } catch (err) {
        setSendError(err.message);
      }
    };
    reader.readAsDataURL(f);
  };

  const finish = async () => {
    if (!window.confirm(t('Akhiri sesi konsultasi?'))) return;
    if (call.status !== 'idle') call.hangup();
    await api.patch(`/consultations/${id}/status`, { status: 'completed' });
    refetch();
  };

  const startCall = (type) => {
    setExpand(false);
    call.start(type);
  };

  if (loading || error) return <div className="wrap"><StateMessage loading={loading} error={error} /></div>;

  const isDoctor = user.role === 'doctor';
  const other = isDoctor ? c.patient_name : c.doctor_name;
  const otherId = isDoctor ? c.patient_id : c.doctor_user_id;
  const otherHere = call.online.includes(otherId);
  const open = c.status === 'ongoing';
  const isVideo = call.callType === 'video';
  const hasRemoteVideo = isVideo && call.remoteStream?.getVideoTracks().length > 0;

  const statusText = {
    outgoing: t('Memanggil…'),
    connecting: t('Menghubungkan…'),
    connected: call.connectedAt ? clock(now - call.connectedAt) : '00:00',
  }[call.status];

  let main;
  if (inCall) {
    main = (
      <div className={`stage ${hasRemoteVideo && call.status === 'connected' ? 'live' : ''}`}>
        {/* Suara lawan bicara (video call: lewat <video>, telepon: lewat <audio>) */}
        {isVideo
          ? <Media stream={call.remoteStream} muted={!call.speakerOn} className="remote" />
          : <Media kind="audio" stream={call.remoteStream} muted={!call.speakerOn} />}

        {!(hasRemoteVideo && call.status === 'connected') && (
          <div className={call.status === 'connected' ? '' : 'ring'}>
            <div style={{ textAlign: 'center', color: '#fff' }}>
              <Avatar name={other} size={isVideo ? 150 : 110} bg="#fff" style={{ margin: '0 auto' }} />
              <h2 style={{ marginTop: 14, fontSize: 22 }}>{other}</h2>
              <span style={{ opacity: 0.85 }}>{isVideo ? t('Video call') : t('Telepon')} · {statusText}</span>
            </div>
          </div>
        )}
        {isVideo && call.status === 'connected' && <div className="timer">{statusText}</div>}

        {isVideo && (
          <div className="self">
            {call.camOn ? <Media stream={call.localStream} muted /> : <VideoOff size={22} />}
          </div>
        )}

        <div className="ctrl">
          <button className={call.micOn ? '' : 'off'} onClick={call.toggleMic}
            aria-label={call.micOn ? t('Matikan mikrofon') : t('Nyalakan mikrofon')}>
            {call.micOn ? <Mic size={20} /> : <MicOff size={20} />}
          </button>
          <button className={call.speakerOn ? '' : 'off'} onClick={call.toggleSpeaker}
            aria-label={call.speakerOn ? t('Matikan suara') : t('Nyalakan suara')}>
            {call.speakerOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          {isVideo && (
            <button className={call.camOn ? '' : 'off'} onClick={call.toggleCam}
              aria-label={call.camOn ? t('Matikan kamera') : t('Nyalakan kamera')}>
              {call.camOn ? <Video size={20} /> : <VideoOff size={20} />}
            </button>
          )}
          <button className="end" onClick={call.hangup} aria-label={t('Tutup panggilan')}><PhoneOff size={20} /></button>
        </div>
      </div>
    );
  } else {
    main = (
      <div className="card chat">
        <div className="msgs" ref={msgsRef}>
          {messages.length === 0 && <div className="muted small" style={{ textAlign: 'center' }}>{t('Mulai percakapan dengan')}{' '}{other}.</div>}
          {messages.map((m) => {
            if (m.type === 'system') return <div key={m.id} className="m sys">{t(m.message)}</div>;
            return (
              <div key={m.id} className={`m ${m.sender_id === user.id ? 'me' : 'them'}`}>
                {m.type === 'image' && m.message.startsWith('data:image/')
                  ? <img src={m.message} alt={t('Foto dari kamera')} />
                  : m.message}
              </div>
            );
          })}
        </div>
        {expand && open && (
          <div className="tray">
            <button onClick={() => cameraRef.current?.click()}><Camera size={16} />{' '}{t('Kamera')}</button>
            <button className="call" onClick={() => startCall('video')}><Video size={16} />{' '}{t('Video Call')}</button>
            <button className="call" onClick={() => startCall('audio')}><Phone size={16} />{' '}{t('Telepon')}</button>
          </div>
        )}
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={onCamera} />
        {open ? (
          <form className="composer" onSubmit={send}>
            <input placeholder={t('Ketik pesan...')} value={text} onChange={(e) => setText(e.target.value)} />
            <button type="button" className={`iconb ${expand ? 'on' : ''}`} title={t('Kamera, video call, telepon')}
              aria-label={t('Fitur lain')} onClick={() => setExpand(!expand)}><Plus size={22} /></button>
            <button className="btn" disabled={sending}><SendHorizontal size={16} />{' '}{t('Kirim')}</button>
          </form>
        ) : (
          <div className="composer muted small" style={{ justifyContent: 'center' }}>
            {c.status === 'pending' ? t('Sesi belum dibayar.') : t('Sesi konsultasi sudah berakhir.')}
          </div>
        )}
        {(sendError || call.info) && (
          <div className="toast err" style={{ margin: 12 }}>
            {sendError || call.info}
            {call.info && <button className="link" style={{ marginLeft: 10 }} onClick={() => call.setInfo('')}>{t('Tutup')}</button>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wrap">
      <button className="btn ghost sm" style={{ marginBottom: 18 }}
        onClick={() => navigate(isDoctor ? '/doctor' : `/doctors/${c.doctor_id}`)}><ArrowLeft size={16} />{' '}{t('Kembali')}</button>
      <div className="consult">
        <div className="card" style={{ textAlign: 'center', alignSelf: 'start' }}>
          <Avatar name={other} size={110} />
          <h2 style={{ fontSize: 20, marginTop: 12 }}>{other}</h2>
          {isDoctor ? (
            <div className="muted small">{t('Pasien')}{c.complaint && ` · Keluhan: ${c.complaint}`}</div>
          ) : (
            <>
              <div className="muted small">{t(c.specialization)}</div>
              <div className="muted small row" style={{ justifyContent: 'center', gap: 5, marginTop: 4 }}><MapPin size={14} /> {c.hospital}</div>
            </>
          )}
          <div style={{ margin: '14px 0' }}>
            {!open && <span className="chip">{c.status === 'completed' ? t('Selesai') : t('Tidak aktif')}</span>}
            {open && (otherHere
              ? <span className="chip green">{t('Ada di ruang konsultasi')}</span>
              : <span className="chip">{t('Belum membuka ruang ini')}</span>)}
          </div>
          {!isDoctor && (
            <>
              <div className="small muted">{t('Sesi dibayar')}</div>
              <div className="price">{rp(c.consultation_fee)}</div>
            </>
          )}
          {open && <button className="btn ghost sm" style={{ marginTop: 14 }} onClick={finish}>{t('Akhiri Sesi')}</button>}
        </div>
        <div>{main}</div>
      </div>

      {/* Panggilan masuk */}
      {call.status === 'incoming' && (
        <div className="incoming" role="alertdialog" aria-label={t('Panggilan masuk')}>
          <div className="incoming-card">
            <span className="incoming-ic"><PhoneIncoming size={26} /></span>
            <Avatar name={call.peerName || other} size={84} />
            <b style={{ fontSize: 19 }}>{call.peerName || other}</b>
            <span className="muted">{call.callType === 'video' ? t('Video call masuk…') : t('Telepon masuk…')}</span>
            <div className="row" style={{ gap: 12, marginTop: 8 }}>
              <button className="btn" style={{ background: 'var(--red)', boxShadow: 'none' }} onClick={call.decline}>
                <PhoneOff size={17} />{' '}{t('Tolak')}
              </button>
              <button className="btn" style={{ background: 'var(--green)', boxShadow: 'none' }} onClick={call.accept}>
                {call.callType === 'video' ? <Video size={17} /> : <Phone size={17} />}{' '}{t('Terima')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Consultation;
