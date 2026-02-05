// Header component for salary calculator with month selector and generate button

interface CalcHeaderProps {
  month: string;
  onMonthChange: (month: string) => void;
  onGenerateAll?: () => void;
}

export function CalcHeader({ month, onMonthChange, onGenerateAll }: CalcHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <h3 style={{ margin: 0 }}>Bảng lương</h3>
        <input
          type="month"
          value={month}
          onChange={(e) => onMonthChange(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '14px',
          }}
        />
      </div>
      {onGenerateAll && (
        <button
          onClick={onGenerateAll}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Tạo lương cho tất cả
        </button>
      )}
    </div>
  );
}
