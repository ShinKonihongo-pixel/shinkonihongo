// Hook for Speaking Practice feature - generates dialogues and evaluates pronunciation

import { useState, useCallback, useRef } from 'react';
import type { JLPTLevel } from '../types/kaiwa';
import type {
  SpeakingTopicId,
  SpeakingDialogue,
  SpeakingDialogueLine,
  SpeakingEvaluation,
  SpeakingProgress,
  SpeakingSessionSummary,
  LinePracticeResult,
} from '../types/speaking-practice';
import { SPEAKING_TOPIC_PROMPTS, SPEAKING_LINES_PER_LEVEL, getSpeakingTopicById } from '../constants/speaking-topics';
import { removeFurigana } from '../lib/furigana-utils';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

// LocalStorage key for progress
const PROGRESS_STORAGE_KEY = 'shinko_speaking_progress';

// Level-specific guidance
const LEVEL_GUIDANCE: Record<string, string> = {
  N5: `JLPT N5 (Beginner):
- Use ONLY basic vocabulary and simple sentence patterns
- Use です/ます form exclusively
- Keep sentences SHORT (5-10 words max)
- Common verbs: いく、くる、たべる、のむ、みる、する
- Basic particles: は、が、を、に、で、へ`,

  N4: `JLPT N4 (Elementary):
- Use N4/N5 vocabulary
- Use て-form, た-form, ～たい
- Can use basic compound sentences
- Keep sentences moderate length (8-15 words)`,

  N3: `JLPT N3 (Intermediate):
- Use everyday vocabulary including some idiomatic expressions
- Can use conditional forms, passive, causative
- Natural conversational flow`,

  N2: `JLPT N2 (Upper-Intermediate):
- Use varied vocabulary with nuance
- Complex grammar patterns allowed
- Natural, fluid conversation`,

  N1: `JLPT N1 (Advanced):
- Full range of vocabulary including business/formal
- All grammar patterns including keigo
- Native-like natural expression`,
};

// Build system prompt for dialogue generation
function buildDialoguePrompt(topicId: SpeakingTopicId, level: JLPTLevel): string {
  const topic = getSpeakingTopicById(topicId);
  const topicPrompt = SPEAKING_TOPIC_PROMPTS[topicId];
  const lineCount = SPEAKING_LINES_PER_LEVEL[level];
  const levelGuidance = LEVEL_GUIDANCE[level];

  return `You are a Japanese language teacher creating a speaking practice dialogue.

TOPIC: ${topic?.name} (${topic?.nameVi})
${topicPrompt}

LEVEL REQUIREMENTS:
${levelGuidance}

DIALOGUE REQUIREMENTS:
- Create exactly ${lineCount} dialogue lines (alternating between AI and User)
- AI speaks first (as shop staff, waiter, etc.)
- User responds (as customer, patient, etc.)
- Each line should be NATURAL and PRACTICAL
- Add furigana for ALL kanji: [漢字|かんじ] format
- Lines should build on each other logically

RESPONSE FORMAT (JSON only, no markdown):
{
  "title": "[Japanese title with furigana]",
  "titleVi": "[Vietnamese title]",
  "situation": "[Brief situation description in Vietnamese]",
  "lines": [
    {
      "role": "ai",
      "text": "[Japanese with furigana [kanji|reading]]",
      "translation": "[Vietnamese translation]"
    },
    {
      "role": "user",
      "text": "[Japanese with furigana]",
      "translation": "[Vietnamese translation]"
    }
  ],
  "vocabulary": [
    {
      "word": "[word]",
      "reading": "[reading if kanji]",
      "meaning": "[Vietnamese meaning]"
    }
  ]
}

CRITICAL RULES:
- NO ROMAJI anywhere - use hiragana/katakana/kanji only
- Foreign words in katakana
- EVERY kanji must have furigana: [漢字|かんじ]
- Vocabulary should include 3-5 key words from the dialogue
- Make the dialogue REALISTIC and PRACTICAL for real-life situations`;
}

// Parse dialogue response from AI
function parseDialogueResponse(responseText: string, topicId: SpeakingTopicId, level: JLPTLevel): SpeakingDialogue | null {
  try {
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const data = JSON.parse(jsonMatch[0]);

    // Transform lines to include plain text
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
    console.error('Failed to parse dialogue response');
    return null;
  }
}

// Calculate evaluation from pronunciation comparison
function calculateEvaluation(
  expectedText: string,
  spokenText: string,
  durationMs: number
): SpeakingEvaluation {
  // Normalize texts for comparison
  const normalize = (text: string) => text
    .normalize('NFKC')
    .replace(/[。、！？「」『』（）\s・…]/g, '')
    .toLowerCase();

  const expected = normalize(expectedText);
  const spoken = normalize(spokenText);

  // Calculate character-level accuracy
  let matchCount = 0;
  const maxLen = Math.max(expected.length, spoken.length);
  for (let i = 0; i < Math.min(expected.length, spoken.length); i++) {
    if (expected[i] === spoken[i]) matchCount++;
  }
  const accuracy = maxLen > 0 ? Math.round((matchCount / maxLen) * 100) : 0;

  // Calculate speaking speed (approximate words per minute)
  const wordCount = spokenText.split(/[\s。、！？]/).filter(Boolean).length;
  const minutes = durationMs / 60000;
  const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0;

  // Determine speed rating
  let speedRating: 'slow' | 'normal' | 'fast' = 'normal';
  if (wpm < 60) speedRating = 'slow';
  else if (wpm > 150) speedRating = 'fast';

  // Calculate overall score
  const overallScore = Math.round(accuracy * 0.8 + (speedRating === 'normal' ? 20 : speedRating === 'slow' ? 10 : 15));

  // Generate suggestions
  const suggestions: string[] = [];
  if (accuracy < 70) {
    suggestions.push('Hãy nghe lại và luyện phát âm từng từ chậm hơn');
  }
  if (accuracy < 50) {
    suggestions.push('Thử chia câu thành nhiều phần nhỏ để luyện');
  }
  if (speedRating === 'fast') {
    suggestions.push('Nói chậm hơn một chút để phát âm rõ ràng hơn');
  }
  if (speedRating === 'slow') {
    suggestions.push('Cố gắng nói tự nhiên và mượt mà hơn');
  }
  if (accuracy >= 90) {
    suggestions.push('Xuất sắc! Hãy thử tăng tốc độ nói');
  }

  return {
    accuracy,
    speakingSpeed: {
      wordsPerMinute: wpm,
      rating: speedRating,
    },
    emphasis: {
      score: Math.min(100, accuracy + 10), // Simplified for MVP
      feedback: accuracy >= 80 ? 'Ngữ điệu tốt' : 'Cần cải thiện ngữ điệu',
    },
    overallScore,
    suggestions,
  };
}

// Load progress from localStorage
function loadProgress(): SpeakingProgress {
  try {
    const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    console.error('Failed to load speaking progress');
  }

  // Default progress
  return {
    totalSessions: 0,
    totalMinutes: 0,
    totalLinesCompleted: 0,
    averageAccuracy: 0,
    streakDays: 0,
    lastPracticeDate: null,
    weeklyProgress: [],
    topicProgress: {} as SpeakingProgress['topicProgress'],
  };
}

// Save progress to localStorage
function saveProgress(progress: SpeakingProgress): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    console.error('Failed to save speaking progress');
  }
}

// Update progress after session
function updateProgress(
  currentProgress: SpeakingProgress,
  summary: SpeakingSessionSummary
): SpeakingProgress {
  const today = new Date().toISOString().split('T')[0];
  const wasLastPracticeYesterday = currentProgress.lastPracticeDate &&
    new Date(currentProgress.lastPracticeDate).toISOString().split('T')[0] ===
    new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // Update streak
  let newStreak = currentProgress.streakDays;
  if (currentProgress.lastPracticeDate !== today) {
    if (wasLastPracticeYesterday) {
      newStreak++;
    } else if (currentProgress.lastPracticeDate !== today) {
      newStreak = 1;
    }
  }

  // Update weekly progress
  const weeklyProgress = [...currentProgress.weeklyProgress];
  const todayEntry = weeklyProgress.find(w => w.date === today);
  if (todayEntry) {
    todayEntry.sessions++;
    todayEntry.accuracy = (todayEntry.accuracy + summary.overallAccuracy) / 2;
  } else {
    weeklyProgress.push({
      date: today,
      sessions: 1,
      accuracy: summary.overallAccuracy,
    });
  }
  // Keep only last 7 days
  while (weeklyProgress.length > 7) weeklyProgress.shift();

  // Update topic progress
  const topicProgress = { ...currentProgress.topicProgress };
  const topicId = summary.dialogue.topic;
  const existingTopicProgress = topicProgress[topicId] || {
    sessionsCompleted: 0,
    averageAccuracy: 0,
    lastPracticed: null,
  };
  topicProgress[topicId] = {
    sessionsCompleted: existingTopicProgress.sessionsCompleted + 1,
    averageAccuracy: existingTopicProgress.sessionsCompleted > 0
      ? (existingTopicProgress.averageAccuracy + summary.overallAccuracy) / 2
      : summary.overallAccuracy,
    lastPracticed: today,
  };

  // Calculate new totals
  const newTotalSessions = currentProgress.totalSessions + 1;
  const newTotalMinutes = currentProgress.totalMinutes + Math.round(summary.totalTime / 60);
  const newTotalLines = currentProgress.totalLinesCompleted + summary.linesCompleted;
  const newAverageAccuracy = currentProgress.totalSessions > 0
    ? (currentProgress.averageAccuracy * currentProgress.totalSessions + summary.overallAccuracy) / newTotalSessions
    : summary.overallAccuracy;

  return {
    totalSessions: newTotalSessions,
    totalMinutes: newTotalMinutes,
    totalLinesCompleted: newTotalLines,
    averageAccuracy: Math.round(newAverageAccuracy),
    streakDays: newStreak,
    lastPracticeDate: today,
    weeklyProgress,
    topicProgress,
  };
}

export interface UseSpeakingPracticeOptions {
  apiKey?: string;
}

export function useSpeakingPractice(options: UseSpeakingPracticeOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogue, setDialogue] = useState<SpeakingDialogue | null>(null);
  const [progress, setProgress] = useState<SpeakingProgress>(() => loadProgress());

  // Tracking for current session
  const sessionStartTimeRef = useRef<number | null>(null);
  const lineResultsRef = useRef<LinePracticeResult[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);

  // Get API key
  const getApiKey = useCallback(() => {
    return options.apiKey || import.meta.env.VITE_GROQ_API_KEY;
  }, [options.apiKey]);

  // Generate new dialogue
  const generateDialogue = useCallback(async (
    topicId: SpeakingTopicId,
    level: JLPTLevel
  ): Promise<SpeakingDialogue | null> => {
    const apiKey = getApiKey();
    if (!apiKey) {
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
          'Authorization': `Bearer ${apiKey}`,
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

      if (!responseText) {
        throw new Error('Không nhận được phản hồi từ AI');
      }

      const parsed = parseDialogueResponse(responseText, topicId, level);
      if (!parsed) {
        throw new Error('Không thể xử lý hội thoại');
      }

      setDialogue(parsed);
      sessionStartTimeRef.current = Date.now();
      lineResultsRef.current = [];

      return parsed;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi kết nối';
      setError(`Lỗi: ${message}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getApiKey]);

  // Start recording for a line
  const startRecording = useCallback((lineIndex: number) => {
    recordingStartTimeRef.current = Date.now();

    // Initialize line result if not exists
    const existing = lineResultsRef.current.find(r => r.lineIndex === lineIndex);
    if (!existing) {
      lineResultsRef.current.push({
        lineIndex,
        attempts: 0,
        bestAccuracy: 0,
        evaluations: [],
      });
    }
  }, []);

  // Evaluate pronunciation for a line
  const evaluateLine = useCallback((
    lineIndex: number,
    spokenText: string
  ): SpeakingEvaluation | null => {
    if (!dialogue || lineIndex >= dialogue.lines.length) return null;

    const expectedText = dialogue.lines[lineIndex].textPlain;
    const durationMs = recordingStartTimeRef.current
      ? Date.now() - recordingStartTimeRef.current
      : 3000;

    const evaluation = calculateEvaluation(expectedText, spokenText, durationMs);

    // Update line results
    const result = lineResultsRef.current.find(r => r.lineIndex === lineIndex);
    if (result) {
      result.attempts++;
      result.bestAccuracy = Math.max(result.bestAccuracy, evaluation.accuracy);
      result.evaluations.push(evaluation);
    }

    return evaluation;
  }, [dialogue]);

  // Complete session and get summary
  const completeSession = useCallback((): SpeakingSessionSummary | null => {
    if (!dialogue || !sessionStartTimeRef.current) return null;

    const totalTime = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
    const lineResults = [...lineResultsRef.current];
    const completedLines = lineResults.filter(r => r.bestAccuracy > 0);
    const userLines = dialogue.lines.filter(l => l.role === 'user').length;

    // Calculate overall accuracy
    const totalAccuracy = completedLines.reduce((sum, r) => sum + r.bestAccuracy, 0);
    const overallAccuracy = completedLines.length > 0
      ? Math.round(totalAccuracy / completedLines.length)
      : 0;

    const summary: SpeakingSessionSummary = {
      dialogue,
      totalTime,
      linesCompleted: completedLines.length,
      totalLines: userLines,
      overallAccuracy,
      lineResults,
      suggestions: overallAccuracy >= 80
        ? ['Tuyệt vời! Hãy thử chủ đề khó hơn']
        : ['Luyện tập thêm để cải thiện phát âm'],
    };

    // Update and save progress
    const updatedProgress = updateProgress(progress, summary);
    setProgress(updatedProgress);
    saveProgress(updatedProgress);

    return summary;
  }, [dialogue, progress]);

  // Reset session
  const resetSession = useCallback(() => {
    setDialogue(null);
    setError(null);
    sessionStartTimeRef.current = null;
    lineResultsRef.current = [];
    recordingStartTimeRef.current = null;
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh progress from storage
  const refreshProgress = useCallback(() => {
    setProgress(loadProgress());
  }, []);

  return {
    // State
    dialogue,
    isLoading,
    error,
    progress,

    // Actions
    generateDialogue,
    startRecording,
    evaluateLine,
    completeSession,
    resetSession,
    clearError,
    refreshProgress,
  };
}
