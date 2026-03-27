// Sub-hook: daily words session actions (mark learned, mark all, refresh)

import { useCallback } from 'react';
import type { Flashcard } from '../types/flashcard';
import type { DailyWordsSession, DailyWordsState } from '../types/daily-words';
import { getToday, updateStreak, selectWords } from './use-daily-words-storage';

interface UseDailyWordsSessionOptions {
  state: DailyWordsState;
  setState: React.Dispatch<React.SetStateAction<DailyWordsState>>;
  allCards: Flashcard[];
  targetCount: 5 | 10 | 15 | 20;
  enabled: boolean;
  userJlptLevel?: string;
}

export function useDailyWordsSession({
  state,
  setState,
  allCards,
  targetCount,
  enabled,
  userJlptLevel,
}: UseDailyWordsSessionOptions) {
  const markWordLearned = useCallback((wordId: string) => {
    setState(prev => {
      if (!prev.currentSession) return prev;
      if (!prev.currentSession.wordIds.includes(wordId)) return prev;
      if (prev.currentSession.isCompleted) return prev;
      if (prev.currentSession.learnedWordIds.includes(wordId)) return prev;

      const newLearnedWordIds = [...prev.currentSession.learnedWordIds, wordId];
      const newCompletedWords = newLearnedWordIds.length;
      const isCompleted = newCompletedWords >= prev.currentSession.targetWords;

      const updatedSession: DailyWordsSession = {
        ...prev.currentSession,
        completedWords: newCompletedWords,
        learnedWordIds: newLearnedWordIds,
        isCompleted,
        completedAt: isCompleted ? new Date().toISOString() : undefined,
      };

      let newStreak = prev.streak;
      let newLongestStreak = prev.longestStreak;

      if (isCompleted && !prev.currentSession.isCompleted) {
        const result = updateStreak(prev.history, prev.streak);
        newStreak = result.streak;
        newLongestStreak = Math.max(newLongestStreak, newStreak);
      }

      return {
        ...prev,
        currentSession: updatedSession,
        streak: newStreak,
        longestStreak: newLongestStreak,
      };
    });
  }, [setState]);

  const markAllLearned = useCallback(() => {
    setState(prev => {
      if (!prev.currentSession || prev.currentSession.isCompleted) return prev;

      const allWordIds = prev.currentSession.wordIds;
      const updatedSession: DailyWordsSession = {
        ...prev.currentSession,
        completedWords: prev.currentSession.targetWords,
        learnedWordIds: allWordIds,
        isCompleted: true,
        completedAt: new Date().toISOString(),
      };

      const result = updateStreak(prev.history, prev.streak);
      const newLongestStreak = Math.max(prev.longestStreak, result.streak);

      return {
        ...prev,
        currentSession: updatedSession,
        streak: result.streak,
        longestStreak: newLongestStreak,
      };
    });
  }, [setState]);

  const refreshWords = useCallback(() => {
    if (!enabled || allCards.length === 0) return;

    const selectedWords = selectWords(allCards, targetCount, userJlptLevel);
    const newSession: DailyWordsSession = {
      date: getToday(),
      targetWords: targetCount,
      completedWords: 0,
      wordIds: selectedWords.map(w => w.id),
      learnedWordIds: [],
      isCompleted: false,
    };

    setState(prev => ({
      ...prev,
      currentSession: newSession,
      todayWords: selectedWords,
    }));
  }, [allCards, targetCount, enabled, userJlptLevel, setState]);

  return { markWordLearned, markAllLearned, refreshWords };
}
