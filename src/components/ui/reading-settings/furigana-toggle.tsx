// Furigana toggle component

import { Eye, EyeOff } from 'lucide-react';

interface FuriganaToggleProps {
  showFurigana: boolean;
  onToggle: () => void;
}

export function FuriganaToggle({ showFurigana, onToggle }: FuriganaToggleProps) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.875rem 1rem',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '14px',
        marginBottom: '0.625rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: showFurigana
              ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
              : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '10px',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: 'white',
            transition: 'all 0.3s ease',
          }}
        >
          あ
        </div>
        <div>
          <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 500 }}>
            Furigana
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.7rem' }}>
            Hiện chữ đọc trên Kanji
          </div>
        </div>
      </div>
      <button
        onClick={onToggle}
        style={{
          width: '52px',
          height: '28px',
          borderRadius: '14px',
          border: 'none',
          background: showFurigana
            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
            : 'rgba(255, 255, 255, 0.1)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.3s ease',
          boxShadow: showFurigana ? '0 2px 10px rgba(34, 197, 94, 0.35)' : 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '3px',
            left: showFurigana ? 'calc(100% - 25px)' : '3px',
            width: '22px',
            height: '22px',
            background: 'white',
            borderRadius: '50%',
            transition: 'all 0.3s ease',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {showFurigana ? (
            <Eye size={12} color="#22c55e" />
          ) : (
            <EyeOff size={12} color="#666" />
          )}
        </div>
      </button>
    </div>
  );
}
