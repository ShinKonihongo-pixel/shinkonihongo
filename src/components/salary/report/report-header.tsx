// Report header with month selector and export buttons

interface ReportHeaderProps {
  month: string;
  onMonthChange: (month: string) => void;
  onExport?: (format: 'csv' | 'pdf') => void;
}

export function ReportHeader({ month, onMonthChange, onExport }: ReportHeaderProps) {
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
        <h3 style={{ margin: 0 }}>Báo cáo lương</h3>
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
      {onExport && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onExport('csv')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📊</span> Xuất CSV
          </button>
          <button
            onClick={() => onExport('pdf')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📄</span> Xuất PDF
          </button>
        </div>
      )}
    </div>
  );
}
