// Japanese text analysis hooks (translation, furigana, analysis)

import { useCallback } from 'react';
import { GROQ_API_URL, MODEL } from './constants';

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

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Phân tích câu: ${sentence}` },
        ],
        temperature: 0.3,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'Không thể phân tích câu';
  }, [getApiKey]);

  // Generate furigana for Japanese text (kanji → [kanji|reading] format)
  const generateFurigana = useCallback(async (text: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('Chưa cấu hình API key');
    }

    const systemPrompt = `You are a Japanese language expert. Add furigana readings to ALL kanji in the given text.

RULES:
- Use the format [kanji|reading] for EVERY kanji/kanji compound
- Keep all hiragana, katakana, numbers, and punctuation unchanged
- For kanji compounds (熟語), add furigana to the whole compound, e.g. [日本語|にほんご]
- For single kanji with okurigana, include only the kanji in brackets: [食|た]べる
- Be accurate with readings based on context

Example input: 私は日本語を勉強しています。
Example output: [私|わたし]は[日本語|にほんご]を[勉強|べんきょう]しています。

Return ONLY the text with furigana added, nothing else.`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error('Lỗi tạo furigana');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || text;
  }, [getApiKey]);

  // Quick translate Japanese to Vietnamese (simple translation only)
  const quickTranslate = useCallback(async (sentence: string): Promise<string> => {
    const apiKey = getApiKey();
    if (!apiKey) {
      throw new Error('Chưa cấu hình API key');
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: 'Translate Japanese to Vietnamese. Return ONLY the translation, nothing else.' },
          { role: 'user', content: sentence },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error('Lỗi dịch');
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || 'Không thể dịch';
  }, [getApiKey]);

  return {
    analyzeJapaneseSentence,
    generateFurigana,
    quickTranslate,
  };
}
