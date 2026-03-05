// Kanji Drop multiplayer type definitions
// Follows word-scramble pattern: BasePlayer/BaseSettings/BaseGame extensions

import type { JLPTLevel } from '../../../types/flashcard';

// --- Player ---

export interface KanjiDropMultiplayerPlayer {
  odinhId: string;
  displayName: string;
  avatar: string;
  role?: string;
  score: number;
  currentLevel: number;
  clearedCount: number;
  levelsCompleted: number;
  finishedAt?: string;  // ISO string — first to finish wins
  isBot?: boolean;
  botIntelligence?: 'weak' | 'average' | 'smart' | 'genius';
}

// --- Settings ---

export interface KanjiDropMultiplayerSettings {
  maxPlayers: number;
  minPlayers: number;
  levelStart: number;
  levelEnd: number;
  jlptLevels: JLPTLevel[];
  selectedLessons?: string[];  // filter kanji by specific lessons
  seed: number;  // shared seed for identical puzzle generation
}

export const DEFAULT_KANJI_DROP_MP_SETTINGS: KanjiDropMultiplayerSettings = {
  maxPlayers: 4,
  minPlayers: 2,
  levelStart: 1,
  levelEnd: 10,
  jlptLevels: ['N5'],
  seed: 0,
};

// --- Game Room ---

export type KanjiDropGameStatus = 'waiting' | 'starting' | 'playing' | 'finished';

export interface KanjiDropMultiplayerGame {
  id: string;
  code: string;
  hostId: string;
  title: string;
  settings: KanjiDropMultiplayerSettings;
  status: KanjiDropGameStatus;
  players: Record<string, KanjiDropMultiplayerPlayer>;
  createdAt: string;
  startedAt?: string;
}

// --- Results ---

export interface KanjiDropMultiplayerResults {
  gameId: string;
  rankings: Array<{
    odinhId: string;
    displayName: string;
    avatar: string;
    role?: string;
    rank: number;
    score: number;
    levelsCompleted: number;
    clearedCount: number;
    finishedAt?: string;
  }>;
  totalLevels: number;
  totalPlayers: number;
}

// --- Room Creation Input ---

export interface CreateKanjiDropRoomData {
  title: string;
  maxPlayers: number;
  levelStart: number;
  levelEnd: number;
  jlptLevels: JLPTLevel[];
  selectedLessons?: string[];
}
