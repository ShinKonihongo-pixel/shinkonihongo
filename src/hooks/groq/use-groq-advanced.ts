// Hook for Groq API - Advanced Kaiwa Teacher AI
// Manages conversation state, API calls, and question bank navigation

import { useState, useCallback, useRef } from 'react';
import type { GeminiKaiwaResponse, KaiwaContext } from '../../types/kaiwa';
import type { KaiwaAdvancedTopic, KaiwaQuestionBankItem } from '../../types/kaiwa-advanced';
import { buildAdvancedTeacherPrompt } from './groq-advanced-prompts';
import { parseAdvancedResponse } from './groq-advanced-parser';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// Advanced topic context for the AI
export interface AdvancedTopicContext {
  topic: KaiwaAdvancedTopic;
  currentQuestionIndex: number;
  usedQuestionIds: string[];
}

interface UseGroqAdvancedOptions {
  apiKey?: string;
}

export function useGroqAdvanced(options: UseGroqAdvancedOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationHistoryRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const topicContextRef = useRef<AdvancedTopicContext | null>(null);

  const getApiKey = useCallback(() => {
    return options.apiKey || import.meta.env.VITE_GROQ_API_KEY;
  }, [options.apiKey]);

  // Call Groq API with messages and return parsed response
  const callGroqApi = useCallback(async (
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
  ): Promise<GeminiKaiwaResponse | null> => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError('Chưa cấu hình API key Groq');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature: 0.75,
          max_tokens: 1000,
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

      return parseAdvancedResponse(responseText);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối';
      setError(`Lỗi: ${message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getApiKey]);

  // Send message with advanced topic context (continued conversation)
  const sendMessage = useCallback(async (
    userMessage: string,
    context: KaiwaContext,
    topic: KaiwaAdvancedTopic
  ): Promise<GeminiKaiwaResponse | null> => {
    const formatReminder = conversationHistoryRef.current.length > 0
      ? `\n\n---
⚠️ REMINDER FOR CONTINUED CONVERSATION:
1. まず学生の答えにリアクション（へえ！/そうですか！/いいですね！）
2. 自分の経験や意見を共有
3. 関連する質問で会話を深める
4. 必ず全セクション含める: RESPONSE, TEMPLATE, HINTS, SUGGESTIONS, QUESTIONS
5. 語彙リストの単語をSUGGESTIONSで使う
6. ふりがな徹底: [漢字|よみ]
---`
      : '';

    const messages = [
      { role: 'system' as const, content: buildAdvancedTeacherPrompt(topic, context) + formatReminder },
      ...conversationHistoryRef.current,
      { role: 'user' as const, content: userMessage },
    ];

    const parsed = await callGroqApi(messages);

    if (parsed) {
      conversationHistoryRef.current.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: parsed.text }
      );
    }

    return parsed;
  }, [callGroqApi]);

  // Build opening prompt for a new conversation
  const buildOpeningPrompt = useCallback((
    topic: KaiwaAdvancedTopic,
    context: KaiwaContext,
    question?: KaiwaQuestionBankItem
  ): string => {
    const questionText = question
      ? `質問: ${question.questionJa}\n${question.questionVi ? `（参考訳: ${question.questionVi}）` : ''}`
      : '';

    const questionInstruction = question
      ? `3. 以下の質問を自然な流れで聞いてください：\n\n${questionText}`
      : `3. 自分の経験を少し話してから、学生に質問`;

    return `🎓 新しいレッスンを始めます！

【設定】
- あなたはShinkoです
- 学生は${context.level}レベルのベトナム人学習者です
- トピック「${topic.name}」について会話練習をします

【最初のメッセージ】
1. 温かく挨拶してください（こんにちは！Shinkoです。今日もよろしくお願いします！など）
2. 今日のトピック「${topic.name}」について軽く触れる
${questionInstruction}

【重要】
- 語彙リストの単語をSUGGESTIONSに必ず含める
- 親しみやすく、緊張させない雰囲気で
- 学生が答えやすい質問から始める`;
  }, []);

  // Start conversation with a question from the question bank
  const startAdvancedConversation = useCallback(async (
    topic: KaiwaAdvancedTopic,
    context: KaiwaContext,
    specificQuestion?: KaiwaQuestionBankItem
  ): Promise<GeminiKaiwaResponse | null> => {
    conversationHistoryRef.current = [];
    topicContextRef.current = {
      topic,
      currentQuestionIndex: 0,
      usedQuestionIds: specificQuestion ? [specificQuestion.id] : [],
    };

    // Pick question: specific, random from bank, or none
    let question = specificQuestion;
    if (!question && topic.questionBank.length > 0) {
      question = topic.questionBank[Math.floor(Math.random() * topic.questionBank.length)];
      topicContextRef.current.usedQuestionIds.push(question.id);
    }

    const messages = [
      { role: 'system' as const, content: buildAdvancedTeacherPrompt(topic, context) },
      { role: 'user' as const, content: buildOpeningPrompt(topic, context, question) },
    ];

    const parsed = await callGroqApi(messages);

    if (parsed) {
      conversationHistoryRef.current.push(
        { role: 'assistant', content: parsed.text }
      );
    }

    return parsed;
  }, [callGroqApi, buildOpeningPrompt]);

  // Get next question from question bank
  const getNextQuestion = useCallback((): KaiwaQuestionBankItem | null => {
    if (!topicContextRef.current) return null;

    const { topic, usedQuestionIds } = topicContextRef.current;
    const availableQuestions = topic.questionBank.filter(q => !usedQuestionIds.includes(q.id));

    if (availableQuestions.length === 0) return null;

    const nextQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    topicContextRef.current.usedQuestionIds.push(nextQuestion.id);
    topicContextRef.current.currentQuestionIndex++;

    return nextQuestion;
  }, []);

  // Clear conversation
  const clearConversation = useCallback(() => {
    conversationHistoryRef.current = [];
    topicContextRef.current = null;
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sendMessage,
    startAdvancedConversation,
    getNextQuestion,
    clearConversation,
    isLoading,
    error,
    clearError,
  };
}
