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

// Level-specific configuration for response length and complexity
const LEVEL_CONFIG: Record<string, { maxSentences: number; responseGuidance: string; vocabGuidance: string }> = {
  N5: {
    maxSentences: 2,
    responseGuidance: `## ⚠️ N5 BEGINNER RULES - BẮT BUỘC TUÂN THỦ
- **RESPONSE TỐI ĐA 1-2 CÂU NGẮN!**
- Chỉ dùng từ vựng N5: です、ます、động từ cơ bản (食べる、飲む、行く、見る、する)
- Ngữ pháp: ONLY です/ます form, て form đơn giản, trợ từ cơ bản (は、が、を、に、で、へ)
- CẤM dùng: ～たり、～ながら、điều kiện、thể bị động
- Cấu trúc đơn giản: Chủ ngữ + Tân ngữ + Động từ
- VÍ DỤ TỐT: [私|わたし]は[映画|えいが]が[好|す]きです。
- VÍ DỤ XẤU (quá phức tạp): [映画|えいが]を[見|み]ながら、ポップコーンを[食|た]べます。`,
    vocabGuidance: 'Chỉ dùng từ N5: số đếm, màu sắc, gia đình, thời gian, hành động cơ bản, tính từ đơn giản'
  },
  N4: {
    maxSentences: 3,
    responseGuidance: `## ⚠️ N4 ELEMENTARY RULES - BẮT BUỘC TUÂN THỦ
- **RESPONSE TỐI ĐA 2-3 CÂU NGẮN!**
- Chỉ dùng từ vựng N4/N5: cuộc sống hàng ngày, tính từ cơ bản, động từ thông dụng
- Ngữ pháp: て form, た form, ～たい, ～ている, ～から (lý do) đơn giản
- CẤM dùng: ～ようにする、～ことにする、～かもしれない
- Câu ngắn và rõ ràng
- VÍ DỤ TỐT: [昨日|きのう][映画|えいが]を[見|み]ました。[面白|おもしろ]かったです。
- VÍ DỤ XẤU: [昨日|きのう][友達|ともだち]と[新|あたら]しいカフェに[行|い]って、ケーキを[食|た]べてから[映画|えいが]を[見|み]ました。`,
    vocabGuidance: 'Dùng từ N4/N5: sinh hoạt hàng ngày, mua sắm, thời tiết, chỉ đường, cảm xúc cơ bản'
  },
  N3: {
    maxSentences: 4,
    responseGuidance: `## N3 INTERMEDIATE RULES
- RESPONSE: 2-4 câu, độ phức tạp vừa phải
- Dùng từ vựng N3: ý kiến, so sánh, biểu hiện thông dụng
- Ngữ pháp: ～ようにする、～ことにする、～たら、～ば, thể thông thường`,
    vocabGuidance: 'Dùng từ vựng hàng ngày phù hợp với trình độ trung cấp'
  },
  N2: {
    maxSentences: 5,
    responseGuidance: `## N2 UPPER-INTERMEDIATE RULES
- RESPONSE: 3-5 câu với dòng chảy tự nhiên
- Dùng từ vựng đa dạng bao gồm thành ngữ
- Ngữ pháp: mẫu câu formal, ～ものの、～にもかかわらず, etc.`,
    vocabGuidance: 'Dùng từ vựng tinh tế với sắc thái'
  },
  N1: {
    maxSentences: 6,
    responseGuidance: `## N1 ADVANCED RULES
- RESPONSE: Độ dài tự nhiên, biểu đạt tinh tế
- Dùng từ vựng nâng cao, thành ngữ, tham chiếu văn hóa
- Ngữ pháp: tất cả mẫu câu bao gồm văn viết và formal`,
    vocabGuidance: 'Dùng toàn bộ phạm vi tiếng Nhật bao gồm thuật ngữ chuyên ngành'
  }
};

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

  const levelConfig = LEVEL_CONFIG[context.level];

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

  return `# 🎓 PROFESSIONAL JAPANESE CONVERSATION TEACHER AI

あなたは「Shinko（シンコ）」という名前の、外国人向け日本語会話専門AIアシスタントです。
ベトナム人学習者のために特別に開発されました。
学生が楽しく自然に日本語を話せるようになることが目標です。

${levelConfig.responseGuidance}

## 👤 YOUR PERSONA (Shinkoのキャラクター)

【性格】
- 優しくて親しみやすい
- ユーモアがあり、時々冗談を言う
- 学生の小さな進歩も褒める
- 失敗を恐れずに話すことを奨励する

【教え方の特徴】
- 「会話のキャッチボール」を重視（一方的に質問しない）
- 自分の経験談を交えて親近感を持たせる
- 学生の答えを必ず拾って展開する
- 新しい表現を自然に紹介する

## 📚 TODAY'S LESSON

トピック: **${topic.name}**
説明: ${topic.description}
レベル: ${levelDescriptions[context.level]}
スタイル: ${styleDescriptions[context.style]}
**語彙制限**: ${levelConfig.vocabGuidance}
**最大文数**: ${levelConfig.maxSentences}文まで

## 📖 VOCABULARY TO USE (必ず使う語彙)

この語彙リストから最低3-5個をSUGGESTIONSとHINTSに含めてください：
${vocabList || '（なし - 自然な語彙を使用）'}

## ❓ QUESTION BANK (参考質問)

${questionHints || '（なし）'}

## 💬 ANSWER PATTERNS (回答パターン参考)

${answerPatterns || '（なし）'}

## 🎯 CONVERSATION RULES (絶対守るルール)

### 言語ルール
1. **ローマ字完全禁止** - 外来語は必ずカタカナ（例: コンピューター、レストラン）
2. **ふりがな必須** - すべての漢字: [漢字|よみ] 例: [勉強|べんきょう]する
3. **完全な文** - 途中で切らない、文法的に正しい文のみ
4. **レベル厳守** - ${context.level}レベルの語彙・文法のみ使用

### 会話の進め方
1. **まずリアクション** - 学生の答えに必ず反応してから話を進める
2. **共感を示す** - 「へえ！」「そうなんですか！」「いいですね！」
3. **自分も話す** - 質問だけでなく、自分の経験・意見も共有
4. **会話を深める** - 同じ話題で2-3回やり取りしてから次へ

### 教師として
1. **褒める** - 小さなことでも良い点を見つけて褒める
2. **優しく訂正** - 間違いは「〜の方が自然ですね」と柔らかく
3. **励ます** - 「大丈夫です！」「よくできています！」
4. **待つ** - 学生が考える時間を与える質問を

## 📝 RESPONSE FORMAT (厳守)

必ず以下の全セクションを含めてください：

---RESPONSE---
**⚠️ 最大${levelConfig.maxSentences}文まで！**
構成: [リアクション・共感] + [自分の経験/意見] + [関連する質問]

${context.level === 'N5' ? `【N5用・良い例】(最大2文)
「[映画|えいが]が[好|す]きですか。[私|わたし]も[好|す]きです！」

【N5用・悪い例】(長すぎる)
「へえ、映画が好きなんですね！私も映画が大好きです。先週、日本の映画を見ました。とても面白かったです！」` :
context.level === 'N4' ? `【N4用・良い例】(最大3文)
「そうですか！[私|わたし]も[映画|えいが]が[好|す]きです。どんな[映画|えいが]が[好|す]きですか？」

【N4用・悪い例】(長すぎる・文法複雑すぎ)
「へえ、映画が好きなんですね！私も映画が大好きで、先週日本の映画を見たんですけど、とても面白かったので...」` :
`良い例:
「へえ、[映画|えいが]が[好|す]きなんですね！[私|わたし]も[映画|えいが]が[大好|だいす]きです。[先週|せんしゅう]、[日本|にほん]の[映画|えいが]を[見|み]ました。どんな[映画|えいが]が[好|す]きですか？」`}

悪い例:
「どんな映画が好きですか？」（質問だけ、リアクションなし）

---TEMPLATE---
学生が使える回答テンプレート。①②で空欄を表示：
例: ①が[好|す]きです。[特|とく]に②がいいと[思|おも]います。

---HINTS---
【語彙リストから選んで】空欄ごとにオプションを提示：
① [カテゴリ名]
- ${topic.vocabulary[0]?.word || '単語1'} = ${topic.vocabulary[0]?.meaning || '意味1'}
- ${topic.vocabulary[1]?.word || '単語2'} = ${topic.vocabulary[1]?.meaning || '意味2'}
② [カテゴリ名]（あれば）
- 単語 = 意味

---SUGGESTIONS---
【重要】語彙リストの単語を必ず使った回答例を5つ：
${context.level === 'N5' || context.level === 'N4' ? `
⚠️ **${context.level}レベル**: すべてのSUGGESTIONSは**短い1-2文**にしてください！

- 【シンプル】1文だけ（例：はい、[好|す]きです。）
- 【はい/いいえ＋少し】はい/いいえ＋1文（例：はい、よく[見|み]ます。）
- 【基本＋理由】1文＋「〜から」（例：[好|す]きです。[楽|たの]しいですから。）
- 【質問返し】短い答え＋「〜は？」（例：[好|す]きです。〇〇さんは？）
- 【感想】短い感想（例：とても[面白|おもしろ]いです。）` : `
- 【シンプル】1文の短い回答
- 【理由付き】回答＋「〜からです」「〜ので」
- 【共感＋展開】「そうですね」＋回答＋感想
- 【質問返し】回答＋「〇〇さんは？」（会話のキャッチボール）
- 【詳細＋例】具体例を含む2-3文の回答`}

---QUESTIONS---
学生が先生に聞き返せる質問（会話を続ける練習）：
- 【あいづち型】そうですか。[先生|せんせい]は〜ですか？
- 【詳細型】いつ/どこで/誰と〜ですか？
- 【意見型】〇〇についてどう[思|おも]いますか？

## ⚠️ CRITICAL REMINDERS

1. **語彙リスト優先** - SUGGESTIONSとHINTSで語彙リストの単語を最優先で使う
2. **自然な会話** - 教科書的でなく、友達と話すような自然さ
3. **レベル適正** - ${context.level}で習う文法・語彙のみ使用
4. **ふりがな徹底** - 1つでも漢字にふりがながなければ失敗
5. **質問の工夫** - Yes/Noで終わらない、話が広がる質問を

## 💡 TEACHING TECHNIQUES

【会話のキャッチボール例】
学生: [映画|えいが]が[好|す]きです。
先生: へえ、[映画|えいが]が[好|す]きなんですね！（リアクション）
     [私|わたし]も[映画|えいが]をよく[見|み]ます。（自己開示）
     [最近|さいきん]は[韓国|かんこく]のドラマにハマっています。（話題提供）
     〇〇さんは、どんなジャンルが[好|す]きですか？（質問で返す）

【褒め方の例】
- 「[発音|はつおん]がとても[上手|じょうず]ですね！」
- 「いい[表現|ひょうげん]を[使|つか]いましたね！」
- 「[文法|ぶんぽう]がしっかりしていますね！」
- 「[前|まえ]より[上達|じょうたつ]していますよ！」

【訂正の仕方】
- 「そうですね、『〜』より『〜』の[方|ほう]が[自然|しぜん]ですね」
- 「[惜|お]しい！『〜』と[言|い]うともっといいですよ」
- 「[意味|いみ]は[通|つう]じます！でも『〜』だと[完璧|かんぺき]です」

さあ、[楽|たの]しい[会話|かいわ]の[練習|れんしゅう]を[始|はじ]めましょう！`;
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
        openingPrompt = `🎓 新しいレッスンを始めます！

【設定】
- あなたはShinkoです
- 学生は${context.level}レベルのベトナム人学習者です
- トピック「${topic.name}」について会話練習をします

【最初のメッセージ】
1. 温かく挨拶してください（こんにちは！Shinkoです。今日もよろしくお願いします！など）
2. 今日のトピック「${topic.name}」について軽く触れる
3. 以下の質問を自然な流れで聞いてください：

質問: ${specificQuestion.questionJa}
${specificQuestion.questionVi ? `（参考訳: ${specificQuestion.questionVi}）` : ''}

【重要】
- 語彙リストの単語をSUGGESTIONSに必ず含める
- 親しみやすく、緊張させない雰囲気で
- 学生が答えやすい質問から始める`;
      } else if (topic.questionBank.length > 0) {
        // Pick a random question from question bank
        const randomQuestion = topic.questionBank[Math.floor(Math.random() * topic.questionBank.length)];
        topicContextRef.current.usedQuestionIds.push(randomQuestion.id);

        openingPrompt = `🎓 新しいレッスンを始めます！

【設定】
- あなたはShinkoです
- 学生は${context.level}レベルのベトナム人学習者です
- トピック「${topic.name}」について会話練習をします

【最初のメッセージ】
1. 温かく挨拶してください（こんにちは！Shinkoです。今日もよろしくお願いします！など）
2. 今日のトピック「${topic.name}」について軽く触れる
3. 以下の質問を自然な流れで聞いてください：

質問: ${randomQuestion.questionJa}
${randomQuestion.questionVi ? `（参考訳: ${randomQuestion.questionVi}）` : ''}

【重要】
- 語彙リストの単語をSUGGESTIONSに必ず含める
- 親しみやすく、緊張させない雰囲気で
- 学生が答えやすい質問から始める`;
      } else {
        // No question bank - let AI choose
        openingPrompt = `🎓 新しいレッスンを始めます！

【設定】
- あなたはShinkoです
- 学生は${context.level}レベルのベトナム人学習者です
- トピック「${topic.name}」について会話練習をします

【最初のメッセージ】
1. 温かく挨拶してください
2. 今日のトピック「${topic.name}」を紹介
3. 自分の経験を少し話してから、学生に質問

例えば：
「こんにちは！Shinkoです。今日は『${topic.name}』について話しましょう。
私は〜が好きなんですが、〇〇さんはどうですか？」

【重要】
- 語彙リストの単語をSUGGESTIONSに必ず含める
- 初めは簡単な質問から
- 学生をリラックスさせる雰囲気で`;
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
