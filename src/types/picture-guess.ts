// Picture Guessing Game Types - "Đuổi Hình Bắt Chữ"
// Players look at images/emojis and guess the Japanese word

import type { JLPTLevel } from './flashcard';

// Game modes
export type PictureGuessMode = 'single' | 'multiplayer';

// Hint types available
export type HintType = 'first_letter' | 'word_length' | 'meaning_hint' | 'sino_vietnamese';

// Player status in multiplayer
export type PlayerStatus = 'playing' | 'guessed' | 'timeout';

// Game status
export type PictureGuessGameStatus =
  | 'waiting'       // Waiting for players (multiplayer)
  | 'starting'      // Countdown before game
  | 'showing'       // Showing the image
  | 'guessing'      // Players guessing
  | 'revealed'      // Showing correct answer
  | 'finished';     // Game over

// A single puzzle (image + word)
export interface PicturePuzzle {
  id: string;
  imageEmojis: string;          // Emoji combination representing the word
  word: string;                 // The word to guess (vocabulary/kanji)
  reading?: string;             // Hiragana reading
  meaning: string;              // Vietnamese meaning
  sinoVietnamese?: string;      // Hán Việt
  examples?: string[];          // Example sentences
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;            // Seconds to guess
  points: number;               // Base points for correct answer
  hintsUsed: HintType[];        // Hints revealed for this puzzle
}

// Player in game
export interface PictureGuessPlayer {
  odinhId: string;
  displayName: string;
  avatar: string;
  score: number;
  correctGuesses: number;
  totalGuesses: number;
  streak: number;               // Consecutive correct answers
  hintsUsed: number;
  currentGuess?: string;        // Current input
  guessTime?: number;           // Time taken to guess (ms)
  status: PlayerStatus;
  isBot?: boolean;              // Whether this is a bot player
}

// Hint definition
export interface HintInfo {
  type: HintType;
  label: string;
  emoji: string;
  cost: number;  // Points deducted for using hint
}

// Available hints
export const HINTS: Record<HintType, HintInfo> = {
  first_letter: { type: 'first_letter', label: 'Chữ đầu', emoji: '🔤', cost: 10 },
  word_length: { type: 'word_length', label: 'Độ dài', emoji: '📏', cost: 5 },
  meaning_hint: { type: 'meaning_hint', label: 'Gợi ý nghĩa', emoji: '💡', cost: 15 },
  sino_vietnamese: { type: 'sino_vietnamese', label: 'Hán Việt', emoji: '🈳', cost: 10 },
};

// Game settings
export interface PictureGuessSettings {
  mode: PictureGuessMode;
  maxPlayers: number;           // 1 for single, 2-20 for multiplayer
  puzzleCount: number;          // Number of puzzles
  timePerPuzzle: number;        // Seconds per puzzle
  jlptLevel: JLPTLevel;
  allowHints: boolean;
  speedBonus: boolean;          // Bonus points for fast answers
  penaltyWrongAnswer: boolean;  // Deduct points for wrong answers
  contentSource: 'flashcard' | 'jlpt';
  lessonId?: string;
}

// Main game state
export interface PictureGuessGame {
  id: string;
  code: string;                 // 6-digit join code (multiplayer)
  hostId: string;
  title: string;
  settings: PictureGuessSettings;
  status: PictureGuessGameStatus;
  players: Record<string, PictureGuessPlayer>;
  puzzles: PicturePuzzle[];
  currentPuzzleIndex: number;
  puzzleStartTime?: number;
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

// Player result for rankings
export interface PictureGuessPlayerResult {
  odinhId: string;
  displayName: string;
  avatar: string;
  rank: number;
  score: number;
  correctGuesses: number;
  accuracy: number;             // Percentage
  averageTime: number;          // Average guess time
  longestStreak: number;
  hintsUsed: number;
}

// Game results
export interface PictureGuessResults {
  gameId: string;
  mode: PictureGuessMode;
  rankings: PictureGuessPlayerResult[];
  totalPuzzles: number;
  wordsLearned: PicturePuzzle[];  // For vocabulary review
}

// Create game form data
export interface CreatePictureGuessData {
  title: string;
  mode: PictureGuessMode;
  jlptLevel: JLPTLevel;
  contentSource: 'flashcard' | 'jlpt';
  lessonId?: string;
  puzzleCount: number;
  timePerPuzzle: number;
  maxPlayers: number;
  allowHints: boolean;
  speedBonus: boolean;
  penaltyWrongAnswer: boolean;
}

// Emoji mappings for common Japanese concepts
// These will be used to generate image hints
export const EMOJI_CATEGORIES: Record<string, string[]> = {
  nature: ['🌸', '🌺', '🌻', '🌹', '🌷', '🌲', '🌳', '🍀', '🌾', '🌵', '🏔️', '⛰️', '🌊', '☀️', '🌙', '⭐', '🌈', '☁️', '❄️', '🔥'],
  animals: ['🐕', '🐈', '🐦', '🐟', '🦋', '🐢', '🐰', '🐻', '🦊', '🐼', '🐵', '🐘', '🦁', '🐯', '🐮', '🐷', '🐔', '🦆', '🐸', '🦀'],
  food: ['🍚', '🍜', '🍣', '🍱', '🍙', '🍘', '🥢', '🍵', '🍶', '🍺', '🍎', '🍊', '🍇', '🍓', '🍌', '🥬', '🥕', '🍆', '🌽', '🍞'],
  objects: ['📚', '✏️', '🎒', '💻', '📱', '⌚', '👓', '🔑', '💡', '🔔', '🎵', '🎨', '📷', '🎁', '💼', '🛒', '🚗', '✈️', '🚂', '🏠'],
  activities: ['🏃', '🚶', '💃', '🏊', '⚽', '🎾', '🎮', '🎤', '📖', '✍️', '🛌', '🍳', '🧹', '🛠️', '💪', '🧘', '🎭', '🎬', '🎪', '🏕️'],
  emotions: ['😊', '😢', '😡', '😱', '😴', '🤔', '😍', '🥳', '😎', '🤗', '😤', '😰', '🙏', '💪', '❤️', '💔', '✨', '💫', '🎉', '👏'],
  weather: ['☀️', '🌤️', '⛅', '🌧️', '⛈️', '🌨️', '❄️', '💨', '🌪️', '🌈'],
  time: ['🌅', '🌄', '🌇', '🌃', '🕐', '📅', '⏰', '⌛', '🗓️'],
  places: ['🏠', '🏫', '🏥', '🏪', '🏛️', '⛩️', '🗼', '🏰', '🎡', '🏖️', '🏔️', '🌲', '🛤️', '🌉', '🚉'],
  people: ['👨', '👩', '👴', '👵', '👶', '👦', '👧', '👨‍👩‍👧', '👨‍👩‍👧‍👦', '🧑‍🤝‍🧑'],
};

// Generate emoji hint based on word meaning
export function generateEmojiHint(_meaning: string, category?: string): string {
  // Simple algorithm to pick relevant emojis
  // TODO: Implement meaning-based emoji matching for better hints
  const emojis: string[] = [];

  // Check each category for relevant emojis
  for (const [cat, catEmojis] of Object.entries(EMOJI_CATEGORIES)) {
    if (category && cat !== category) continue;

    // Pick random emojis from matching categories
    const shuffled = [...catEmojis].sort(() => Math.random() - 0.5);
    emojis.push(...shuffled.slice(0, 2));
  }

  // Return 2-4 emojis
  const shuffled = emojis.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(4, Math.max(2, shuffled.length))).join(' ');
}

// Difficulty colors
export const DIFFICULTY_COLORS = {
  easy: '#27ae60',
  medium: '#f39c12',
  hard: '#e74c3c',
};

// Custom puzzle for user-created questions
export interface CustomPicturePuzzle {
  id: string;
  imageEmojis: string;          // Emoji combination (e.g., "🏠 👨‍👩‍👧") - legacy support
  hintText?: string;            // Text hint description
  hintImages?: string[];        // Array of image URLs or base64 data
  word: string;                 // The word/phrase to guess
  reading?: string;             // Optional reading (hiragana)
  meaning: string;              // Meaning/description
  sinoVietnamese?: string;      // Hán Việt (optional)
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;            // Optional category
  createdAt: string;
  updatedAt?: string;
}

// Custom puzzle set (collection of puzzles)
export interface CustomPuzzleSet {
  id: string;
  name: string;
  description?: string;
  puzzles: CustomPicturePuzzle[];
  createdAt: string;
  updatedAt?: string;
}

// Storage key for custom puzzles
export const CUSTOM_PUZZLES_STORAGE_KEY = 'picture-guess-custom-puzzles';
export const CUSTOM_PUZZLE_SETS_STORAGE_KEY = 'picture-guess-puzzle-sets';
