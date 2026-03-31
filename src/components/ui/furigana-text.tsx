// FuriganaText - Renders Japanese text with furigana for kanji only
// Only supports [kanji|reading] format (set via "Tự động tạo furigana" button)
// No auto-kuroshiro conversion

import { useMemo } from 'react';
import { useReadingSettings } from '../../contexts/reading-settings-context';
import { convertFuriganaToRuby } from '../../lib/furigana-utils';
import './furigana-text.css';

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

  // Convert [kanji|reading] to <ruby> tags (sanitized via DOMPurify)
  const furiganaHtml = convertFuriganaToRuby(text);

  return (
    <span
      className={`furigana-text ${className}`}
      style={{
        ...textStyle,
        '--furigana-size': `${settings.furiganaSize}em`,
        '--furigana-color': settings.furiganaColor || 'rgba(167, 139, 250, 0.95)',
      } as React.CSSProperties}
      dangerouslySetInnerHTML={{ __html: furiganaHtml }}
    />
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
