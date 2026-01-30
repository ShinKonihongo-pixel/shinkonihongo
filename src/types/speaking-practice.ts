// Types for Speaking Practice feature - Luyện nói với AI

import type { JLPTLevel } from './kaiwa';

// Speaking practice topics
export type SpeakingTopicId =
  | 'shopping'
  | 'travel'
  | 'restaurant'
  | 'work'
  | 'hobbies'
  | 'directions'
  | 'greetings'
  | 'healthcare';

// Topic configuration
export interface SpeakingTopic {
  id: SpeakingTopicId;
  name: string;        // Japanese name
  nameVi: string;      // Vietnamese name
  icon: string;        // Display emoji
  description: string; // Brief description in Vietnamese
  color: string;       // Theme color
}

// Single dialogue line
export interface SpeakingDialogueLine {
  role: 'ai' | 'user';
  text: string;              // Main text (with furigana [kanji|reading])
  textPlain: string;         // Plain text without furigana
  translation: string;       // Vietnamese translation
}

// Generated dialogue for practice
export interface SpeakingDialogue {
  id: string;
  topic: SpeakingTopicId;
  level: JLPTLevel;
  title: string;              // Dialogue title in Japanese
  titleVi: string;            // Vietnamese title
  situation: string;          // Situation context in Vietnamese
  lines: SpeakingDialogueLine[];
  vocabulary: {
    word: string;
    reading?: string;
    meaning: string;
  }[];
  createdAt: string;
}

// Speaking evaluation result
export interface SpeakingEvaluation {
  accuracy: number;           // 0-100 pronunciation accuracy
  speakingSpeed: {
    wordsPerMinute: number;
    rating: 'slow' | 'normal' | 'fast';
  };
  emphasis: {
    score: number;            // 0-100
    feedback: string;
  };
  overallScore: number;       // 0-100
  suggestions: string[];      // Improvement suggestions
}

// Line practice result
export interface LinePracticeResult {
  lineIndex: number;
  attempts: number;
  bestAccuracy: number;
  evaluations: SpeakingEvaluation[];
}

// Session state for speaking practice
export interface SpeakingPracticeState {
  dialogue: SpeakingDialogue | null;
  currentLineIndex: number;
  phase: 'topic-selection' | 'generating' | 'listening' | 'recording' | 'evaluating' | 'result' | 'complete';
  lineResults: LinePracticeResult[];
  sessionStartTime: string | null;
}

// Progress tracking (stored in localStorage)
export interface SpeakingProgress {
  totalSessions: number;
  totalMinutes: number;
  totalLinesCompleted: number;
  averageAccuracy: number;
  streakDays: number;
  lastPracticeDate: string | null;
  weeklyProgress: {
    date: string;
    sessions: number;
    accuracy: number;
  }[];
  topicProgress: Record<SpeakingTopicId, {
    sessionsCompleted: number;
    averageAccuracy: number;
    lastPracticed: string | null;
  }>;
}

// Session summary shown after completion
export interface SpeakingSessionSummary {
  dialogue: SpeakingDialogue;
  totalTime: number;          // in seconds
  linesCompleted: number;
  totalLines: number;
  overallAccuracy: number;
  lineResults: LinePracticeResult[];
  suggestions: string[];
}
