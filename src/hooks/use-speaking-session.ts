// Sub-hook: pronunciation evaluation and session tracking

import { useCallback, useRef } from 'react';
import type {
  SpeakingDialogue,
  SpeakingEvaluation,
  SpeakingSessionSummary,
  LinePracticeResult,
} from '../types/speaking-practice';

// Calculate evaluation from pronunciation comparison
function calculateEvaluation(
  expectedText: string,
  spokenText: string,
  durationMs: number
): SpeakingEvaluation {
  const normalize = (text: string) => text
    .normalize('NFKC')
    .replace(/[。、！？「」『』（）\s・…]/g, '')
    .toLowerCase();

  const expected = normalize(expectedText);
  const spoken = normalize(spokenText);

  let matchCount = 0;
  const maxLen = Math.max(expected.length, spoken.length);
  for (let i = 0; i < Math.min(expected.length, spoken.length); i++) {
    if (expected[i] === spoken[i]) matchCount++;
  }
  const accuracy = maxLen > 0 ? Math.round((matchCount / maxLen) * 100) : 0;

  const wordCount = spokenText.split(/[\s。、！？]/).filter(Boolean).length;
  const minutes = durationMs / 60000;
  const wpm = minutes > 0 ? Math.round(wordCount / minutes) : 0;

  let speedRating: 'slow' | 'normal' | 'fast' = 'normal';
  if (wpm < 60) speedRating = 'slow';
  else if (wpm > 150) speedRating = 'fast';

  const overallScore = Math.round(accuracy * 0.8 + (speedRating === 'normal' ? 20 : speedRating === 'slow' ? 10 : 15));

  const suggestions: string[] = [];
  if (accuracy < 70) suggestions.push('Hãy nghe lại và luyện phát âm từng từ chậm hơn');
  if (accuracy < 50) suggestions.push('Thử chia câu thành nhiều phần nhỏ để luyện');
  if (speedRating === 'fast') suggestions.push('Nói chậm hơn một chút để phát âm rõ ràng hơn');
  if (speedRating === 'slow') suggestions.push('Cố gắng nói tự nhiên và mượt mà hơn');
  if (accuracy >= 90) suggestions.push('Xuất sắc! Hãy thử tăng tốc độ nói');

  return {
    accuracy,
    speakingSpeed: { wordsPerMinute: wpm, rating: speedRating },
    emphasis: {
      score: Math.min(100, accuracy + 10),
      feedback: accuracy >= 80 ? 'Ngữ điệu tốt' : 'Cần cải thiện ngữ điệu',
    },
    overallScore,
    suggestions,
  };
}

interface UseSpeakingSessionOptions {
  dialogue: SpeakingDialogue | null;
}

export function useSpeakingSession({ dialogue }: UseSpeakingSessionOptions) {
  const sessionStartTimeRef = useRef<number | null>(null);
  const lineResultsRef = useRef<LinePracticeResult[]>([]);
  const recordingStartTimeRef = useRef<number | null>(null);

  const initSession = useCallback(() => {
    sessionStartTimeRef.current = Date.now();
    lineResultsRef.current = [];
  }, []);

  const startRecording = useCallback((lineIndex: number) => {
    recordingStartTimeRef.current = Date.now();

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

    const result = lineResultsRef.current.find(r => r.lineIndex === lineIndex);
    if (result) {
      result.attempts++;
      result.bestAccuracy = Math.max(result.bestAccuracy, evaluation.accuracy);
      result.evaluations.push(evaluation);
    }

    return evaluation;
  }, [dialogue]);

  const buildSummary = useCallback((): SpeakingSessionSummary | null => {
    if (!dialogue || !sessionStartTimeRef.current) return null;

    const totalTime = Math.round((Date.now() - sessionStartTimeRef.current) / 1000);
    const lineResults = [...lineResultsRef.current];
    const completedLines = lineResults.filter(r => r.bestAccuracy > 0);
    const userLines = dialogue.lines.filter(l => l.role === 'user').length;

    const totalAccuracy = completedLines.reduce((sum, r) => sum + r.bestAccuracy, 0);
    const overallAccuracy = completedLines.length > 0
      ? Math.round(totalAccuracy / completedLines.length)
      : 0;

    return {
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
  }, [dialogue]);

  const resetSession = useCallback(() => {
    sessionStartTimeRef.current = null;
    lineResultsRef.current = [];
    recordingStartTimeRef.current = null;
  }, []);

  return { initSession, startRecording, evaluateLine, buildSummary, resetSession };
}
