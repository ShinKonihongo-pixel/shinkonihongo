// Summary card component for displaying salary statistics

interface SummaryCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
  highlight?: boolean;
}

export function SummaryCard({ label, value, icon, color, highlight }: SummaryCardProps) {
  return (
    <div style={{
      padding: '16px',
      borderRadius: '12px',
      background: highlight
        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        : '#fff',
      color: highlight ? '#fff' : '#333',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ fontSize: '12px', opacity: 0.8 }}>{label}</span>
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, color: color }}>
        {value}
      </div>
    </div>
  );
}
