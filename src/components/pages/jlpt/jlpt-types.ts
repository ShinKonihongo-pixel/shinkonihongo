// JLPT page types - Local types for the JLPT practice page
// Extracted from jlpt-page.tsx for better maintainability

import type { JLPTQuestion, JLPTLevel, QuestionCategory } from '../../../types/jlpt-question';
import type { JLPTSession } from '../../../types/user';
import type { AppSettings } from '../../../hooks/use-settings';
import type { CustomTopic, CustomTopicQuestion } from '../../../types/custom-topic';

// Main component props
export interface JLPTPageProps {
  questions: JLPTQuestion[];
  onSaveJLPTSession?: (data: Omit<JLPTSession, 'id' | 'userId'>) => void;
  settings?: AppSettings;
  // Custom topics support
  customTopics?: CustomTopic[];
  customTopicQuestions?: CustomTopicQuestion[];
}

// Practice state machine
export type PracticeState = 'setup' | 'practicing' | 'result';

// Result tracking for each answered question
export interface PracticeResult {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  category: QuestionCategory;
  level: JLPTLevel;
  timeSpent: number; // milliseconds
}

// Configuration for each question category section
export interface SectionConfig {
  category: QuestionCategory;
  questionCount: number;
  available: number;
}

// Category performance breakdown for results display
export interface CategoryPerformance {
  category: QuestionCategory;
  correct: number;
  total: number;
  percentage: number;
  avgTime: number;
}

// Question history for anti-repetition algorithm
export interface QuestionHistory {
  questionId: string;
  answeredAt: number;
  sessionCount: number;
}

// Weak area tracking for personalized recommendations
export interface WeakAreaData {
  category: QuestionCategory;
  level: JLPTLevel;
  wrongCount: number;
  totalCount: number;
  lastUpdated: number;
}

// Assessment level configuration
export interface AssessmentLevel {
  min: number;
  label: string;
  color: string;
  emoji: string;
}

// Question category display configuration
export interface CategoryConfig {
  value: QuestionCategory;
  label: string;
  icon: string;
  description: string;
}
