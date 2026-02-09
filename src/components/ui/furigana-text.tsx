// FuriganaText - Renders Japanese text with automatic furigana for kanji
// Supports both [kanji|reading] format and automatic kuroshiro conversion

import { useState, useEffect, useMemo } from 'react';
import { useReadingSettings } from '../../contexts/reading-settings-context';
import { convertToFurigana, preloadFurigana, isFuriganaReady, getFuriganaError } from '../../services/furigana-service';

// Cache for converted text to avoid re-processing
const furiganaCache = new Map<string, string>();

// Preload kuroshiro on module load
preloadFurigana();

// Check if text contains [kanji|reading] format
function hasManualFurigana(text: string): boolean {
  return /\[[^\]]+\|[^\]]+\]/.test(text);
}

// Convert [kanji|reading] format to ruby HTML
function convertManualFuriganaToHtml(text: string): string {
  // Replace [kanji|reading] with <ruby>kanji<rt>reading</rt></ruby>
  return text.replace(/\[([^\]|]+)\|([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
}

interface FuriganaTextProps {
  text: string;
  className?: string;
}

export function FuriganaText({ text, className = '' }: FuriganaTextProps) {
  const { settings } = useReadingSettings();
  const [furiganaHtml, setFuriganaHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setInitStatus] = useState<string>('pending');

  // Check if text has manual furigana format [kanji|reading]
  const hasManualFormat = useMemo(() => hasManualFurigana(text), [text]);

  useEffect(() => {
    // Reset state when text changes
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null);
    setInitStatus('checking');

    if (!settings.showFurigana) {
      // If furigana disabled, strip the [kanji|reading] format and show only kanji
      if (hasManualFormat) {
        const strippedText = text.replace(/\[([^\]|]+)\|[^\]]+\]/g, '$1');
        setFuriganaHtml(strippedText);
      } else {
        setFuriganaHtml('');
      }
      setInitStatus('disabled');
      return;
    }

    // If text has manual [kanji|reading] format, convert directly to HTML
    if (hasManualFormat) {
      const html = convertManualFuriganaToHtml(text);
      setFuriganaHtml(html);
      setInitStatus('manual');
      return;
    }

    // Check cache first
    const cached = furiganaCache.get(text);
    if (cached) {
      setFuriganaHtml(cached);
      setInitStatus('cached');
      return;
    }

    // Convert text to furigana using kuroshiro
    let isMounted = true;
    setIsLoading(true);
    setInitStatus('loading');

    convertToFurigana(text)
      .then((result) => {
        if (isMounted) {
          furiganaCache.set(text, result);
          setFuriganaHtml(result);
          setInitStatus('success');
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('[FuriganaText] Furigana error:', err);
          setError('Failed to load furigana');
          setFuriganaHtml('');
          setInitStatus('error: ' + (err instanceof Error ? err.message : String(err)));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [text, settings.showFurigana, hasManualFormat]);

  // Style for the text
  const textStyle: React.CSSProperties = {
    lineHeight: settings.showFurigana ? 2.4 : 2,
    whiteSpace: 'pre-wrap',
    color: settings.textColor || 'white',
  };

  // If furigana is disabled, show plain text (strip [kanji|reading] format if exists)
  if (!settings.showFurigana) {
    const displayText = hasManualFormat ? text.replace(/\[([^\]|]+)\|[^\]]+\]/g, '$1') : text;
    return (
      <span className={className} style={textStyle}>
        {displayText}
      </span>
    );
  }

  // Show loading state with initialization status
  if (isLoading && !furiganaHtml) {
    const initError = getFuriganaError();
    const ready = isFuriganaReady();
    return (
      <span className={className} style={{ ...textStyle, opacity: 0.8 }}>
        {text}
        <span style={{
          marginLeft: '0.5rem',
          fontSize: '0.7em',
          color: initError ? 'rgba(239, 68, 68, 0.8)' : 'rgba(139, 92, 246, 0.7)',
          animation: initError ? 'none' : 'pulse 1s infinite'
        }}>
          {initError ? `エラー: ${initError.message?.substring(0, 30)}` : ready ? '変換中...' : '辞書読込中...'}
        </span>
      </span>
    );
  }

  // Show error state but still display text
  if (error && !furiganaHtml) {
    return (
      <span className={className} style={textStyle}>
        {text}
      </span>
    );
  }

  // Render furigana HTML with custom styling for ruby tags
  return (
    <>
      <span
        className={`furigana-text ${className}`}
        style={textStyle}
        dangerouslySetInnerHTML={{ __html: furiganaHtml || text }}
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
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
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
