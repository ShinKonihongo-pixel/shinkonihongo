// Action button component for salary row actions

interface ActionBtnProps {
  icon: string;
  title: string;
  onClick: () => void;
}

export function ActionBtn({ icon, title, onClick }: ActionBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        border: 'none',
        background: '#f5f5f5',
        cursor: 'pointer',
        fontSize: '12px',
      }}
    >
      {icon}
    </button>
  );
}
