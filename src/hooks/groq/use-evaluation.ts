// Conversation evaluation hook

import { useState, useCallback } from 'react';
import type { KaiwaContext, KaiwaMessage, KaiwaMetrics, KaiwaEvaluation } from '../../types/kaiwa';
import { GROQ_API_URL, MODEL } from './constants';

interface UseEvaluationOptions {
  getApiKey: () => string | undefined;
}

export function useEvaluation({ getApiKey }: UseEvaluationOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluateConversation = useCallback(async (
    messages: KaiwaMessage[],
    context: KaiwaContext,
    metrics: KaiwaMetrics
  ): Promise<KaiwaEvaluation | null> => {
    const apiKey = getApiKey();
    if (!apiKey) {
      setError('Chưa cấu hình API key');
      return null;
    }

    if (messages.length < 4) {
      setError('Cần ít nhất 2 lượt trao đổi để đánh giá');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const conversationText = messages
        .map(m => `${m.role === 'user' ? 'Học viên' : 'AI'}: ${m.content}`)
        .join('\n');

      const systemPrompt = `You are a Japanese language teacher evaluating a student's conversation practice.
Analyze the conversation and provide a detailed evaluation.

CONTEXT:
- JLPT Level: ${context.level}
- Style: ${context.style}
- Topic: ${context.topic}

METRICS:
- Total exchanges: ${metrics.totalExchanges}
- Duration: ${metrics.durationMinutes} minutes
- Average pronunciation accuracy: ${metrics.avgPronunciationAccuracy}%
- Pronunciation attempts: ${metrics.pronunciationAttempts}

EVALUATION CRITERIA:
1. Grammar accuracy and appropriateness for level
2. Vocabulary range and usage
3. Pronunciation (based on metrics)
4. Fluency and natural flow of conversation
5. Level appropriateness

RESPONSE FORMAT (JSON only, no markdown):
{
  "overallScore": 7,
  "grammarScore": 7,
  "vocabularyScore": 6,
  "pronunciationScore": 8,
  "fluencyScore": 7,
  "strengths": [
    "文法がしっかりしています (Ngữ pháp vững chắc)",
    "敬語を正しく使っています (Sử dụng kính ngữ đúng cách)"
  ],
  "weaknesses": [
    "語彙がまだ限られています (Vốn từ còn hạn chế)",
    "文が短いです (Câu còn ngắn)"
  ],
  "suggestions": [
    "もっと長い文を作る練習をしましょう (Hãy luyện tập tạo câu dài hơn)",
    "新しい単語を毎日5つ覚えましょう (Hãy học 5 từ mới mỗi ngày)"
  ],
  "recommendedLevel": "N5",
  "encouragement": "Bạn đã làm rất tốt! Tiếp tục luyện tập mỗi ngày để tiến bộ hơn."
}

Scores are 1-10. Include Japanese with Vietnamese translations in parentheses for strengths/weaknesses/suggestions.
recommendedLevel should be N5/N4/N3/N2/N1 based on demonstrated ability.
encouragement should be a warm, personalized message in Vietnamese.`;

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
            { role: 'user', content: `Please evaluate this conversation:\n\n${conversationText}` },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const responseText = data.choices?.[0]?.message?.content?.trim();

      if (!responseText) {
        throw new Error('Không nhận được phản hồi từ AI');
      }

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Không thể phân tích kết quả đánh giá');
      }

      const evaluation = JSON.parse(jsonMatch[0]) as KaiwaEvaluation;
      return evaluation;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi đánh giá';
      setError(`Lỗi: ${message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getApiKey]);

  return {
    evaluateConversation,
    isLoading,
    error,
  };
}
