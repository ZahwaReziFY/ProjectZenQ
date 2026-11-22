import { Loader2 } from 'lucide-react';
import { useLang } from '../i18n';

/**
 * Tampilan seragam buat loading / error / kosong.
 * <StateMessage loading={loading} error={error} empty={!data?.length} emptyIcon={<ClipboardList />} emptyText="..." />
 * Balikin null kalo gak ada kondisi khusus.
 */
function StateMessage({ loading, error, empty, emptyText = 'Belum ada data.', emptyIcon }) {
  const { t } = useLang();
  if (loading) return <div className="card center-msg muted"><Loader2 size={20} className="spin" style={{ verticalAlign: '-4px', marginRight: 8 }} />{t('Memuat…')}</div>;
  if (error) return <div className="toast err">{error}</div>;
  if (empty) {
    return (
      <div className="card center-msg">
        {emptyIcon && <span className="em">{emptyIcon}</span>}
        <p className="muted" style={{ margin: 0 }}>{t(emptyText)}</p>
      </div>
    );
  }
  return null;
}

export default StateMessage;
