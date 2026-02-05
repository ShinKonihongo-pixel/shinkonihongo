import { formatCurrency } from '../../../types/teacher';

export function SalaryDetail({
  label,
  value,
  color,
  negative,
  highlight,
  isText
}: {
  label: string;
  value: number | string;
  color?: string;
  negative?: boolean;
  highlight?: boolean;
  isText?: boolean;
}) {
  return (
    <div style={{
      padding: highlight ? '12px' : '0',
      background: highlight ? '#f5f0ff' : 'transparent',
      borderRadius: highlight ? '8px' : '0',
    }}>
      <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>{label}</div>
      <div style={{
        fontSize: highlight ? '20px' : '16px',
        fontWeight: highlight ? 700 : 500,
        color: color || (highlight ? '#667eea' : '#333'),
      }}>
        {negative && value !== 0 ? '-' : ''}
        {isText ? value : formatCurrency(typeof value === 'number' ? value : 0)}
      </div>
    </div>
  );
}
