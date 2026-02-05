// Status bar component for payment status visualization

interface StatusBarProps {
  label: string;
  count: number;
  total: number;
  color: string;
}

export function StatusBar({ label, count, total, color }: StatusBarProps) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '4px',
        fontSize: '12px',
      }}>
        <span>{label}</span>
        <span style={{ color }}>{count}/{total}</span>
      </div>
      <div style={{
        height: '8px',
        background: '#eee',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${percentage}%`,
          background: color,
          borderRadius: '4px',
          transition: 'width 0.3s',
        }} />
      </div>
    </div>
  );
}
