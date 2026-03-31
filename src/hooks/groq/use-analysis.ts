// Japanese text analysis hooks (translation, furigana, analysis)

import { useCallback } from 'react';
import { groqFetch } from './groq-fetch';

interface UseAnalysisOptions {
  getApiKey: () => string | undefined;
}

export function useAnalysis({ getApiKey }: UseAnalysisOptions) {
  // Analyze Japanese sentence (translate + grammar breakdown)
  const analyzeJapaneseSentence = useCallback(async (sentence: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('Chưa cấu hình API key');
    }

    const systemPrompt = `You are a Japanese language teacher. Analyze the given Japanese sentence and provide:
1. Vietnamese translation
2. Word-by-word breakdown with readings (furigana) and meanings
3. Grammar points used
4. Usage notes (if any)

Format your response in Vietnamese, clearly and concisely. Use simple formatting.`;

    const result = await groqFetch({
      apiKey,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Phân tích câu: ${sentence}` },
      ],
      temperature: 0.3,
      maxTokens: 800,
    });
    return result || 'Không thể phân tích câu';
  }, [getApiKey]);

  // Generate furigana for Japanese text (kanji → [kanji|reading] format)
  const generateFurigana = useCallback(async (text: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('Chưa cấu hình API key');
    }

    const systemPrompt = `You are a Japanese language expert. Add furigana ONLY to kanji characters.

STRICT RULES:
- ONLY add [kanji|reading] for characters that contain kanji (漢字). NEVER wrap hiragana or katakana.
- For kanji compounds (熟語), wrap the whole compound: [日本語|にほんご]
- For single kanji with okurigana, wrap ONLY the kanji part: [食|た]べる
- NEVER add furigana to pure hiragana words (e.g. ている, ください, それ must stay as-is)
- NEVER add furigana to katakana words (e.g. コーヒー, テレビ must stay as-is)
- Keep all punctuation, numbers, spaces unchanged

Example input: 私はコーヒーを飲みながら日本語を勉強しています。
Example output: [私|わたし]はコーヒーを[飲|の]みながら[日本語|にほんご]を[勉強|べんきょう]しています。

Return ONLY the text with furigana added, nothing else.`;

    const result = await groqFetch({
      apiKey,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.1,
      maxTokens: 2000,
    }) || text;
    // Post-process: strip furigana from non-kanji text (hiragana/katakana only brackets)
    // Kanji Unicode range: \u4e00-\u9faf, \u3400-\u4dbf (CJK unified)
    return result.replace(/\[([^\]|]+)\|[^\]]+\]/g, (match: string, kanjiPart: string) => {
      // Keep bracket only if kanjiPart contains at least one kanji character
      if (/[\u4e00-\u9faf\u3400-\u4dbf]/.test(kanjiPart)) return match;
      return kanjiPart; // Strip furigana, return plain text
    });
  }, [getApiKey]);

  // Quick translate Japanese to Vietnamese (simple translation only)
  const quickTranslate = useCallback(async (sentence: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('Chưa cấu hình API key');
    }

    const result = await groqFetch({
      apiKey,
      messages: [
        { role: 'system', content: 'Translate Japanese to Vietnamese. Return ONLY the translation, nothing else.' },
        { role: 'user', content: sentence },
      ],
      temperature: 0.1,
      maxTokens: 200,
    });
    return result || 'Không thể dịch';
  }, [getApiKey]);

  return {
    analyzeJapaneseSentence,
    generateFurigana,
    quickTranslate,
  };
}
