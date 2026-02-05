// Collapsible color picker component

import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ReactNode } from 'react';

interface ColorOption {
  color: string;
  name: string;
}

interface ColorPickerProps {
  label: string;
  description: string;
  icon: ReactNode;
  iconBackground: string;
  currentColor: string;
  colors: ColorOption[];
  isExpanded: boolean;
  onToggle: () => void;
  onColorSelect: (color: string) => void;
  disabled?: boolean;
}

export function ColorPicker({
  label,
  description,
  icon,
  iconBackground,
  currentColor,
  colors,
  isExpanded,
  onToggle,
  onColorSelect,
  disabled = false,
}: ColorPickerProps) {
  const isLightColor = (color: string) => {
    return ['#ffffff', '#f8fafc', '#e2e8f0', '#fef3c7', '#fde68a'].includes(color);
  };

  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: '14px',
        marginBottom: '0.625rem',
        overflow: 'hidden',
        opacity: disabled ? 0.35 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        transition: 'all 0.3s ease',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          padding: '0.875rem 1rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: iconBackground,
            borderRadius: '10px',
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 500 }}>
            {label}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.7rem' }}>
            {description}
          </div>
        </div>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: currentColor,
            border: '2px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        />
        {isExpanded ? (
          <ChevronUp size={14} color="rgba(255,255,255,0.5)" />
        ) : (
          <ChevronDown size={14} color="rgba(255,255,255,0.5)" />
        )}
      </button>

      {isExpanded && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem',
            padding: '0.6rem 1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          {colors.map(({ color, name }) => (
            <button
              key={color}
              onClick={() => onColorSelect(color)}
              title={name}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: color,
                border:
                  currentColor === color
                    ? '3px solid #8b5cf6'
                    : '2px solid rgba(255, 255, 255, 0.15)',
                cursor: 'pointer',
                boxShadow:
                  currentColor === color ? '0 0 12px rgba(139, 92, 246, 0.5)' : 'none',
                transition: 'all 0.2s ease',
                position: 'relative',
              }}
            >
              {currentColor === color && (
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isLightColor(color) ? '#1a1a2e' : '#fff',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    textShadow: isLightColor(color) ? 'none' : '0 1px 2px rgba(0,0,0,0.3)',
                  }}
                >
                  ✓
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
