// Component to render Japanese text with furigana (reading hints)

import { convertFuriganaToRuby, removeFurigana } from '../../lib/furigana-utils';

interface FuriganaTextProps {
  text: string;
  showFurigana: boolean;
  className?: string;
}

export function FuriganaText({ text, showFurigana, className }: FuriganaTextProps) {
  if (showFurigana) {
    // Convert [kanji|reading] to ruby tags and render as HTML
    const htmlContent = convertFuriganaToRuby(text);
    return (
      <span
        className={className}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    );
  }

  // Remove furigana markup and render plain text
  return <span className={className}>{removeFurigana(text)}</span>;
}
