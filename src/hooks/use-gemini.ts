// Hook for Google Gemini API integration for Kaiwa conversation

import { useState, useCallback, useRef } from 'react';
import type { KaiwaContext, GeminiKaiwaResponse, SuggestedAnswer, KaiwaMessage } from '../types/kaiwa';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

// Build system prompt based on context
function buildSystemPrompt(context: KaiwaContext): string {
  const levelDescriptions: Record<string, string> = {
    N5: 'N5 (beginner, very simple vocabulary and grammar)',
    N4: 'N4 (elementary, basic daily conversation)',
    N3: 'N3 (intermediate, everyday situations)',
    N2: 'N2 (upper-intermediate, complex topics)',
    N1: 'N1 (advanced, nuanced and sophisticated)',
  };

  const styleDescriptions: Record<string, string> = {
    casual: 'casual speech (タメ口, plain form)',
    polite: 'polite speech (丁寧語, です/ます form)',
    formal: 'formal/business Japanese (敬語, keigo)',
  };

  return `You are a Japanese conversation practice partner. Your role is to help the user practice speaking Japanese.

IMPORTANT RULES:
1. ALWAYS respond in Japanese only (no romaji unless specifically asked)
2. Use vocabulary and grammar appropriate for JLPT ${levelDescriptions[context.level]}
3. Use ${styleDescriptions[context.style]}
4. Keep responses SHORT (1-3 sentences max) to encourage back-and-forth conversation
5. Ask follow-up questions to keep the conversation going
6. If the user makes a grammar mistake, gently correct it in parentheses
7. Be encouraging and patient

${context.topic ? `Current conversation topic: ${context.topic}` : 'Start with a simple greeting and ask what the user wants to talk about.'}

After your Japanese response, on a new line starting with "SUGGESTIONS:", provide 2-3 suggested Japanese responses the user could say next. Format each suggestion on its own line with a dash prefix.

After suggestions, on a new line starting with "VIETNAMESE:", provide a brief Vietnamese translation of your Japanese response.`;
}

// Parse Gemini response to extract suggestions and translation
function parseGeminiResponse(text: string): GeminiKaiwaResponse {
  const lines = text.split('\n');
  let mainText = '';
  const suggestions: SuggestedAnswer[] = [];
  let translation = '';
  let section: 'main' | 'suggestions' | 'vietnamese' = 'main';

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('SUGGESTIONS:')) {
      section = 'suggestions';
      continue;
    }
    if (trimmed.startsWith('VIETNAMESE:')) {
      section = 'vietnamese';
      continue;
    }

    if (section === 'main') {
      mainText += (mainText ? '\n' : '') + line;
    } else if (section === 'suggestions' && trimmed.startsWith('-')) {
      const suggestionText = trimmed.substring(1).trim();
      if (suggestionText) {
        suggestions.push({
          id: `sug-${Date.now()}-${suggestions.length}`,
          text: suggestionText,
        });
      }
    } else if (section === 'vietnamese') {
      translation += (translation ? ' ' : '') + trimmed;
    }
  }

  return {
    text: mainText.trim(),
    translation: translation.trim() || undefined,
    suggestions: suggestions.length > 0 ? suggestions : undefined,
  };
}

interface UseGeminiOptions {
  apiKey?: string;
}

export function useGemini(options: UseGeminiOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationHistoryRef = useRef<KaiwaMessage[]>([]);

  // Get API key from options or environment
  const getApiKey = useCallback(() => {
    return options.apiKey || import.meta.env.VITE_GEMINI_API_KEY;
  }, [options.apiKey]);

  // Send message to Gemini
  const sendMessage = useCallback(async (
    userMessage: string,
    context: KaiwaContext
  ): Promise<GeminiKaiwaResponse | null> => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError('Chưa cấu hình API key Gemini. Vui lòng thêm VITE_GEMINI_API_KEY vào file .env');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history for context
      const historyContent = conversationHistoryRef.current.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const requestBody = {
        contents: [
          ...historyContent,
          {
            role: 'user',
            parts: [{ text: userMessage }],
          },
        ],
        systemInstruction: {
          parts: [{ text: buildSystemPrompt(context) }],
        },
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 500,
        },
      };

      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!responseText) {
        throw new Error('Không nhận được phản hồi từ AI');
      }

      const parsed = parseGeminiResponse(responseText);

      // Update conversation history
      conversationHistoryRef.current.push(
        { id: `user-${Date.now()}`, role: 'user', content: userMessage, timestamp: new Date().toISOString() },
        { id: `assistant-${Date.now()}`, role: 'assistant', content: parsed.text, timestamp: new Date().toISOString() }
      );

      return parsed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối';
      setError(`Lỗi: ${message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getApiKey]);

  // Start new conversation
  const startConversation = useCallback(async (context: KaiwaContext): Promise<GeminiKaiwaResponse | null> => {
    // Clear history for new conversation
    conversationHistoryRef.current = [];
    // Send initial greeting prompt
    return sendMessage('こんにちは、会話の練習をしましょう。', context);
  }, [sendMessage]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    conversationHistoryRef.current = [];
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendMessage,
    startConversation,
    clearConversation,
    isLoading,
    error,
    clearError,
  };
}
