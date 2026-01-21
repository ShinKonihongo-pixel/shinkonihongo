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
