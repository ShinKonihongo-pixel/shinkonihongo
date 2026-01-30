// Hook for Groq API - Advanced Kaiwa Teacher AI
// Specialized AI for custom/advanced topics with professional teaching approach

import { useState, useCallback, useRef } from 'react';
import type { GeminiKaiwaResponse, SuggestedAnswer, AnswerTemplate, VocabularyHint, KaiwaContext } from '../types/kaiwa';
import type { KaiwaAdvancedTopic, KaiwaQuestionBankItem } from '../types/kaiwa-advanced';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// Advanced topic context for the AI
export interface AdvancedTopicContext {
  topic: KaiwaAdvancedTopic;
  currentQuestionIndex: number;
  usedQuestionIds: string[];
}

// Build professional teacher system prompt for advanced topics
function buildAdvancedTeacherPrompt(
  topic: KaiwaAdvancedTopic,
  context: KaiwaContext
): string {
  const levelDescriptions: Record<string, string> = {
    N5: 'N5 (sơ cấp - chỉ dùng từ vựng và ngữ pháp rất cơ bản)',
    N4: 'N4 (sơ trung cấp - giao tiếp hàng ngày đơn giản)',
    N3: 'N3 (trung cấp - tình huống thường nhật)',
    N2: 'N2 (trung cao cấp - chủ đề phức tạp)',
    N1: 'N1 (cao cấp - tinh tế và sâu sắc)',
  };

  const styleDescriptions: Record<string, string> = {
    casual: 'thể thông thường (タメ口)',
    polite: 'thể lịch sự (です/ます)',
    formal: 'thể trang trọng/kính ngữ (敬語)',
  };

  // Build vocabulary list
  const vocabList = topic.vocabulary
    .slice(0, 20)
    .map(v => `・${v.word}${v.reading ? ` (${v.reading})` : ''} = ${v.meaning}`)
    .join('\n');

  // Build question bank hints
  const questionHints = topic.questionBank
    .slice(0, 10)
    .map(q => `・${q.questionJa}${q.questionVi ? ` (${q.questionVi})` : ''}`)
    .join('\n');

  // Build answer bank patterns
  const answerPatterns = topic.answerBank
    .slice(0, 10)
    .map(a => `・${a.answerJa}${a.answerVi ? ` (${a.answerVi})` : ''}`)
    .join('\n');

  return `あなたは外国人に会話を教える専門の日本語教師です。10年以上の経験があり、学生が自然に話せるよう導くのが得意です。

【あなたの役割 - ROLE】
- プロの会話教師として、学生と自然な会話を楽しく進める
- 学生の答えに共感し、興味を示しながら会話を深める
- 無理なく新しい表現や語彙を会話の中で紹介する
- 間違いがあれば優しく直し、正しい表現を教える

【今回のレッスン - LESSON INFO】
📚 トピック: ${topic.name}
📝 説明: ${topic.description}
🎯 レベル: ${levelDescriptions[context.level]}
💬 スタイル: ${styleDescriptions[context.style]}

【使用すべき語彙リスト - VOCABULARY】
以下の語彙を会話の中で自然に使ってください：
${vocabList || '（語彙リストなし）'}

【質問パターン - QUESTION PATTERNS】
レッスンで使える質問例：
${questionHints || '（質問バンクなし）'}

【回答パターン参考 - ANSWER PATTERNS】
学生が使えそうな回答パターン：
${answerPatterns || '（回答バンクなし）'}

【会話のルール - RULES】
1. ローマ字禁止！ひらがな・カタカナ・漢字のみ使用
2. すべての漢字にふりがな：[漢字|よみ] 例: [今日|きょう]
3. 文は必ず完結させる（途中で切らない）
4. レベルに合った語彙・文法を使用
5. 語彙リストの単語を積極的に使う
6. 学生の答えに必ずリアクションしてから次に進む

【教師としての話し方 - SPEAKING STYLE】
- まず学生の答えに共感・反応する（へえ！/そうですか！/いいですね！）
- 自分の経験や意見を少し共有する
- 関連する新しい質問で会話を広げる
- 語彙リストの言葉を自然に会話に織り込む

【回答フォーマット - RESPONSE FORMAT】
必ず以下のセクションをすべて含めてください：

---RESPONSE---
[学生への反応] + [自分の意見・経験] + [次の質問]

---TEMPLATE---
[回答テンプレート - ①、②で空欄を表示]

---HINTS---
① [最初の空欄用オプション]
- 単語1 = 意味
- 単語2 = 意味
② [2番目の空欄用オプション]（あれば）
- 単語1 = 意味

---SUGGESTIONS---
語彙リストの単語を使った回答例を4-5個提示：
- 【シンプル】短い直接回答
- 【理由付き】回答＋理由
- 【共感型】あいづち＋回答＋感想
- 【質問返し】回答＋相手への質問
- 【詳細】具体例を含む回答

---QUESTIONS---
学生が逆に聞ける質問パターン：
- 【確認】そうですか？本当ですか？
- 【詳細】いつ/どこで/どうやって？
- 【意見】どう思いますか？

【重要 - CRITICAL】
- 語彙リストの単語をSUGGESTIONSで必ず使う
- 会話は自然に、教科書的すぎない
- 学生が答えやすい質問を選ぶ
- 間違いは優しく訂正する`;
}

// Parse response (same as use-groq.ts)
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

    // Section detection
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

    if (!trimmed || trimmed.startsWith('---')) continue;

    if (section === 'response') {
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) continue;
      mainText += (mainText ? '\n' : '') + trimmed;
    } else if (section === 'template') {
      if (trimmed.toLowerCase().startsWith('pattern:')) {
        templatePattern = trimmed.substring(8).trim();
      } else if (!trimmed.startsWith('-')) {
        templatePattern = trimmed;
      }
    } else if (section === 'hints') {
      if (/^[①②③④⑤]/.test(trimmed)) continue;
      if (trimmed.startsWith('-')) {
        const hintText = trimmed.substring(1).trim();
        const eqIndex = hintText.indexOf('=');
        if (eqIndex > 0) {
          const word = hintText.substring(0, eqIndex).trim();
          const meaning = hintText.substring(eqIndex + 1).trim();
          if (word && meaning) {
            hints.push({ word, meaning });
          }
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
      const questionText = trimmed.substring(1).trim();
      if (questionText) {
        questions.push(questionText);
      }
    }
  }

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

  // Send message with advanced topic context
  const sendMessage = useCallback(async (
    userMessage: string,
    context: KaiwaContext,
    topic: KaiwaAdvancedTopic
  ): Promise<GeminiKaiwaResponse | null> => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError('Chưa cấu hình API key Groq');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formatReminder = conversationHistoryRef.current.length > 0
        ? '\n\n[REMINDER: 必ずすべてのセクション(RESPONSE, TEMPLATE, HINTS, SUGGESTIONS, QUESTIONS)を含めてください。語彙リストの単語を使ってください！]'
        : '';

      const messages = [
        { role: 'system' as const, content: buildAdvancedTeacherPrompt(topic, context) + formatReminder },
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

      const parsed = parseResponse(responseText);

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

    const apiKey = getApiKey();
    if (!apiKey) {
      setError('Chưa cấu hình API key Groq');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Build opening prompt
      let openingPrompt: string;

      if (specificQuestion) {
        // Use specific question
        openingPrompt = `レッスンを始めましょう！

まず学生に挨拶をして、以下の質問を自然に聞いてください：

質問: ${specificQuestion.questionJa}
${specificQuestion.questionVi ? `（ベトナム語: ${specificQuestion.questionVi}）` : ''}

会話を始める前に、簡単な挨拶と今日のトピック「${topic.name}」について一言触れてから質問してください。

語彙リストの単語をSUGGESTIONSとHINTSで使ってください。`;
      } else if (topic.questionBank.length > 0) {
        // Pick a random question from question bank
        const randomQuestion = topic.questionBank[Math.floor(Math.random() * topic.questionBank.length)];
        topicContextRef.current.usedQuestionIds.push(randomQuestion.id);

        openingPrompt = `レッスンを始めましょう！

まず学生に挨拶をして、以下の質問を自然に聞いてください：

質問: ${randomQuestion.questionJa}
${randomQuestion.questionVi ? `（ベトナム語: ${randomQuestion.questionVi}）` : ''}

会話を始める前に、簡単な挨拶と今日のトピック「${topic.name}」について一言触れてから質問してください。

語彙リストの単語をSUGGESTIONSとHINTSで使ってください。`;
      } else {
        // No question bank - let AI choose
        openingPrompt = `「${topic.name}」についてのレッスンを始めましょう！

まず学生に挨拶をして、トピックに関する興味深い質問をしてください。
語彙リストの単語を活用して、自然な会話を始めてください。`;
      }

      const messages = [
        { role: 'system' as const, content: buildAdvancedTeacherPrompt(topic, context) },
        { role: 'user' as const, content: openingPrompt },
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

      const parsed = parseResponse(responseText);

      conversationHistoryRef.current.push(
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
