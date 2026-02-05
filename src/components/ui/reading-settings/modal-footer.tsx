// Modal footer component

interface ModalFooterProps {
  onClose: () => void;
}

export function ModalFooter({ onClose }: ModalFooterProps) {
  return (
    <div
      style={{
        padding: '0.875rem 1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        flexShrink: 0,
      }}
    >
      <button
        onClick={onClose}
        style={{
          width: '100%',
          padding: '0.875rem',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
          border: 'none',
          borderRadius: '12px',
          color: 'white',
          fontSize: '0.95rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(139, 92, 246, 0.35)',
          transition: 'all 0.2s',
        }}
      >
        Xong
      </button>
    </div>
  );
}
