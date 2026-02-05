// Filter button component for salary status filtering

interface FilterBtnProps {
  label: string;
  active: boolean;
  onClick: () => void;
  color?: string;
}

export function FilterBtn({ label, active, onClick, color }: FilterBtnProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: '20px',
        border: active ? 'none' : '1px solid #ddd',
        background: active ? (color || '#667eea') : '#fff',
        color: active ? '#fff' : '#666',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
