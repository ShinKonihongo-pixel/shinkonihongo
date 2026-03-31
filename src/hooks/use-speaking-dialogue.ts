// Sub-hook: dialogue generation via Groq API

import { useState, useCallback } from 'react';
import type { JLPTLevel } from '../types/kaiwa';
import type {
  SpeakingTopicId,
  SpeakingDialogue,
  SpeakingDialogueLine,
} from '../types/speaking-practice';
import { removeFurigana } from '../lib/furigana-utils';
import { handleError } from '../utils/error-handler';
import { buildDialoguePrompt } from './use-speaking-dialogue-prompt';

const GROQ_API_URL = import.meta.env.VITE_GROQ_PROXY_URL || 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

function parseDialogueResponse(responseText: string, topicId: SpeakingTopicId, level: JLPTLevel): SpeakingDialogue | null {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[0]);

    const lines: SpeakingDialogueLine[] = data.lines.map((line: { role: string; text: string; translation: string }) => ({
      role: line.role as 'ai' | 'user',
      text: line.text,
      textPlain: removeFurigana(line.text),
      translation: line.translation,
    }));

    return {
      id: `dialogue-${Date.now()}`,
      topic: topicId,
      level,
      title: data.title || '',
      titleVi: data.titleVi || '',
      situation: data.situation || '',
      lines,
      vocabulary: data.vocabulary || [],
      createdAt: new Date().toISOString(),
    };
  } catch {
    handleError('Parse failed', { context: 'useSpeakingPractice/parse', silent: true });
    return null;
  }
}

interface UseSpeakingDialogueOptions {
  apiKey?: string;
}

export function useSpeakingDialogue({ apiKey }: UseSpeakingDialogueOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<SpeakingDialogue | null>(null);

  const getApiKey = useCallback(() => {
    if (import.meta.env.VITE_GROQ_PROXY_URL) return 'proxy';
    return apiKey || import.meta.env.VITE_GROQ_API_KEY;
  }, [apiKey]);

  const generateDialogue = useCallback(async (
    topicId: SpeakingTopicId,
    level: JLPTLevel
  ): Promise<SpeakingDialogue | null> => {
    const key = getApiKey();
    if (!key) {
      setError('Chưa cấu hình API key. Vui lòng thêm VITE_GROQ_API_KEY.');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(key !== 'proxy' && { 'Authorization': `Bearer ${key}` }),
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: buildDialoguePrompt(topicId, level) },
            { role: 'user', content: 'Generate the dialogue now.' },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content;

      if (!responseText) throw new Error('Không nhận được phản hồi từ AI');

      const parsed = parseDialogueResponse(responseText, topicId, level);
      if (!parsed) throw new Error('Không thể xử lý hội thoại');

      setDialogue(parsed);
      return parsed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối';
      setError(`Lỗi: ${message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getApiKey]);

  const resetDialogue = useCallback(() => {
    setDialogue(null);
    setError(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { dialogue, setDialogue, isLoading, error, generateDialogue, resetDialogue, clearError };
}
