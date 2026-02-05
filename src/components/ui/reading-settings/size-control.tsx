// Size control component for font/furigana size adjustments

import { Minus, Plus } from 'lucide-react';
import type { ReactNode } from 'react';

interface SizeControlProps {
  label: string;
  description: string;
  icon: ReactNode;
  iconBackground: string;
  currentSize: number;
  minSize: number;
  maxSize: number;
  onIncrease: () => void;
  onDecrease: () => void;
  accentColor: string;
  disabled?: boolean;
}

export function SizeControl({
  label,
  description,
  icon,
  iconBackground,
  currentSize,
  minSize,
  maxSize,
  onIncrease,
  onDecrease,
  accentColor,
  disabled = false,
}: SizeControlProps) {
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
        opacity: disabled ? 0.35 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        transition: 'all 0.3s ease',
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
            background: iconBackground,
            borderRadius: '10px',
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 500 }}>
            {label}
          </div>
          <div style={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.7rem' }}>
            {description}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <button
          onClick={onDecrease}
          disabled={currentSize <= minSize}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${accentColor}1f`,
            border: `1px solid ${accentColor}40`,
            borderRadius: '8px',
            color: currentSize <= minSize ? 'rgba(255, 255, 255, 0.25)' : accentColor,
            cursor: currentSize <= minSize ? 'not-allowed' : 'pointer',
          }}
        >
          <Minus size={14} />
        </button>
        <span
          style={{
            minWidth: '48px',
            textAlign: 'center',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: accentColor,
          }}
        >
          {Math.round(currentSize * 100)}%
        </span>
        <button
          onClick={onIncrease}
          disabled={currentSize >= maxSize}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: `${accentColor}1f`,
            border: `1px solid ${accentColor}40`,
            borderRadius: '8px',
            color: currentSize >= maxSize ? 'rgba(255, 255, 255, 0.25)' : accentColor,
            cursor: currentSize >= maxSize ? 'not-allowed' : 'pointer',
          }}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
