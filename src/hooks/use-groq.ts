// Hook for Groq API integration for Kaiwa conversation (Llama 3.3)

import { useState, useCallback, useRef } from 'react';
import type { KaiwaContext, GeminiKaiwaResponse, SuggestedAnswer, AnswerTemplate, VocabularyHint, KaiwaEvaluation, KaiwaMessage, KaiwaMetrics } from '../types/kaiwa';

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

// Level-specific configuration for response length and complexity
const LEVEL_CONFIG: Record<string, { maxSentences: number; responseGuidance: string; vocabGuidance: string }> = {
  N5: {
    maxSentences: 2,
    responseGuidance: `【N5 BEGINNER RULES - CRITICAL】
- RESPONSE: Maximum 1-2 short sentences only!
- Use ONLY N5 vocabulary: です、ます、basic verbs (食べる、飲む、行く、見る、する)
- Grammar: です/ます form ONLY, simple て form, basic particles (は、が、を、に、で、へ)
- NO complex grammar: NO ～たり、NO ～ながら、NO conditionals、NO passive
- Keep it SIMPLE: Subject + Object + Verb structure
- Example good: [私|わたし]は[映画|えいが]が[好|す]きです。
- Example bad (too complex): [映画|えいが]を[見|み]ながら、ポップコーンを[食|た]べるのが[好|す]きです。`,
    vocabGuidance: 'Use ONLY basic N5 words: numbers, colors, family, time, basic actions, simple adjectives'
  },
  N4: {
    maxSentences: 3,
    responseGuidance: `【N4 ELEMENTARY RULES - CRITICAL】
- RESPONSE: Maximum 2-3 short sentences only!
- Use N4/N5 vocabulary only: daily life words, basic adjectives, common verbs
- Grammar: て form, た form, ～たい, ～ている, simple ～から (reason)
- NO complex grammar: NO ～ようにする、NO ～ことにする、NO ～かもしれない
- Keep sentences short and clear
- Example good: [昨日|きのう][映画|えいが]を[見|み]ました。とても[面白|おもしろ]かったです。
- Example bad (too long): [昨日|きのう][友達|ともだち]と[一緒|いっしょ]に[新|あたら]しいカフェに[行|い]って、[美味|おい]しいケーキを[食|た]べてから、[映画|えいが]を[見|み]ました。`,
    vocabGuidance: 'Use N4/N5 words: daily routines, shopping, weather, directions, basic emotions'
  },
  N3: {
    maxSentences: 4,
    responseGuidance: `【N3 INTERMEDIATE RULES】
- RESPONSE: 2-4 sentences, moderate complexity
- Use N3 vocabulary: opinions, comparisons, common expressions
- Grammar: ～ようにする、～ことにする、～たら、～ば、casual forms
- Can use some compound sentences`,
    vocabGuidance: 'Use everyday vocabulary appropriate for intermediate learners'
  },
  N2: {
    maxSentences: 5,
    responseGuidance: `【N2 UPPER-INTERMEDIATE RULES】
- RESPONSE: 3-5 sentences with natural flow
- Use varied vocabulary including idiomatic expressions
- Grammar: formal patterns, ～ものの、～にもかかわらず、etc.
- Natural conversation with explanations and opinions`,
    vocabGuidance: 'Use sophisticated vocabulary with nuance'
  },
  N1: {
    maxSentences: 6,
    responseGuidance: `【N1 ADVANCED RULES】
- RESPONSE: Natural length, sophisticated expression
- Use advanced vocabulary, idioms, and cultural references
- Grammar: all patterns including literary and formal styles
- Demonstrate native-like fluency`,
    vocabGuidance: 'Use full range of Japanese including literary and specialized terms'
  }
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
  const levelConfig = LEVEL_CONFIG[context.level];

  return `You are a Japanese conversation practice partner. Your role is to help users practice NATURAL Japanese conversation skills using 会話のキャッチボール (conversation catch-ball) technique.

${levelConfig.responseGuidance}

RULES:
- ABSOLUTELY NO ROMAJI! Use hiragana/katakana/kanji only. Foreign words must be in katakana (e.g. マーベル not Marvel)
- Use JLPT ${levelDescriptions[context.level]} vocabulary/grammar STRICTLY - ${levelConfig.vocabGuidance}
- Use ${styleDescriptions[context.style]}
- IMPORTANT: Don't just ask questions! Share your own thoughts/experiences FIRST, then ask
- Response format: [React to user] + [Share about yourself] + [Ask question]
- Add furigana for ALL kanji: [kanji|reading] e.g. [今日|きょう]
- All sentences must be COMPLETE and grammatically correct - no fragments!
- MAXIMUM ${levelConfig.maxSentences} sentences in your RESPONSE section!

TOPIC: ${topicPrompt}

FORMAT (MUST INCLUDE ALL SECTIONS):

---RESPONSE---
⚠️ MAXIMUM ${levelConfig.maxSentences} sentences!
[React to user's answer if any] + [Share your thought/experience] + [Ask a follow-up question]
${context.level === 'N5' ? `【N5 Example - MAX 2 sentences】
いいですね！[私|わたし]も[好|す]きです。` :
context.level === 'N4' ? `【N4 Example - MAX 3 sentences】
そうですか！[私|わたし]も[好|す]きです。どんな[映画|えいが]が[好|す]きですか？` :
`Example: そうですか、いいですね！[私|わたし]も[映画|えいが]が[好|す]きです。[最近|さいきん]、[日本|にほん]の[映画|えいが]を[見|み]ました。どんな[映画|えいが]が[好|す]きですか？`}

---TEMPLATE---
[Sentence pattern using ①, ②, ③ for blanks. Mark each blank position clearly]
${context.level === 'N5' || context.level === 'N4' ? '⚠️ Keep templates SHORT and SIMPLE for this level!' : ''}

---HINTS---
Group hints by blank position. If template has multiple blanks (①, ②...), provide options for EACH:
① [options for first blank]
- word1 = meaning
- word2 = meaning
② [options for second blank] (if exists)
- word1 = meaning
- word2 = meaning

---SUGGESTIONS---
${context.level === 'N5' ? `⚠️ N5 LEVEL: ALL suggestions must be SHORT 1-2 sentences only!

1. 【シンプル】One sentence only (e.g., はい、[好|す]きです。)
2. 【はい/いいえ＋少し】Yes/No + 1 short sentence
3. 【基本＋理由】Basic answer + 「〜から」
4. 【質問返し】Short answer + 「〜は？」
5. 【感想】Short impression (e.g., いいですね。)` :
context.level === 'N4' ? `⚠️ N4 LEVEL: ALL suggestions must be SHORT 2-3 sentences max!

1. 【シンプル】Simple 1-2 sentence answer
2. 【はい/いいえ＋理由】Yes/No + simple reason
3. 【基本＋感想】Answer + short impression
4. 【質問返し】Answer + 「〇〇さんは？」
5. 【少し詳しく】Slightly detailed (2-3 sentences max)` :
`Provide 4-5 different answer options using these strategies:

1. 【シンプル】Simple direct answer (1 sentence)
2. 【直接＋理由】Answer + reason/experience (2 sentences)
3. 【共感＋展開】Aizuchi + answer + personal touch (2-3 sentences)
4. 【答え＋質問返し】Answer + question back (会話のキャッチボール)
5. 【詳細】Detailed answer with examples (2-3 sentences)`}

---QUESTIONS---
User can ask back using these patterns:
${context.level === 'N5' || context.level === 'N4' ? `
1. 【そうですか】Simple reaction: そうですか。
2. 【基本質問】Simple question: 〇〇は[何|なに]ですか？
3. 【質問返し】Question back: 〇〇さんは？` :
`
1. 【確認・感想】Confirmation/Reaction: そうですか？/本当ですか？/いいですね！+ follow-up
2. 【詳細質問】Ask for details: いつ/どこで/誰と/どうやって + ですか？
3. 【意見質問】Ask opinion: どう思いますか？/おすすめは何ですか？`}

${context.level === 'N5' || context.level === 'N4' ? '' : `EXAMPLE (After user said they like watching movies):
---RESPONSE---
へえ、[映画|えいが]が[好|す]きなんですね！[私|わたし]も[映画|えいが]が[大好|だいす]きです。[先週|せんしゅう]、[日本|にほん]のアニメ[映画|えいが]を[見|み]ました。どんなジャンルの[映画|えいが]が[好|す]きですか？`}

---TEMPLATE---
①が[好|す]きです。[特|とく]に②が[好|す]きです。

---HINTS---
① ジャンル (thể loại)
- アクション = hành động
- コメディ = hài
- ホラー = kinh dị
② [具体的|ぐたいてき]な[作品|さくひん] (tác phẩm cụ thể)
- マーベル = phim siêu anh hùng
- ジブリ = phim hoạt hình Ghibli
- [韓国|かんこく]ドラマ = phim Hàn

---SUGGESTIONS---
- 【シンプル】アクション[映画|えいが]が[好|す]きです。
- 【直接＋理由】コメディが[好|す]きです。[笑|わら]うとストレスがなくなりますから。
- 【共感＋展開】いい[質問|しつもん]ですね！[私|わたし]はホラー[映画|えいが]が[好|す]きです。[怖|こわ]いけど、ドキドキするのが[楽|たの]しいです。
- 【答え＋質問返し】アニメが[一番|いちばん][好|す]きです。[特|とく]にジブリの[映画|えいが]が[好|す]きです。あなたは[何|なに]が[好|す]きですか？
- 【詳細】ロマンス[映画|えいが]が[好|す]きです。[韓国|かんこく]のドラマもよく[見|み]ます。[感動|かんどう]する[話|はなし]が[好|す]きなんです。

---QUESTIONS---
- 【確認・感想】そうですか！[私|わたし]もアクションが[好|す]きです。おすすめの[映画|えいが]はありますか？
- 【詳細質問】いつ[映画|えいが]を[見|み]ますか？[映画館|えいがかん]で[見|み]ますか、それとも[家|いえ]で？
- 【意見質問】[日本|にほん]の[映画|えいが]と[外国|がいこく]の[映画|えいが]、どちらが[好|す]きですか？

CRITICAL:
- ALWAYS include ALL sections in EVERY response
- NO ROMAJI anywhere - use katakana for foreign words
- Provide 4-5 SUGGESTIONS with DIFFERENT strategies (シンプル, 直接＋理由, 共感＋展開, 答え＋質問返し, 詳細)
- All suggestions must be COMPLETE sentences that make sense alone
- Response must: React + Share your experience + Ask question
- Questions show different patterns (確認・感想, 詳細質問, 意見質問)`;
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
    } else if (section === 'hints') {
      // Check for group header (①, ②, ③, etc.)
      if (/^[①②③④⑤]/.test(trimmed)) {
        // This is a group header, skip it (or could store for labeling)
        continue;
      }
      // Parse "- word = meaning" format
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

  // Start new conversation
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

  // Evaluate conversation after it ends
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
    sendMessage,
    startConversation,
    clearConversation,
    analyzeJapaneseSentence,
    generateFurigana,
    quickTranslate,
    evaluateConversation,
    isLoading,
    error,
    clearError,
  };
}
