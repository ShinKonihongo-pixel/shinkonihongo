// Quiz Battle (Đấu Trí) — type definitions
// 1v1 competitive quiz with ELO-like rating system

import type { JLPTLevel } from '../../../types/jlpt-question';
import type { BaseGame, BasePlayer, BaseSettings } from '../../../hooks/shared/game-types';

// --- Status ---

export type QuizBattleStatus = 'waiting' | 'starting' | 'playing' | 'answer_reveal' | 'finished';

// --- Player ---

export interface QuizBattlePlayer extends BasePlayer {
  odinhId: string;
  displayName: string;
  avatar: string;
  role?: string;
  score: number;                  // Cumulative in-match score
  correctCount: number;
  currentAnswer: number | null;   // Selected option index (0–3)
  answerTime: number | null;      // ms from question shown
  isReady: boolean;
  rating: number;                 // Pre-match rating for this level
}

// --- Question ---

export interface QuizBattleQuestion {
  id: string;
  sourceId: string;               // JLPTQuestion.id
  question: string;
  options: string[];              // 4 shuffled options
  correctIndex: number;
  timeLimit: number;              // seconds (default 15)
}

// --- Settings ---

export interface QuizBattleSettings extends BaseSettings {
  maxPlayers: 2;
  minPlayers: 2;
  jlptLevel: JLPTLevel;
  totalRounds: 20;
  timePerQuestion: 15;            // seconds
}

export const DEFAULT_QUIZ_BATTLE_SETTINGS: QuizBattleSettings = {
  maxPlayers: 2,
  minPlayers: 2,
  jlptLevel: 'N5',
  totalRounds: 20,
  timePerQuestion: 15,
};

// --- Game Room ---

export interface QuizBattleGame extends BaseGame {
  gameType: 'quiz-battle';
  code: string;
  hostId: string;
  title: string;
  status: QuizBattleStatus;
  jlptLevel: JLPTLevel;
  players: Record<string, QuizBattlePlayer>;
  questions: QuizBattleQuestion[];
  currentRound: number;           // 0–19
  roundStartTime: number | null;  // Unix ms timestamp for speed calc
  settings: QuizBattleSettings;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

// --- Results ---

export interface QuizBattleParticipantResult {
  odinhId: string;
  displayName: string;
  score: number;
  ratingChange: number;
  newRating: number;
}

export interface QuizBattleResults {
  gameId: string;
  jlptLevel: JLPTLevel;
  winner: QuizBattleParticipantResult | null;
  loser: QuizBattleParticipantResult | null;
  isDraw: boolean;
}

// --- Room Creation ---

export interface CreateQuizBattleRoomData {
  title: string;
  jlptLevel: JLPTLevel;
}

// --- Rating ---

export interface QuizBattleLevelStats {
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;          // 0–100
  currentStreak: number;    // positive = win streak, negative = loss streak
  bestStreak: number;
}

export interface QuizBattleRating {
  odinhId: string;
  displayName: string;
  avatar: string;
  ratings: Partial<Record<JLPTLevel, number>>;
  stats: Partial<Record<JLPTLevel, QuizBattleLevelStats>>;
  createdAt: string;
  updatedAt: string;
}
