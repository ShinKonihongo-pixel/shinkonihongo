// Kanji learning types

import type { JLPTLevel, MemorizationStatus } from './flashcard';

// Sample word used in kanji cards
export interface KanjiSampleWord {
  word: string;       // e.g. "食事"
  reading: string;    // e.g. "しょくじ"
  meaning: string;    // e.g. "Bữa ăn"
}

// Kanji card for study
export interface KanjiCard {
  id: string;
  character: string;         // Single kanji character
  onYomi: string[];          // On'yomi readings
  kunYomi: string[];         // Kun'yomi readings
  sinoVietnamese: string;    // Hán Việt reading (e.g. "THỰC")
  meaning: string;           // Vietnamese meaning
  mnemonic: string;          // Memory tip
  strokeCount: number;
  radicals: string[];        // Related radical characters
  jlptLevel: JLPTLevel;
  lessonId: string;
  sampleWords: KanjiSampleWord[];
  memorizationStatus?: MemorizationStatus;
  createdAt: string;
  createdBy?: string;
}

// Form data for creating/editing kanji cards (omit auto-generated fields)
export interface KanjiCardFormData {
  character: string;
  onYomi: string[];
  kunYomi: string[];
  sinoVietnamese: string;
  meaning: string;
  mnemonic: string;
  strokeCount: number;
  radicals: string[];
  jlptLevel: JLPTLevel;
  lessonId: string;
  sampleWords: KanjiSampleWord[];
}

// Kanji lesson (separate from vocab/grammar lessons)
export interface KanjiLesson {
  id: string;
  name: string;
  jlptLevel: JLPTLevel;
  parentId: string | null;
  order: number;
  createdBy?: string;
  createdAt?: string;
}

// 214 Kangxi radicals
export interface Radical {
  number: number;         // 1-214
  character: string;      // The radical character
  strokeCount: number;
  vietnameseName: string; // Vietnamese name
  meaning: string;        // English/general meaning
  variants?: string[];    // Variant forms
}
