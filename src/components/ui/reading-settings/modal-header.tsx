// Modal header component

import { Settings, X } from 'lucide-react';

interface ModalHeaderProps {
  onClose: () => void;
}

export function ModalHeader({ onClose }: ModalHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.25rem',
        background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.12) 0%, rgba(59, 130, 246, 0.08) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)',
          }}
        >
          <Settings size={18} color="white" />
        </div>
        <span style={{ color: 'white', fontSize: '1rem', fontWeight: 600 }}>
          Cài đặt hiển thị
        </span>
      </div>
      <button
        onClick={onClose}
        style={{
          width: '32px',
          height: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          border: 'none',
          borderRadius: '8px',
          color: 'rgba(255, 255, 255, 0.6)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <X size={18} />
      </button>
    </div>
  );
}
