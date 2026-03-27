// Sub-hook: speaking practice progress persistence

import { useState, useCallback } from 'react';
import type {
  SpeakingProgress,
  SpeakingSessionSummary,
} from '../types/speaking-practice';
import { handleError } from '../utils/error-handler';

const PROGRESS_STORAGE_KEY = 'shinko_speaking_progress';

function loadProgress(): SpeakingProgress {
  try {
    const saved = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    handleError('Load failed', { context: 'useSpeakingPractice/loadProgress', silent: true });
  }

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

function saveProgress(progress: SpeakingProgress): void {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    handleError('Save failed', { context: 'useSpeakingPractice/saveProgress', silent: true });
  }
}

function computeUpdatedProgress(
  currentProgress: SpeakingProgress,
  summary: SpeakingSessionSummary
): SpeakingProgress {
  const today = new Date().toISOString().split('T')[0];
  const wasLastPracticeYesterday = currentProgress.lastPracticeDate &&
    new Date(currentProgress.lastPracticeDate).toISOString().split('T')[0] ===
    new Date(Date.now() - 86400000).toISOString().split('T')[0];

  let newStreak = currentProgress.streakDays;
  if (currentProgress.lastPracticeDate !== today) {
    if (wasLastPracticeYesterday) {
      newStreak++;
    } else if (currentProgress.lastPracticeDate !== today) {
      newStreak = 1;
    }
  }

  const weeklyProgress = [...currentProgress.weeklyProgress];
  const todayEntry = weeklyProgress.find(w => w.date === today);
  if (todayEntry) {
    todayEntry.sessions++;
    todayEntry.accuracy = (todayEntry.accuracy + summary.overallAccuracy) / 2;
  } else {
    weeklyProgress.push({ date: today, sessions: 1, accuracy: summary.overallAccuracy });
  }
  while (weeklyProgress.length > 7) weeklyProgress.shift();

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

export function useSpeakingProgress() {
  const [progress, setProgress] = useState<SpeakingProgress>(() => loadProgress());

  const persistProgress = useCallback((summary: SpeakingSessionSummary) => {
    setProgress(prev => {
      const updated = computeUpdatedProgress(prev, summary);
      saveProgress(updated);
      return updated;
    });
  }, []);

  const refreshProgress = useCallback(() => {
    setProgress(loadProgress());
  }, []);

  return { progress, persistProgress, refreshProgress };
}
