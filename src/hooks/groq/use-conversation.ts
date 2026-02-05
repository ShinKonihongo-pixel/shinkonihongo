// Conversation management hook for Groq API

import { useState, useCallback, useRef } from 'react';
import type { KaiwaContext, GeminiKaiwaResponse } from '../../types/kaiwa';
import { GROQ_API_URL, MODEL } from './constants';
import { buildSystemPrompt } from './system-prompt';
import { parseResponse } from './response-parser';

interface UseConversationOptions {
  getApiKey: () => string | undefined;
}

export function useConversation({ getApiKey }: UseConversationOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationHistoryRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearConversation = useCallback(() => {
    conversationHistoryRef.current = [];
  }, []);

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
      // Build messages array with format reminder for continued conversation
      const formatReminder = conversationHistoryRef.current.length > 0
        ? '\n\n[REMINDER: Include ALL sections (RESPONSE, TEMPLATE, HINTS, SUGGESTIONS, QUESTIONS). NO ROMAJI - use katakana. Complete sentences only!]'
        : '';

      const messages = [
        { role: 'system' as const, content: buildSystemPrompt(context) + formatReminder },
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
          max_tokens: 800,
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

  const startConversation = useCallback(async (
    context: KaiwaContext,
    defaultQuestion?: {
      questionJa: string;
      questionVi?: string;
      situationContext?: string;
      suggestedAnswers?: string[];
      advancedTopicContext?: {
        topicName: string;
        topicDescription: string;
        vocabulary: { word: string; reading?: string; meaning: string }[];
      };
    }
  ): Promise<GeminiKaiwaResponse | null> => {
    conversationHistoryRef.current = [];

    // If a default question is provided, instruct AI to ask that question
    if (defaultQuestion) {
      // Build vocabulary list for advanced topic
      let vocabContext = '';
      if (defaultQuestion.advancedTopicContext?.vocabulary?.length) {
        const vocabList = defaultQuestion.advancedTopicContext.vocabulary
          .slice(0, 15) // Limit to 15 words to avoid token overflow
          .map(v => `${v.word}${v.reading ? ` (${v.reading})` : ''} = ${v.meaning}`)
          .join('\n');
        vocabContext = `

TOPIC VOCABULARY (use these words in your responses and suggestions when appropriate):
${vocabList}`;
      }

      // Build the question prompt
      let questionPrompt: string;

      if (defaultQuestion.advancedTopicContext) {
        // Advanced topic mode
        const hasQuestion = defaultQuestion.questionJa && defaultQuestion.questionJa.trim();
        questionPrompt = `This is an ADVANCED CONVERSATION SESSION about "${defaultQuestion.advancedTopicContext.topicName}".
Topic description: ${defaultQuestion.advancedTopicContext.topicDescription}
${vocabContext}

${hasQuestion ? `Please ask the following question to start the conversation:
Question: ${defaultQuestion.questionJa}
${defaultQuestion.questionVi ? `(Vietnamese: ${defaultQuestion.questionVi})` : ''}
${defaultQuestion.situationContext ? `Situation context: ${defaultQuestion.situationContext}` : ''}
${defaultQuestion.suggestedAnswers?.length ? `Sample answers for reference: ${defaultQuestion.suggestedAnswers.join(' / ')}` : ''}

Start with a brief greeting relevant to the topic, then ask this specific question.`
        : `Start a conversation about "${defaultQuestion.advancedTopicContext.topicName}". Greet the user and ask an interesting opening question related to this topic. Use the topic vocabulary when appropriate.`}

IMPORTANT:
- Incorporate topic vocabulary naturally in your suggestions and hints
- Keep the conversation focused on the topic
- Provide relevant template, hints, suggestions, and follow-up questions.`;
      } else {
        // Standard default question mode
        questionPrompt = `Please ask the following question to start the conversation. This is a preset question for conversation practice:

Question: ${defaultQuestion.questionJa}
${defaultQuestion.questionVi ? `(Vietnamese: ${defaultQuestion.questionVi})` : ''}
${defaultQuestion.situationContext ? `Situation context: ${defaultQuestion.situationContext}` : ''}
${defaultQuestion.suggestedAnswers?.length ? `Sample answers for reference: ${defaultQuestion.suggestedAnswers.join(' / ')}` : ''}

Start by greeting the user briefly, then ask this question. Provide template, hints, suggestions, and follow-up questions as usual.`;
      }

      return sendMessage(questionPrompt, context);
    }

    return sendMessage('こんにちは、会話の練習をしましょう。', context);
  }, [sendMessage]);

  return {
    sendMessage,
    startConversation,
    clearConversation,
    isLoading,
    error,
    clearError,
  };
}
