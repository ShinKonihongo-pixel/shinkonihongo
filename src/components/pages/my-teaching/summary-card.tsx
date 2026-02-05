export function SummaryCard({ label, value, icon, color, subtitle }: {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div style={{
      padding: '20px',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      borderLeft: `4px solid ${color}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ fontSize: '12px', color: '#999' }}>{label}</span>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
      {subtitle && (
        <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>{subtitle}</div>
      )}
    </div>
  );
}
