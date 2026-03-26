// Listening Practice Types

import type { JLPTLevel } from './flashcard';

export type ListeningLessonType = 'practice' | 'conversation' | 'reading' | 'other' | 'bunpou' | 'reibun';

// Backward compat: map old lesson type strings to current ListeningLessonType values
export function normalizeLessonType(type?: string): ListeningLessonType {
  const map: Record<string, ListeningLessonType> = {
    vocabulary: 'practice',
    grammar: 'practice',
    conversation: 'conversation',
    general: 'other',
    bunpou: 'bunpou',
    reibun: 'reibun',
  };
  return map[type || ''] || (type as ListeningLessonType) || 'other';
}

export interface ListeningFolder {
  id: string;
  name: string;
  jlptLevel: JLPTLevel;
  lessonType?: ListeningLessonType; // Type of lesson: practice, conversation, reading, or other
  lessonNumber?: number; // Bài number (e.g., 1-25 for N5, 26-50 for N4)
  createdAt: Date;
  createdBy: string;
}

export type TtsMode = 'single' | 'kaiwa';

export type KaiwaGender = 'male' | 'female' | 'boy' | 'girl';

export interface KaiwaCharacter {
  id: string;
  name: string; // Display name (e.g., たなか, マリア)
  gender: KaiwaGender;
  voiceURI: string; // SpeechSynthesis voice URI
  pitch?: number; // 0.1 - 2.0, default 1.0
  rate?: number; // Multiplier for speech rate, default 1.0
  presetId?: string; // Voice preset identifier
}

export interface KaiwaLine {
  speaker: string; // Character name
  text: string; // Line content (may include furigana markup)
}

export interface ListeningAudio {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: number; // in seconds
  jlptLevel: JLPTLevel;
  folderId: string;
  textContent?: string; // Japanese text for TTS playback (single mode)
  isTextToSpeech?: boolean; // true if this entry uses browser TTS instead of audio file
  ttsMode?: TtsMode; // 'single' (default) or 'kaiwa' (conversation)
  kaiwaLines?: KaiwaLine[]; // Conversation lines for kaiwa mode
  storagePath?: string; // Firebase Storage path for audio file deletion
  createdAt: Date;
  createdBy: string;
}

export interface ListeningQuestion {
  id: string;
  audioId: string;
  question: string;
  answers: {
    text: string;
    isCorrect: boolean;
  }[];
  timestamp?: number; // optional timestamp for when question relates to
}
