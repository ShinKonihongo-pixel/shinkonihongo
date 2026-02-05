// Statistics card component

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  icon: string;
  gradient?: boolean;
}

export function StatCard({ label, value, sublabel, icon, gradient }: StatCardProps) {
  return (
    <div style={{
      padding: '20px',
      borderRadius: '12px',
      background: gradient
        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        : '#fff',
      color: gradient ? '#fff' : '#333',
      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ fontSize: '12px', opacity: 0.8 }}>{label}</span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700 }}>
        {value}
        {sublabel && (
          <span style={{ fontSize: '14px', fontWeight: 400, marginLeft: '4px', opacity: 0.8 }}>
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
