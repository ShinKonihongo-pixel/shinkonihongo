// FuriganaText - Renders Japanese text with automatic furigana for kanji
// Uses kuroshiro library for automatic reading generation

import { useState, useEffect } from 'react';
import { useReadingSettings } from '../../contexts/reading-settings-context';
import { convertToFurigana, preloadFurigana, isFuriganaReady, getFuriganaError } from '../../services/furigana-service';

// Cache for converted text to avoid re-processing
const furiganaCache = new Map<string, string>();

// Preload kuroshiro on module load
preloadFurigana();

interface FuriganaTextProps {
  text: string;
  className?: string;
}

export function FuriganaText({ text, className = '' }: FuriganaTextProps) {
  const { settings } = useReadingSettings();
  const [furiganaHtml, setFuriganaHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initStatus, setInitStatus] = useState<string>('pending');

  useEffect(() => {
    // Reset state when text changes
    setError(null);
    setInitStatus('checking');

    if (!settings.showFurigana) {
      setFuriganaHtml('');
      setInitStatus('disabled');
      return;
    }

    // Check cache first
    const cached = furiganaCache.get(text);
    if (cached) {
      setFuriganaHtml(cached);
      setInitStatus('cached');
      return;
    }

    // Convert text to furigana
    let isMounted = true;
    setIsLoading(true);
    setInitStatus('loading');

    convertToFurigana(text)
      .then((result) => {
        if (isMounted) {
          furiganaCache.set(text, result);
          setFuriganaHtml(result);
          setInitStatus('success');
          console.log('[FuriganaText] Converted successfully, result length:', result.length);
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
  }, [text, settings.showFurigana]);

  // Style for the text
  const textStyle: React.CSSProperties = {
    lineHeight: settings.showFurigana ? 2.4 : 2,
    whiteSpace: 'pre-wrap',
  };

  // If furigana is disabled, show plain text
  if (!settings.showFurigana) {
    return (
      <span className={className} style={textStyle}>
        {text}
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
        }
        .furigana-text rt {
          font-size: ${settings.furiganaSize}em;
          color: rgba(167, 139, 250, 0.95);
          font-weight: 400;
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
