// Utility functions for parsing and rendering furigana
import DOMPurify from 'dompurify';

/**
 * Convert furigana markup [kanji|reading] to HTML ruby tags
 * Input: "どんなスポーツが[好|す]きですか？"
 * Output: "どんなスポーツが<ruby>好<rt>す</rt></ruby>きですか？"
 * Sanitized to prevent XSS attacks
 */
export function convertFuriganaToRuby(text: string): string {
  // Match [kanji|reading] pattern
  const html = text.replace(/\[([^\]|]+)\|([^\]]+)\]/g, '<ruby>$1<rt>$2</rt></ruby>');
  // Sanitize to prevent XSS
  return DOMPurify.sanitize(html, { ALLOWED_TAGS: ['ruby', 'rt', 'rp', 'br'] });
}

/**
 * Remove furigana markup, keeping only kanji
 * Input: "どんなスポーツが[好|す]きですか？"
 * Output: "どんなスポーツが好きですか？"
 * Sanitized to prevent XSS attacks
 */
export function removeFurigana(text: string): string {
  const plainText = text.replace(/\[([^\]|]+)\|[^\]]+\]/g, '$1');
  // Sanitize to prevent XSS (allow only br for line breaks)
  return DOMPurify.sanitize(plainText, { ALLOWED_TAGS: ['br'] });
}

/**
 * Check if text contains furigana markup
 */
export function hasFurigana(text: string): boolean {
  return /\[[^\]|]+\|[^\]]+\]/.test(text);
}
