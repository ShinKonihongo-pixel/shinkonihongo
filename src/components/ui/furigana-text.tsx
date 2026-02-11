// FuriganaText - Renders Japanese text with furigana for kanji only
// Only supports [kanji|reading] format (set via "Tự động tạo furigana" button)
// No auto-kuroshiro conversion

import { useMemo } from 'react';
import { useReadingSettings } from '../../contexts/reading-settings-context';

// Convert [kanji|reading] format to ruby HTML
function convertManualFuriganaToHtml(text: string): string {
  return text.replace(/\[([^\]|]+)\|([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
}

// Strip [kanji|reading] format, keep only kanji part
function stripFurigana(text: string): string {
  return text.replace(/\[([^\]|]+)\|[^\]]+\]/g, '$1');
}

// Check if text contains [kanji|reading] format
function hasManualFurigana(text: string): boolean {
  return /\[[^\]]+\|[^\]]+\]/.test(text);
}

interface FuriganaTextProps {
  text: string;
  className?: string;
}

export function FuriganaText({ text, className = '' }: FuriganaTextProps) {
  const { settings } = useReadingSettings();

  const hasManualFormat = useMemo(() => hasManualFurigana(text), [text]);

  // Style for the text
  const textStyle: React.CSSProperties = {
    lineHeight: settings.showFurigana && hasManualFormat ? 2.4 : 2,
    whiteSpace: 'pre-wrap',
    color: settings.textColor || 'white',
  };

  // If furigana disabled or no manual format, show plain text
  if (!settings.showFurigana || !hasManualFormat) {
    const displayText = hasManualFormat ? stripFurigana(text) : text;
    return (
      <span className={className} style={textStyle}>
        {displayText}
      </span>
    );
  }

  // Convert [kanji|reading] to <ruby> tags
  const furiganaHtml = convertManualFuriganaToHtml(text);

  return (
    <>
      <span
        className={`furigana-text ${className}`}
        style={textStyle}
        dangerouslySetInnerHTML={{ __html: furiganaHtml }}
      />
      <style>{`
        .furigana-text ruby {
          ruby-align: center;
          ruby-position: over;
        }
        .furigana-text rt {
          font-size: ${settings.furiganaSize}em;
          color: ${settings.furiganaColor || 'rgba(167, 139, 250, 0.95)'};
          font-weight: 400;
          text-align: center;
          ruby-align: center;
        }
      `}</style>
    </>
  );
}

// Simple text component that just applies font size (no furigana)
export function StyledText({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { settings } = useReadingSettings();

  return (
    <span
      className={className}
      style={{ fontSize: `${settings.fontSize}em` }}
    >
      {children}
    </span>
  );
}
