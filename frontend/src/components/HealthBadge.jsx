import { translate } from '../i18n';

const STATUS_CONFIG = {
  checking: { label: 'Mengecek backend…', cls: '' },
  ok: { label: 'Backend Aktif', cls: 'green' },
  error: { label: 'Backend Gak Kedetek', cls: 'red' },
};

// Indikator status backend (cuma ditampilin di mode development)
function HealthBadge({ status }) {
  const { label, cls } = STATUS_CONFIG[status] || STATUS_CONFIG.checking;
  return <span className={`chip ${cls}`}>{translate(label)}</span>;
}

export default HealthBadge;
