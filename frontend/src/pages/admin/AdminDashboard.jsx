import { useFetch } from '../../hooks/useFetch';
import StateMessage from '../../components/StateMessage';
import { rp } from '../../utils/format';
import { useLang } from '../../i18n';

const STATS = [
  ['patients', 'Pasien', (v) => v],
  ['doctors', 'Dokter', (v) => v],
  ['orders', 'Total Pesanan', (v) => v],
  ['processing_orders', 'Pesanan Diproses', (v) => v],
  ['revenue', 'Pendapatan (simulasi)', rp],
];

function AdminDashboard() {
  const { t } = useLang();
  const { data, loading, error } = useFetch('/admin/stats');
  return (
    <div className="wrap">
      <h1 className="title">{t('Panel Admin')}</h1>
      <p className="sub">{t('Ringkasan layanan ZenQ.')}</p>
      <StateMessage loading={loading} error={error} />
      {data && (
        <div className="grid g3">
          {STATS.map(([key, label, fmt]) => (
            <div key={key} className="stat card" style={{ textAlign: 'left' }}>
              <span className="small muted">{t(label)}</span>
              <b style={{ fontSize: 28 }}>{fmt(data[key])}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
