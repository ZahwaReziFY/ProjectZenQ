import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { ArrowLeft, Check, Copy, ExternalLink, Landmark, Loader2, QrCode, Smartphone } from 'lucide-react';
import api from '../utils/api';
import { useFetch } from '../hooks/useFetch';
import { useLang } from '../i18n';
import OrderSummary from '../components/OrderSummary';
import StateMessage from '../components/StateMessage';
import { methodLabel, rp } from '../utils/format';

const BANKS = ['BCA', 'Mandiri', 'BRI', 'BNI'];
const POLL_MS = 3000;

/**
 * Pembayaran SIMULASI (3 langkah):
 *  1. Pilih Pembayaran  -> POST /orders/:id/payment  (bikin nomor VA / pilih QRIS)
 *  2. Bayar
 *     - QRIS : QR berisi link ZenQ Pay (/pay/<token>). Scan pakai kamera HP -> bayar di HP ->
 *              halaman ini mengecek status tiap 3 detik dan otomatis lanjut ke langkah 3.
 *     - Bank : tombol "Saya Sudah Bayar" (simulasi bank mengonfirmasi transfer VA)
 *  3. Selesai
 */
function Checkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const { data: order, setData: setOrder, loading, error } = useFetch(`/orders/${id}`);

  const [step, setStep] = useState(null);
  const [method, setMethod] = useState('bank');
  const [bank, setBank] = useState('BCA');
  const [qr, setQr] = useState('');
  const [payUrl, setPayUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  // Tentukan langkah awal dari status order
  useEffect(() => {
    if (!order || step) return;
    if (order.status !== 'awaiting_payment') setStep('done');
    else setStep(order.payment_method ? 'pay' : 'choose');
    if (order.payment_method) setMethod(order.payment_method);
    if (order.payment_bank) setBank(order.payment_bank);
  }, [order, step]);

  // QRIS: minta token bayar -> QR berisi link halaman ZenQ Pay
  const isQris = step === 'pay' && order?.payment_method === 'qris' && order?.status === 'awaiting_payment';
  useEffect(() => {
    if (!isQris) return;
    api.get(`/orders/${id}/pay-token`)
      .then((res) => {
        const url = `${window.location.origin}/pay/${res.data.token}`;
        setPayUrl(url);
        return QRCode.toDataURL(url, { width: 260, margin: 1, errorCorrectionLevel: 'M' });
      })
      .then(setQr)
      .catch((err) => setActionError(err.message));
  }, [isQris, id]);

  // Cek status tiap 3 detik selama menunggu pembayaran (pembayaran bisa terjadi di HP lain)
  useEffect(() => {
    if (step !== 'pay') return undefined;
    const timer = setInterval(async () => {
      try {
        const res = await api.get(`/orders/${id}`);
        if (res.data.status !== 'awaiting_payment') {
          setOrder(res.data);
          setStep('done');
          window.scrollTo(0, 0);
        }
      } catch {
        // coba lagi di putaran berikutnya
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [step, id, setOrder]);

  const run = async (fn) => {
    setBusy(true);
    setActionError('');
    try {
      await fn();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toPay = () => run(async () => {
    const res = await api.post(`/orders/${id}/payment`, { method, bank });
    setOrder(res.data);
    setQr('');
    setStep('pay');
    window.scrollTo(0, 0);
  });

  const payDone = () => run(async () => {
    const res = await api.post(`/orders/${id}/confirm`);
    setOrder(res.data);
    setStep('done');
    window.scrollTo(0, 0);
  });

  if (loading || error) return <div className="wrap"><StateMessage loading={loading} error={error} /></div>;
  if (!order || !step) return null;

  const stepper = (n) => (
    <div className="steps">
      <span className={n > 1 ? 'done' : 'on'}>1. {t('Pilih Pembayaran')}</span>
      <span className={n > 2 ? 'done' : n === 2 ? 'on' : ''}>2. {t('Bayar')}</span>
      <span className={n === 3 ? 'on' : ''}>3. {t('Selesai')}</span>
    </div>
  );

  if (step === 'choose') {
    return (
      <div className="wrap">
        {stepper(1)}
        <h1 className="title">{t('Pembayaran')}</h1>
        <p className="sub">{t('Pilih metode pembayaran.')}</p>
        <div className="split" style={{ '--cols': '1.3fr 1fr' }}>
          <div className="card">
            <button className={`popt ${method === 'bank' ? 'on' : ''}`} onClick={() => setMethod('bank')}>
              <span className="lic pay-ic"><Landmark size={22} /></span>
              <div><b>{t('Transfer Bank')}</b><div className="small muted">{t('Virtual Account, dicek otomatis')}</div></div>
              <span className="dot" />
            </button>
            {method === 'bank' && (
              <div className="chips" style={{ margin: '-2px 0 16px 8px' }}>
                {BANKS.map((b) => <button key={b} className={bank === b ? 'on' : ''} onClick={() => setBank(b)}>{b}</button>)}
              </div>
            )}
            <button className={`popt ${method === 'qris' ? 'on' : ''}`} onClick={() => setMethod('qris')}>
              <span className="lic pay-ic"><QrCode size={22} /></span>
              <div><b>{t('QR Pembayaran (QRIS)')}</b><div className="small muted">{t('Scan pakai kamera HP, langsung lunas')}</div></div>
              <span className="dot" />
            </button>
            <button className="btn block" style={{ marginTop: 8 }} onClick={toPay} disabled={busy}>
              {t('Bayar Sekarang')} · {rp(order.total)}
            </button>
            {actionError && <div className="toast err">{actionError}</div>}
          </div>
          <OrderSummary order={order} />
        </div>
      </div>
    );
  }

  if (step === 'pay') {
    const va = order.va_number || '';
    return (
      <div className="wrap">
        {stepper(2)}
        <h1 className="title">{t('Selesaikan Pembayaran')}</h1>
        <p className="sub">{t('Batas waktu pembayaran: 24 jam.')}</p>
        <div className="split" style={{ '--cols': '1.3fr 1fr' }}>
          <div className="card">
            {order.payment_method === 'bank' ? (
              <>
                <div className="small muted">{t('Nomor Virtual Account {bank}', { bank: order.payment_bank })}</div>
                <div className="va">{va.replace(/(\d{4})(?=\d)/g, '$1 ')}</div>
                <div className="row">
                  <button className="btn ghost sm" onClick={() => { navigator.clipboard?.writeText(va); setCopied(true); }}>
                    {copied ? <><Check size={15} /> {t('Tersalin')}</> : <><Copy size={15} /> {t('Salin nomor')}</>}
                  </button>
                </div>
                <div className="sumrow total"><span>{t('Total pembayaran')}</span><span>{rp(order.total)}</span></div>
                <h3 style={{ margin: '18px 0 8px', fontSize: 16 }}>{t('Cara membayar')}</h3>
                <ol className="small muted" style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
                  <li>{t('Buka ATM atau aplikasi m-banking {bank}', { bank: order.payment_bank })}</li>
                  <li>{t('Pilih menu Transfer / Virtual Account')}</li>
                  <li>{t('Masukkan nomor di atas dan periksa nominalnya')}</li>
                  <li>{t('Konfirmasi pembayaran')}</li>
                </ol>
                <div className="toast" style={{ background: 'var(--soft)', color: 'var(--text)' }}>
                  {t('Ini simulasi. Tombol di bawah mensimulasikan bank mengonfirmasi transfer Anda.')}
                </div>
                <button className="btn block" style={{ marginTop: 14 }} onClick={payDone} disabled={busy}>{t('Saya Sudah Bayar')}</button>
              </>
            ) : (
              <>
                <div className="qrbox">
                  <b>{t('Scan untuk membayar')}</b>
                  {qr
                    ? <img src={qr} alt={t('QR pembayaran')} className="payqr" />
                    : <div className="payqr skel" style={{ width: 260, height: 260 }} />}
                  <div className="small muted row" style={{ gap: 6 }}><Loader2 size={14} className="spin" /> {t('Menunggu pembayaran… halaman ini lanjut otomatis')}</div>
                </div>
                <div className="sumrow total"><span>{t('Total pembayaran')}</span><span>{rp(order.total)}</span></div>
                <h3 style={{ margin: '18px 0 8px', fontSize: 16 }}>{t('Cara membayar')}</h3>
                <ol className="small muted" style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
                  <li>{t('Buka kamera HP lalu arahkan ke kode QR')}</li>
                  <li>{t('Ketuk link yang muncul untuk membuka ZenQ Pay')}</li>
                  <li>{t('Periksa tagihan lalu tekan Bayar')}</li>
                </ol>
                {payUrl && (
                  <a className="btn ghost sm" style={{ marginTop: 14 }} href={payUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={15} /> {t('Gak bisa scan? Buka halaman bayar di sini')}
                  </a>
                )}
                <div className="small muted row" style={{ gap: 6, marginTop: 12 }}>
                  <Smartphone size={14} /> {t('HP harus bisa membuka alamat web ZenQ (sudah di-deploy, atau satu jaringan wifi).')}
                </div>
              </>
            )}
            <button className="btn ghost block" style={{ marginTop: 10 }} onClick={() => setStep('choose')}><ArrowLeft size={16} /> {t('Ganti metode')}</button>
            {actionError && <div className="toast err">{actionError}</div>}
          </div>
          <OrderSummary order={order} />
        </div>
      </div>
    );
  }

  // step === 'done'
  const isConsult = order.kind === 'consultation';
  return (
    <div className="wrap">
      {stepper(3)}
      <div className="card" style={{ maxWidth: 560, margin: '20px auto', textAlign: 'center' }}>
        <div className="big-ok"><Check size={44} /></div>
        <h1 style={{ fontSize: 26 }}>{order.status === 'cancelled' ? t('Pesanan Dibatalkan') : t('Pembayaran Berhasil')}</h1>
        <p className="muted">
          {t('ID transaksi')} <b>{order.code}</b><br />{t('{amount} via {method}', { amount: rp(order.total), method: methodLabel(order) })}
        </p>
        <div className="row" style={{ justifyContent: 'center', flexWrap: 'wrap', marginTop: 18 }}>
          {isConsult && order.consultation && (
            <button className="btn" onClick={() => navigate(`/consultations/${order.consultation.id}`)}>{t('Mulai Konsultasi')}</button>
          )}
          <button className={`btn ${isConsult ? 'ghost' : ''}`} onClick={() => navigate(`/orders/${order.id}`)}>{t('Lihat Detail Pesanan')}</button>
          <button className="btn ghost" onClick={() => navigate('/home')}>{t('Ke Beranda')}</button>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
