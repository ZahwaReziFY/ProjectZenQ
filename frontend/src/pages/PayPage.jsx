import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { CheckCircle2, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import { useFetch } from '../hooks/useFetch';
import { useLang } from '../i18n';
import Logo from '../components/Logo';
import { rp } from '../utils/format';
import LangSwitch from '../components/LangSwitch';

/**
 * ZenQ Pay (SIMULASI) - halaman yang terbuka setelah QR pembayaran di-scan pakai kamera HP.
 * Tidak perlu login: aksesnya dijamin token bertanda tangan di URL (berlaku 24 jam).
 * Di aplikasi nyata, peran halaman ini dijalankan aplikasi m-banking / e-wallet.
 */
function PayPage() {
  const { token } = useParams();
  const { t } = useLang();
  const { data: bill, setData: setBill, loading, error } = useFetch(`/pay/${token}`);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  const pay = async () => {
    setPaying(true);
    setPayError('');
    try {
      await new Promise((r) => setTimeout(r, 900)); // efek "memproses" seperti e-wallet
      const res = await api.post(`/pay/${token}/confirm`);
      setBill({ ...bill, status: res.data.status });
    } catch (err) {
      setPayError(err.message);
    } finally {
      setPaying(false);
    }
  };

  const paid = bill && bill.status !== 'awaiting_payment' && bill.status !== 'cancelled';

  return (
    <div className="paypage">
      <div className="paycard">
        <div className="payhead">
          <Logo size={30} /> <b>ZenQ Pay</b>
          <span className="chip" style={{ marginLeft: 'auto' }}>{t('Simulasi')}</span>
          <LangSwitch />
        </div>

        {loading && <p className="muted" style={{ textAlign: 'center' }}><Loader2 className="spin" size={20} /> {t('Memuat tagihan…')}</p>}
        {error && <div className="toast err">{error}</div>}

        {bill && bill.status === 'cancelled' && <div className="toast err">{t('Pesanan ini sudah dibatalkan.')}</div>}

        {bill && paid && (
          <div className="payok">
            <CheckCircle2 size={64} />
            <h2>{t('Pembayaran berhasil')}</h2>
            <p className="muted">{t('Pesanan {code} sudah lunas. Anda bisa kembali ke aplikasi ZenQ, halaman pembayaran akan berpindah otomatis.', { code: bill.code })}</p>
            <div className="paytotal">{rp(bill.total)}</div>
          </div>
        )}

        {bill && !paid && bill.status !== 'cancelled' && (
          <>
            <div className="small muted">{t('Pembayaran ke')}</div>
            <b style={{ fontSize: 18 }}>ZenQ · {bill.title}</b>
            <div className="small muted">{t('Kode pesanan')}: {bill.code} · {bill.payer}</div>

            <div className="paylines">
              {bill.items.map((i) => (
                <div key={i.label} className="sumrow"><span>{i.label}</span><span>{rp(i.amount)}</span></div>
              ))}
              <div className="sumrow total"><span>{t('Total')}</span><span>{rp(bill.total)}</span></div>
            </div>

            <button className="btn block" style={{ marginTop: 6 }} onClick={pay} disabled={paying}>
              {paying ? <><Loader2 className="spin" size={18} /> {t('Memproses…')}</> : <><LockKeyhole size={17} /> {t('Bayar {amount}', { amount: rp(bill.total) })}</>}
            </button>
            {payError && <div className="toast err">{payError}</div>}
          </>
        )}

        <p className="small muted payfoot"><ShieldCheck size={14} /> {t('Mode simulasi: tidak ada uang yang ditarik.')}</p>
      </div>
    </div>
  );
}

export default PayPage;
