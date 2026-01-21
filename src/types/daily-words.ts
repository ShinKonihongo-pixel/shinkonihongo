// Daily Words Learning Types - Track daily word learning progress

import type { Flashcard } from './flashcard';

// Daily words session record
export interface DailyWordsSession {
  date: string;           // YYYY-MM-DD format
  targetWords: number;    // Target for the day (5, 10, 15, 20)
  completedWords: number; // Count of words learned today
  wordIds: string[];      // IDs of words selected for today
  learnedWordIds: string[]; // IDs of words actually marked as learned
  completedAt?: string;   // ISO timestamp when completed
  isCompleted: boolean;
}

// Daily words state
export interface DailyWordsState {
  currentSession: DailyWordsSession | null;
  todayWords: Flashcard[];  // Random words selected for today
  history: DailyWordsSession[];
  streak: number;           // Consecutive days completed
  longestStreak: number;
  notificationDismissedDate?: string; // Date when notification was dismissed (YYYY-MM-DD)
}

// Daily words notification
export interface DailyWordsNotification {
  id: string;
  type: 'daily_words_reminder' | 'daily_words_complete' | 'daily_words_streak';
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}
