// Tab button component for view mode switching

interface TabButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function TabButton({ label, active, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: '8px',
        border: 'none',
        background: active ? '#fff' : 'transparent',
        color: active ? '#333' : '#666',
        fontWeight: active ? 600 : 400,
        fontSize: '13px',
        cursor: 'pointer',
        boxShadow: active ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
      }}
    >
      {label}
    </button>
  );
}
