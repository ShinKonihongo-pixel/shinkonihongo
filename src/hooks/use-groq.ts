// Hook for Groq API integration for Kaiwa conversation (Llama 3.3)

import { useState, useCallback, useRef } from 'react';
import type { KaiwaContext, GeminiKaiwaResponse, SuggestedAnswer, AnswerTemplate, VocabularyHint } from '../types/kaiwa';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// Topic descriptions for system prompt
const TOPIC_PROMPTS: Record<string, string> = {
  free: 'Start with a simple greeting and ask what the user wants to talk about.',
  greetings: 'Practice greetings (挨拶). Start by greeting the user and practice various greeting expressions for different times of day and situations.',
  self_intro: 'Practice self-introduction (自己紹介). Ask about the user\'s name, job, hobbies, and where they live.',
  shopping: 'Practice shopping conversation (買い物). Role-play as a shop staff. Ask what they are looking for, discuss sizes, colors, and prices.',
  restaurant: 'Practice restaurant conversation (レストラン). Role-play as a waiter/waitress. Take orders, recommend dishes, and handle payment.',
  travel: 'Practice travel conversation (旅行). Discuss travel plans, ask about destinations, transportation, and sightseeing.',
  work: 'Practice work/business conversation (仕事). Discuss jobs, workplace situations, meetings, and professional topics.',
  hobbies: 'Practice talking about hobbies (趣味). Ask about interests, sports, music, movies, and free time activities.',
  weather: 'Practice weather conversation (天気). Discuss today\'s weather, seasons, and weather-related small talk.',
  directions: 'Practice asking/giving directions (道案内). Role-play asking for directions to stations, shops, or landmarks.',
};

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

  const topicPrompt = TOPIC_PROMPTS[context.topic] || TOPIC_PROMPTS.free;

  return `You are a Japanese conversation practice partner helping users practice speaking Japanese.

RULES:
- Respond in Japanese only (no romaji, no Vietnamese, no explanations in parentheses)
- Use JLPT ${levelDescriptions[context.level]} vocabulary/grammar
- Use ${styleDescriptions[context.style]}
- Keep responses SHORT (1-2 sentences), ask questions to continue conversation
- Add furigana for ALL kanji using format: [kanji|reading] e.g. [今日|きょう]

TOPIC: ${topicPrompt}

YOU MUST ALWAYS USE THIS EXACT FORMAT:

---RESPONSE---
[Your Japanese message with furigana - ask a question to the user]

---TEMPLATE---
[Sentence pattern with ... for blank, include furigana for kanji]

---HINTS---
- [word1] = [Vietnamese meaning]
- [word2] = [Vietnamese meaning]
- [word3] = [Vietnamese meaning]

---QUESTIONS---
- [Câu hỏi tiếng Nhật user có thể hỏi lại bạn]
- [Câu hỏi tiếng Nhật user có thể hỏi lại bạn]

EXAMPLE OUTPUT:
---RESPONSE---
どんなスポーツが[好|す]きですか？

---TEMPLATE---
...が[好|す]きです。

---HINTS---
- サッカー = bóng đá
- [野球|やきゅう] = bóng chày
- テニス = tennis

---QUESTIONS---
- あなたは[何|なに]が[好|す]きですか？
- どうしてですか？`;
}

// Parse response to extract template, hints, suggestions, and questions
function parseResponse(text: string): GeminiKaiwaResponse {
  const lines = text.split('\n');
  let mainText = '';
  const suggestions: SuggestedAnswer[] = [];
  const hints: VocabularyHint[] = [];
  const questions: string[] = [];
  let templatePattern = '';
  let section: 'response' | 'template' | 'hints' | 'suggestions' | 'questions' = 'response';

  for (const line of lines) {
    const trimmed = line.trim();
    const upperTrimmed = trimmed.toUpperCase();

    // Section detection with new format (---SECTION---)
    if (upperTrimmed.includes('---RESPONSE---') || upperTrimmed.includes('RESPONSE:')) {
      section = 'response';
      continue;
    }
    if (upperTrimmed.includes('---TEMPLATE---') || upperTrimmed.includes('TEMPLATE:')) {
      section = 'template';
      continue;
    }
    if (upperTrimmed.includes('---HINTS---') || upperTrimmed.includes('HINTS:')) {
      section = 'hints';
      continue;
    }
    if (upperTrimmed.includes('---SUGGESTIONS---') || upperTrimmed.includes('SUGGESTIONS:')) {
      section = 'suggestions';
      continue;
    }
    if (upperTrimmed.includes('---QUESTIONS---') || upperTrimmed.includes('QUESTIONS:')) {
      section = 'questions';
      continue;
    }

    // Skip empty lines and section markers
    if (!trimmed || trimmed.startsWith('---')) continue;

    // Parse content based on section
    if (section === 'response') {
      // Skip instruction-like lines
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) continue;
      mainText += (mainText ? '\n' : '') + trimmed;
    } else if (section === 'template') {
      // Extract pattern - could be direct or with "pattern:" prefix
      // Allow furigana format [kanji|reading] which starts with [
      if (trimmed.toLowerCase().startsWith('pattern:')) {
        templatePattern = trimmed.substring(8).trim();
      } else if (!trimmed.startsWith('-')) {
        // Accept any pattern including those with furigana [kanji|reading]
        templatePattern = trimmed;
      }
    } else if (section === 'hints' && trimmed.startsWith('-')) {
      // Parse "- word = meaning" format
      const hintText = trimmed.substring(1).trim();
      const eqIndex = hintText.indexOf('=');
      if (eqIndex > 0) {
        const word = hintText.substring(0, eqIndex).trim();
        const meaning = hintText.substring(eqIndex + 1).trim();
        if (word && meaning) {
          hints.push({ word, meaning });
        }
      }
    } else if (section === 'suggestions' && trimmed.startsWith('-')) {
      const suggestionText = trimmed.substring(1).trim();
      if (suggestionText && !suggestionText.startsWith('[')) {
        suggestions.push({
          id: `sug-${Date.now()}-${suggestions.length}`,
          text: suggestionText,
        });
      }
    } else if (section === 'questions' && trimmed.startsWith('-')) {
      // Parse "- question" format - allow furigana [kanji|reading]
      const questionText = trimmed.substring(1).trim();
      if (questionText) {
        questions.push(questionText);
      }
    }
  }

  // Build answer template if pattern exists
  let answerTemplate: AnswerTemplate | undefined;
  if (templatePattern) {
    answerTemplate = {
      pattern: templatePattern,
      hints: hints,
    };
  }

  return {
    text: mainText.trim(),
    suggestions: suggestions.length > 0 ? suggestions : undefined,
    answerTemplate,
    suggestedQuestions: questions.length > 0 ? questions : undefined,
  };
}

interface UseGroqOptions {
  apiKey?: string;
}

export function useGroq(options: UseGroqOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationHistoryRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);

  // Get API key from options or environment
  const getApiKey = useCallback(() => {
    return options.apiKey || import.meta.env.VITE_GROQ_API_KEY;
  }, [options.apiKey]);

  // Send message to Groq
  const sendMessage = useCallback(async (
    userMessage: string,
    context: KaiwaContext
  ): Promise<GeminiKaiwaResponse | null> => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError('Chưa cấu hình API key Groq. Vui lòng thêm VITE_GROQ_API_KEY vào file .env');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build messages array
      const messages = [
        { role: 'system' as const, content: buildSystemPrompt(context) },
        ...conversationHistoryRef.current,
        { role: 'user' as const, content: userMessage },
      ];

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content;

      if (!responseText) {
        throw new Error('Không nhận được phản hồi từ AI');
      }

      const parsed = parseResponse(responseText);

      // Update conversation history
      conversationHistoryRef.current.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: parsed.text }
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
    conversationHistoryRef.current = [];
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
    sendMessage,
    startConversation,
    clearConversation,
    analyzeJapaneseSentence,
    quickTranslate,
    isLoading,
    error,
    clearError,
  };
}
