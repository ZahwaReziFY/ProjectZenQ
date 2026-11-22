import { ORDER_STATUS } from '../utils/format';

function StatusChip({ status, style }) {
  const s = ORDER_STATUS[status] || { label: status, cls: '' };
  return <span className={`chip ${s.cls}`} style={style}>{s.label}</span>;
}

export default StatusChip;
