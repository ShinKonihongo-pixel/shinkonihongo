// Preview section component

import { Sparkles } from 'lucide-react';

interface PreviewSectionProps {
  fontSize: number;
  textColor: string;
  showFurigana: boolean;
  furiganaSize: number;
  furiganaColor: string;
}

export function PreviewSection({
  fontSize,
  textColor,
  showFurigana,
  furiganaSize,
  furiganaColor,
}: PreviewSectionProps) {
  return (
    <div
      style={{
        padding: '1rem',
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(59, 130, 246, 0.06) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.15)',
        borderRadius: '14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          marginBottom: '0.5rem',
        }}
      >
        <Sparkles size={12} color="#8b5cf6" />
        <span
          style={{
            fontSize: '0.7rem',
            color: 'rgba(255, 255, 255, 0.45)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Xem trước
        </span>
      </div>
      <div
        style={{
          fontSize: `${fontSize * 1.5}rem`,
          color: textColor || 'white',
          lineHeight: 2.2,
          textAlign: 'center',
        }}
      >
        {showFurigana ? (
          <ruby style={{ rubyAlign: 'center' }}>
            日本語
            <rp>(</rp>
            <rt style={{ fontSize: `${furiganaSize}em`, color: furiganaColor || '#a78bfa' }}>
              にほんご
            </rt>
            <rp>)</rp>
          </ruby>
        ) : (
          '日本語'
        )}
      </div>
    </div>
  );
}
