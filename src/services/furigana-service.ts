// Furigana Service - Automatic furigana generation for Japanese text using kuroshiro
// Converts kanji to include furigana readings automatically

import Kuroshiro from 'kuroshiro';
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji';

// Singleton instance
let kuroshiroInstance: Kuroshiro | null = null;
let initPromise: Promise<void> | null = null;
let isInitialized = false;
let initError: Error | null = null;

// Initialize kuroshiro with kuromoji analyzer
async function initKuroshiro(): Promise<void> {
  if (isInitialized) return;
  if (initError) throw initError;

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      console.log('[Furigana] Starting Kuroshiro initialization...');
      kuroshiroInstance = new Kuroshiro();

      // Try multiple sources for dictionary (CDN first as they are more reliable)
      const dictPaths = [
        'https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict',
        'https://unpkg.com/kuromoji@0.1.2/dict',
        '/dict', // Local dict folder in public (fallback)
      ];

      let lastError: Error | null = null;

      for (const dictPath of dictPaths) {
        try {
          console.log(`[Furigana] Trying dictionary path: ${dictPath}`);
          const analyzer = new KuromojiAnalyzer({ dictPath });
          console.log(`[Furigana] Created analyzer, now initializing...`);
          await kuroshiroInstance.init(analyzer);
          isInitialized = true;
          console.log(`[Furigana] ✅ Kuroshiro initialized successfully with: ${dictPath}`);
          return;
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.warn(`[Furigana] ❌ Failed to load dictionary from ${dictPath}:`, errMsg);
          lastError = err as Error;
        }
      }

      throw lastError || new Error('Failed to initialize Kuroshiro - all dictionary paths failed');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Furigana] 💥 Failed to initialize Kuroshiro: ${errMsg}`);
      initError = error as Error;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

// Convert Japanese text to HTML with furigana (ruby tags)
export async function convertToFurigana(text: string): Promise<string> {
  if (!text) return '';

  try {
    // Add timeout for initialization (30 seconds max)
    const timeoutPromise = new Promise<void>((_, reject) => {
      setTimeout(() => reject(new Error('Initialization timeout')), 30000);
    });

    await Promise.race([initKuroshiro(), timeoutPromise]);

    if (!kuroshiroInstance || !isInitialized) {
      console.warn('[Furigana] Kuroshiro not initialized, returning plain text');
      return text;
    }

    // Convert to HTML with furigana
    console.log('[Furigana] Converting text, length:', text.length);
    const result = await kuroshiroInstance.convert(text, {
      mode: 'furigana',
      to: 'hiragana',
    });

    console.log('[Furigana] Conversion complete, result has ruby:', result.includes('<ruby>'));
    return result;
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Furigana] Conversion error:', errMsg);
    return text; // Return original text on error
  }
}

// Check if kuroshiro is ready
export function isFuriganaReady(): boolean {
  return isInitialized;
}

// Get initialization error if any
export function getFuriganaError(): Error | null {
  return initError;
}

// Pre-initialize kuroshiro (call this early in app lifecycle)
export function preloadFurigana(): void {
  initKuroshiro().catch((err) => {
    console.warn('Furigana preload failed:', err);
    // Will retry on first use
  });
}
