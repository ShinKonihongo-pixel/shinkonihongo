// Image-Word Matching Game Types
// "Nối Hình Ảnh - Từ Vựng" - Match images with vocabulary words

export interface ImageWordPair {
  id: string;
  imageUrl: string;      // Base64 or URL
  vocabulary: string;    // Japanese word
  reading?: string;      // Hiragana reading
  meaning: string;       // Vietnamese meaning
}

export interface ImageWordLesson {
  id: string;
  name: string;
  description?: string;
  pairs: ImageWordPair[];
  createdAt: number;
  updatedAt: number;
}

// Game state for matching gameplay
export interface ImageWordGameState {
  lesson: ImageWordLesson;
  shuffledImages: ImageWordPair[];  // Shuffled for image column
  shuffledWords: ImageWordPair[];   // Shuffled for word column
  selectedImage: string | null;     // Selected image pair id
  selectedWord: string | null;      // Selected word pair id
  matchedPairs: string[];           // IDs of matched pairs
  wrongAttempts: number;
  startTime: number;
  endTime?: number;
  isComplete: boolean;
}

// Game results
export interface ImageWordGameResult {
  lessonId: string;
  lessonName: string;
  totalPairs: number;
  correctMatches: number;
  wrongAttempts: number;
  timeMs: number;
  score: number;
  accuracy: number;
  completedAt: number;
}

// Selection state types
export type SelectionType = 'image' | 'word';

export interface SelectionState {
  type: SelectionType;
  pairId: string;
}

// Visual states for UI
export type PairVisualState = 'default' | 'selected' | 'matched' | 'wrong';

// Shuffle array helper type
export type ShuffleFunction = <T>(array: T[]) => T[];

// ========== MULTIPLAYER TYPES ==========

export type ImageWordGameStatus = 'waiting' | 'starting' | 'playing' | 'finished';

export interface ImageWordMultiplayerPlayer {
  odinhId: string;
  displayName: string;
  avatar: string;
  role?: string;
  score: number;
  matchedPairs: string[];
  wrongAttempts: number;
  isComplete: boolean;
  completionTime?: number; // ms from game start to completion
  isBot?: boolean;
}

export interface ImageWordMultiplayerSettings {
  maxPlayers: number;
  minPlayers: number;
  totalPairs: number; // number of pairs to match
  timeLimit: number; // seconds for the whole game (0 = no limit)
}

export const DEFAULT_IMAGE_WORD_SETTINGS: ImageWordMultiplayerSettings = {
  maxPlayers: 4,
  minPlayers: 2,
  totalPairs: 10,
  timeLimit: 120,
};

export interface ImageWordMultiplayerGame {
  id: string;
  code: string;
  hostId: string;
  title: string;
  settings: ImageWordMultiplayerSettings;
  status: ImageWordGameStatus;
  players: Record<string, ImageWordMultiplayerPlayer>;
  pairs: ImageWordPair[]; // The pairs all players will match
  shuffledPairsOrder: string[]; // Shared shuffle order for consistency
  startedAt?: string;
  createdAt: string;
}

export interface ImageWordMultiplayerResults {
  gameId: string;
  rankings: Array<{
    odinhId: string;
    displayName: string;
    avatar: string;
    role?: string;
    rank: number;
    score: number;
    matchedPairs: number;
    totalPairs: number;
    wrongAttempts: number;
    completionTime?: number;
  }>;
  totalPairs: number;
  totalPlayers: number;
}

export interface CreateImageWordData {
  title: string;
  maxPlayers: number;
  totalPairs: number;
  timeLimit: number;
}
