// Utility functions for parsing and rendering furigana

/**
 * Convert furigana markup [kanji|reading] to HTML ruby tags
 * Input: "どんなスポーツが[好|す]きですか？"
 * Output: "どんなスポーツが<ruby>好<rt>す</rt></ruby>きですか？"
 */
export function convertFuriganaToRuby(text: string): string {
  // Match [kanji|reading] pattern
  return text.replace(/\[([^\]|]+)\|([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
}

/**
 * Remove furigana markup, keeping only kanji
 * Input: "どんなスポーツが[好|す]きですか？"
 * Output: "どんなスポーツが好きですか？"
 */
export function removeFurigana(text: string): string {
  return text.replace(/\[([^\]|]+)\|[^\]]+\]/g, '$1');
}

/**
 * Check if text contains furigana markup
 */
export function hasFurigana(text: string): boolean {
  return /\[[^\]|]+\|[^\]]+\]/.test(text);
}
